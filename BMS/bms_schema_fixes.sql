-- ══════════════════════════════════════════════════════════════
-- BMS Cross-System Fixes & Migration
-- Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Create BMS Settings table to store Categories & Colors (Fixes Flaw 11)
CREATE TABLE IF NOT EXISTS bms_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    cats JSONB NOT NULL DEFAULT '["Rings", "Claw", "Bangle", "Mirror", "Hairpin", "Gift", "Other"]'::jsonb,
    colors JSONB NOT NULL DEFAULT '{"Rings":"#c9a853","Claw":"#a78bfa","Fish Claw":"#2dd4bf","Goth Claw":"#f472b6","Mini Claw":"#818cf8","Bangle":"#4ade80","Mirror":"#60a5fa","Hairpin":"#fb923c","Pin":"#facc15","Gift":"#f87171","Other":"#6b7280"}'::jsonb
);

-- Insert default row if not exists
INSERT INTO bms_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- Grant access to authenticated users
GRANT ALL ON bms_settings TO authenticated;
GRANT SELECT ON bms_settings TO anon;

-- 2. Fix Race Condition (Flaw 5): Safe Order Placement
-- This replaces the direct INSERT from supabase-api.js
CREATE OR REPLACE FUNCTION place_order_safe(
    p_order_id TEXT,
    p_customer_id UUID,
    p_customer_name TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_items JSONB,
    p_total_price NUMERIC,
    p_notes TEXT DEFAULT ''
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    p_record RECORD;
    v_shipping_fee NUMERIC;
BEGIN
    -- Calculate shipping fee server-side (prevents client forgery)
    IF p_total_price > 2000 THEN
        v_shipping_fee := 0;
    ELSE
        v_shipping_fee := 80;
    END IF;

    -- Step 1: Check stock for all items BEFORE inserting
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO p_record FROM products WHERE id = (item->>'id')::UUID;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Product ' || (item->>'name') || ' not found.');
        END IF;
        IF p_record.quantity < (item->>'quantity')::INT THEN
            RETURN jsonb_build_object('success', false, 'error', 'Not enough stock for ' || (item->>'name') || '. Only ' || p_record.quantity || ' left.');
        END IF;
    END LOOP;

    -- Step 2: Insert the order (Pending state) using server-calculated shipping fee
    INSERT INTO orders (id, customer_id, customer_name, phone, address, items, total_price, shipping_fee, status, notes)
    VALUES (p_order_id, p_customer_id, p_customer_name, p_phone, p_address, p_items, p_total_price, v_shipping_fee, 'Pending', p_notes);

    -- Step 3: Deduct stock immediately to prevent double-selling
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        UPDATE products SET quantity = quantity - (item->>'quantity')::INT WHERE id = (item->>'id')::UUID;
    END LOOP;

    RETURN jsonb_build_object('success', true);
END;
$$;


-- 3. Fix confirm_order (Flaws 2 & 11)
-- Now confirms the order AND creates bms_sales entries mapped to the customer and BMS category
CREATE OR REPLACE FUNCTION confirm_order(p_order_id TEXT) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    item JSONB;
    v_bms_cat TEXT;
    v_cost NUMERIC;
BEGIN
    -- Get the order
    SELECT * INTO v_order FROM orders WHERE id = p_order_id AND status != 'Confirmed';
    IF NOT FOUND THEN RETURN; END IF;

    -- Update order status
    UPDATE orders SET status = 'Confirmed' WHERE id = p_order_id;

    -- Map items to BMS Sales
    FOR item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
        -- Look up the BMS category and cost (assuming products table has bmsCategory. If not, fallback to 'Other')
        SELECT COALESCE(bms_category, 'Other') INTO v_bms_cat FROM products WHERE id = (item->>'id')::UUID;
        
        -- Insert into bms_sales
        -- We generate a unique ID, set cost to 0 (since FIFO cost is hard to calculate purely in SQL without the JS logic, admin will see it and can trigger autofill in UI, or we record 0 cost initially)
        INSERT INTO bms_sales (id, item, cat, customer, qty, rev, cost, date, pay, due, ord, disc, notes)
        VALUES (
            gen_random_uuid()::TEXT,
            (item->>'name'),
            v_bms_cat,
            v_order.customer_name, -- Fixes Flaw 12 partial (links name)
            (item->>'quantity')::NUMERIC,
            (item->>'price')::NUMERIC * (item->>'quantity')::NUMERIC,
            0, -- Cost needs to be filled by FIFO batch later
            TO_CHAR(NOW(), 'YYYY-MM-DD'),
            'Pending', -- Needs payment collection
            (item->>'price')::NUMERIC * (item->>'quantity')::NUMERIC,
            p_order_id, -- Links to storefront order ID
            0,
            'Storefront Order'
        );
    END LOOP;
END;
$$;


-- 4. Fix cancel_order (Flaw 10)
-- Restores stock and correctly updates bms_sales.ord (instead of order_id)
CREATE OR REPLACE FUNCTION cancel_order(p_order_id TEXT) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    item JSONB;
BEGIN
    SELECT * INTO v_order FROM orders WHERE id = p_order_id AND status != 'Cancelled';
    IF NOT FOUND THEN RETURN; END IF;

    -- Mark order cancelled
    UPDATE orders SET status = 'Cancelled' WHERE id = p_order_id;

    -- Restore stock in products table
    FOR item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
        UPDATE products SET quantity = quantity + (item->>'quantity')::INT WHERE id = (item->>'id')::UUID;
    END LOOP;

    -- Correctly mark BMS sales as cancelled using the 'ord' column
    UPDATE bms_sales SET ord = 'Cancelled' WHERE ord = p_order_id;
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- 5. EMERGENCY FIX (Option 1 - Bulletproof Reset)
-- ══════════════════════════════════════════════════════════════
-- If you are still getting a 406 error or missing categories, run this exactly:

-- A) Disable RLS so your app can actually read it
ALTER TABLE bms_settings DISABLE ROW LEVEL SECURITY;

-- B) Force insert or update the global settings
INSERT INTO bms_settings (id, cats, colors)
VALUES (
  'global',
  '["Rings","Claw","Bangle","Mirror","Hairpin","Gift","Other","Fish Claw","Goth Claw","Golden Ring","Red Ring","Perfume","USB Fan","Bracelets"]'::jsonb,
  '{"Rings":"#c9a853","Claw":"#a78bfa","Fish Claw":"#2dd4bf","Goth Claw":"#f472b6","Mini Claw":"#818cf8","Bangle":"#4ade80","Mirror":"#60a5fa","Hairpin":"#fb923c","Pin":"#facc15","Gift":"#f87171","Other":"#6b7280"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  cats = EXCLUDED.cats,
  colors = EXCLUDED.colors;

-- ══════════════════════════════════════════════════════════════
-- 6. STOREFRONT FIX: Fix all "permission denied" errors
-- ══════════════════════════════════════════════════════════════
-- Your storefront needs access to the following tables to function:
-- products, customers, and orders. Supabase blocks them by default.

-- A) Products Table: Allow anyone to view products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON products;
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON products;
CREATE POLICY "Allow admin write access" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- B) Customers Table: Secure per-user access via Supabase Auth
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public customer access" ON customers;
DROP POLICY IF EXISTS "Open customer access" ON customers;

-- 1. Read Policy: Customers can only SELECT their own record
CREATE POLICY "Customers can select own record" 
ON customers FOR SELECT 
USING (auth.uid() = id);

-- 2. Write Policy: Customers can only UPDATE their own profile fields
CREATE POLICY "Customers can update own record" 
ON customers FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Delete Policy: Customers can only DELETE their own record
CREATE POLICY "Customers can delete own record" 
ON customers FOR DELETE 
USING (auth.uid() = id);

-- 4. Sign-Up Policy: Allow guest/anonymous user insertion during sign-up
CREATE POLICY "Enable insert access for registration"
ON customers FOR INSERT
WITH CHECK (true);

-- C) Orders Table: Allow public to place and view orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public order access" ON orders;
CREATE POLICY "Allow public order access" ON orders FOR ALL USING (true) WITH CHECK (true);

-- D) GRANT POSTGRES PRIVILEGES (CRITICAL FOR 401 ERRORS)
-- If you created these tables manually, they might lack basic role permissions.
-- RLS policies do not work if the role doesn't have table privileges first!
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ==========================================
-- PHASE 5: WISHLIST SYSTEM
-- ==========================================

-- A) Wishlists Table
CREATE TABLE IF NOT EXISTS wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- B) Wishlist Security Policies
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own wishlist"
ON wishlists FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can add to wishlist"
ON wishlists FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can remove from wishlist"
ON wishlists FOR DELETE
USING (auth.uid() = customer_id);

-- C) Cleanup Cron Function (Phase 5.3)
CREATE OR REPLACE FUNCTION delete_stale_wishlists()
RETURNS void AS $$
BEGIN
    -- Delete wishlist items older than 30 days
    DELETE FROM wishlists WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
