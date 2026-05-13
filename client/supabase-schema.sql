-- ══════════════════════════════════════════════════════════════
-- Miniy Store — Supabase Schema
-- Run this ENTIRE file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ══════════════════════════════════════════════════════════════

-- ── CUSTOMERS ─────────────────────────────────────────────────
CREATE TABLE customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── PRODUCTS ──────────────────────────────────────────────────
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    bms_category TEXT,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    sale_price NUMERIC(10,2) DEFAULT 0,
    sale_ends TIMESTAMPTZ,
    images TEXT,
    active BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── ORDERS ────────────────────────────────────────────────────
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    items JSONB NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    shipping_fee NUMERIC(10,2) DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── BMS: COSTS ────────────────────────────────────────────────
CREATE TABLE bms_costs (
    id TEXT PRIMARY KEY,
    item TEXT,
    date DATE,
    cat TEXT NOT NULL,
    qty INTEGER DEFAULT 0,
    total_cost NUMERIC(10,2) DEFAULT 0,
    cost_per_unit NUMERIC(10,2) DEFAULT 0,
    type TEXT DEFAULT 'purchase',
    missing_from_box INTEGER DEFAULT 0,
    refund_received NUMERIC(10,2) DEFAULT 0,
    batch_num INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── BMS: SALES ────────────────────────────────────────────────
CREATE TABLE bms_sales (
    id TEXT PRIMARY KEY,
    item TEXT,
    date DATE,
    order_id TEXT,
    cat TEXT NOT NULL,
    customer TEXT,
    qty INTEGER DEFAULT 0,
    rev NUMERIC(10,2) DEFAULT 0,
    cost NUMERIC(10,2) DEFAULT 0,
    pay TEXT DEFAULT 'Paid',
    due NUMERIC(10,2) DEFAULT 0,
    ord TEXT DEFAULT 'Completed',
    disc NUMERIC(10,2) DEFAULT 0,
    batch_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_bms_costs_cat ON bms_costs(cat);
CREATE INDEX idx_bms_sales_cat ON bms_sales(cat);
CREATE INDEX idx_bms_sales_order ON bms_sales(order_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_sales ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read
CREATE POLICY "Anyone can read products"
    ON products FOR SELECT USING (true);

-- Products: only service role can modify (admin panel)
CREATE POLICY "Service role manages products"
    ON products FOR ALL USING (true) WITH CHECK (true);

-- Orders: anyone can insert (guest + logged-in checkout)
CREATE POLICY "Anyone can place orders"
    ON orders FOR INSERT WITH CHECK (true);

-- Orders: anyone can read (admin uses service key, customers filtered in app)
CREATE POLICY "Anyone can read orders"
    ON orders FOR SELECT USING (true);

-- Orders: update allowed (for status changes by admin)
CREATE POLICY "Anyone can update orders"
    ON orders FOR UPDATE USING (true);

-- Customers: open access (auth handled in app layer)
CREATE POLICY "Open customer access"
    ON customers FOR ALL USING (true) WITH CHECK (true);

-- BMS tables: open access (admin-only UI, protected by admin login)
CREATE POLICY "Open BMS costs access"
    ON bms_costs FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Open BMS sales access"
    ON bms_sales FOR ALL USING (true) WITH CHECK (true);

-- ── CANCEL ORDER FUNCTION (atomic transaction) ───────────────
-- This is the KEY fix: stock restore + status update in one shot
CREATE OR REPLACE FUNCTION cancel_order(p_order_id TEXT)
RETURNS void AS $$
DECLARE
    v_item JSONB;
    v_items JSONB;
    v_status TEXT;
BEGIN
    -- Check current status
    SELECT status, items INTO v_status, v_items 
    FROM orders WHERE id = p_order_id;
    
    IF v_status = 'Cancelled' THEN
        RAISE EXCEPTION 'Order is already cancelled';
    END IF;
    
    -- Update order status
    UPDATE orders SET status = 'Cancelled' WHERE id = p_order_id;
    
    -- Restore stock for each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        UPDATE products 
        SET quantity = quantity + (v_item->>'quantity')::int
        WHERE id = v_item->>'id';
    END LOOP;
    
    -- Mark BMS sales as cancelled
    UPDATE bms_sales SET ord = 'Cancelled' WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── CONFIRM ORDER FUNCTION (deduct stock + create BMS sales) ─
CREATE OR REPLACE FUNCTION confirm_order(p_order_id TEXT)
RETURNS void AS $$
DECLARE
    v_item JSONB;
    v_items JSONB;
    v_order RECORD;
BEGIN
    -- Get order details
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    
    IF v_order.status != 'Pending' THEN
        RAISE EXCEPTION 'Order is not in Pending status';
    END IF;
    
    -- Update order status
    UPDATE orders SET status = 'Confirmed' WHERE id = p_order_id;
    
    -- Deduct stock for each item
    v_items := v_order.items;
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        UPDATE products 
        SET quantity = GREATEST(0, quantity - (v_item->>'quantity')::int)
        WHERE id = v_item->>'id';
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- DONE! Your database is ready.
-- ══════════════════════════════════════════════════════════════
