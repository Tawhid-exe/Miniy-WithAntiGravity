// ═══════════════════════════════════════════════════════════════
//  supabase-api.js — All API functions (replaces appsScript.js + sheets.js)
//  Every function keeps the SAME signature so page components
//  only need import path changes, zero logic changes.
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';

// ── Helpers ───────────────────────────────────────────────────
function hashPassword(password) {
    // Simple hash for client-side auth (not crypto-grade, but matches
    // the current Apps Script approach — passwords stored as hashes)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
}

// ══════════════════════════════════════════════════════════════
// CUSTOMER AUTH (replaces Apps Script register/login)
// ══════════════════════════════════════════════════════════════

export async function registerCustomer({ name, email, password, phone, address }) {
    // Check if email already exists
    const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

    if (existing) throw new Error('An account with this email already exists.');

    const { data, error } = await supabase
        .from('customers')
        .insert({
            email: email.toLowerCase().trim(),
            password_hash: hashPassword(password),
            name: name.trim(),
            phone: phone?.trim() || '',
            address: address?.trim() || '',
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return {
        success: true,
        customer: {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
        },
    };
}

export async function loginCustomer({ email, password }) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('password_hash', hashPassword(password))
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid email or password.');

    return {
        success: true,
        customer: {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
        },
    };
}

export async function fetchCustomerProfile(customerId) {
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

    if (error) throw new Error(error.message);
    return { success: true, customer: data };
}

export async function updateCustomerProfile(customerId, updates) {
    const allowed = {};
    if (updates.name !== undefined) allowed.name = updates.name;
    if (updates.phone !== undefined) allowed.phone = updates.phone;
    if (updates.address !== undefined) allowed.address = updates.address;

    const { error } = await supabase
        .from('customers')
        .update(allowed)
        .eq('id', customerId);

    if (error) throw new Error(error.message);
    return { success: true };
}

// ══════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════

export async function submitOrder({ customerId, customerName, phone, address, items, totalPrice, notes }) {
    const orderId = 'ORD-' + Date.now();
    const shippingFee = totalPrice > 2000 ? 0 : 80;

    const { data, error } = await supabase.rpc('place_order_safe', {
        p_order_id: orderId,
        p_customer_id: customerId || null,
        p_customer_name: customerName,
        p_phone: phone,
        p_address: address,
        p_items: items,
        p_total_price: totalPrice,
        p_shipping_fee: shippingFee,
        p_notes: notes || ''
    });

    if (error) throw new Error(error.message);
    if (data && !data.success) throw new Error(data.error || 'Failed to place order.');

    return { success: true, orderId };
}

export async function fetchCustomerOrders(customerId) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const orders = (data || []).map(o => ({
        orderId: o.id,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        items: o.items,
        totalPrice: o.total_price,
        status: o.status,
        notes: o.notes,
        date: o.created_at,
    }));

    return { success: true, orders };
}

// ══════════════════════════════════════════════════════════════
// ADMIN AUTH — handled server-side via /api/admin-auth
// AdminLogin.jsx calls the API route directly.
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ADMIN ORDERS
// ══════════════════════════════════════════════════════════════

export async function adminGetOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const orders = (data || []).map(o => ({
        orderId: o.id,
        customerName: o.customer_name,
        phone: o.phone,
        address: o.address,
        items: o.items,
        totalPrice: o.total_price,
        status: o.status,
        notes: o.notes,
        date: o.created_at,
    }));

    return { success: true, orders };
}

export async function adminUpdateOrderStatus(orderId, status, items = []) {
    if (status === 'Cancelled') {
        // Use the atomic database function — restores stock + marks BMS sales
        const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
        if (error) throw new Error(error.message);
    } else if (status === 'Confirmed') {
        // Use the atomic database function — deducts stock
        const { error } = await supabase.rpc('confirm_order', { p_order_id: orderId });
        if (error) throw new Error(error.message);
    } else {
        // Simple status update (e.g., Delivered)
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);
        if (error) throw new Error(error.message);
    }

    return { success: true };
}

// ══════════════════════════════════════════════════════════════
// ADMIN PRODUCTS
// ══════════════════════════════════════════════════════════════

export async function adminAddProduct(productData) {
    const row = {
        id: productData.id || 'prd-' + Date.now(),
        name: productData.name,
        category: productData.category || '',
        bms_category: productData.bmsCategory || '',
        description: productData.description || '',
        price: parseFloat(productData.price) || 0,
        sale_price: parseFloat(productData.salePrice) || 0,
        sale_ends: productData.saleEnds || null,
        images: productData.images || '',
        active: productData.active !== false,
        quantity: parseInt(productData.quantity) || 0,
    };

    const { error } = await supabase.from('products').insert(row);
    if (error) throw new Error(error.message);
    return { success: true };
}

export async function adminUpdateProduct(id, updates) {
    const row = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.category !== undefined) row.category = updates.category;
    if (updates.bmsCategory !== undefined) row.bms_category = updates.bmsCategory;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.price !== undefined) row.price = parseFloat(updates.price) || 0;
    if (updates.salePrice !== undefined) row.sale_price = parseFloat(updates.salePrice) || 0;
    if (updates.saleEnds !== undefined) row.sale_ends = updates.saleEnds || null;
    if (updates.images !== undefined) row.images = updates.images;
    if (updates.active !== undefined) row.active = updates.active;
    if (updates.quantity !== undefined) row.quantity = parseInt(updates.quantity) || 0;

    const { error } = await supabase.from('products').update(row).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
}

export async function adminDeleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
}

// Transform raw DB row to the shape the frontend expects
function transformProduct(p) {
    const now = new Date();
    const price = parseFloat(p.price) || 0;
    const salePrice = parseFloat(p.sale_price) || 0;
    const saleEnds = p.sale_ends ? new Date(p.sale_ends) : null;
    const isOnSale = salePrice > 0 && saleEnds && saleEnds > now;
    const quantity = parseInt(p.quantity) || 0;

    return {
        id: p.id,
        name: p.name,
        category: p.category || '',
        bmsCategory: (p.bms_category || '').trim(),
        description: p.description || '',
        price,
        salePrice: isOnSale ? salePrice : null,
        saleEnds: isOnSale ? saleEnds : null,
        isOnSale,
        effectivePrice: isOnSale ? salePrice : price,
        images: p.images ? String(p.images).split(',').map(u => u.trim()).filter(Boolean) : [],
        active: p.active !== false,
        quantity,
        stock: quantity,
        inStock: quantity > 0,
    };
}

export async function adminFetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).filter(p => p.active !== false).map(transformProduct);
}

export async function adminFetchBmsCategories() {
    const { data, error } = await supabase
        .from('bms_costs')
        .select('cat')
        .eq('type', 'purchase');

    if (error) throw new Error(error.message);

    const cats = [...new Set((data || []).map(r => r.cat).filter(Boolean))];
    return cats;
}

export async function adminFetchBmsStock() {
    // Calculate remaining stock per BMS category using FIFO logic
    const { data: costs } = await supabase.from('bms_costs').select('*');
    const { data: salesRows } = await supabase.from('bms_sales').select('*');

    const norm = v => String(v || '').trim().toLowerCase();
    const allCosts = costs || [];
    const allSales = salesRows || [];

    const categories = [...new Set(
        allCosts
            .filter(c => { const t = norm(c.type); return t === '' || t === 'purchase'; })
            .map(c => String(c.cat || '').trim())
            .filter(Boolean)
    )];

    const stock = {};

    categories.forEach(cat => {
        const catNorm = norm(cat);
        const purchases = allCosts
            .filter(c => { const t = norm(c.type); return norm(c.cat) === catNorm && (t === '' || t === 'purchase'); })
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        const soldQty = allSales
            .filter(s => norm(s.cat) === catNorm && norm(s.ord) !== 'cancelled')
            .reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
        const refundedQty = allCosts
            .filter(c => norm(c.cat) === catNorm && norm(c.type) === 'refund')
            .reduce((a, c) => a + (parseInt(c.qty) || 0), 0);
        const missingQty = allCosts
            .filter(c => norm(c.cat) === catNorm && norm(c.type) === 'missing')
            .reduce((a, c) => a + (parseInt(c.missing_from_box) || 0), 0);

        let toDeduct = soldQty + refundedQty + missingQty;
        let totalRemaining = 0;

        purchases.forEach(b => {
            const effQty = Math.max(0, (parseInt(b.qty) || 0) - (parseInt(b.missing_from_box) || 0));
            const used = Math.min(toDeduct, effQty);
            toDeduct = Math.max(0, toDeduct - effQty);
            totalRemaining += effQty - used;
        });

        stock[cat] = totalRemaining;
    });

    return stock;
}

// ══════════════════════════════════════════════════════════════
// STOREFRONT PRODUCTS (replaces sheets.js)
// ══════════════════════════════════════════════════════════════

export async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(transformProduct);
}

export async function fetchSingleProduct(id) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return transformProduct(data);
}

export async function fetchProductsWithStock() {
    return fetchProducts();
}

export async function fetchInventory() {
    // BMS inventory view — same FIFO logic as adminFetchBmsStock
    // but returns {cat: {totalRemaining, soldQty}} format
    const { data: costs } = await supabase.from('bms_costs').select('*');
    const { data: salesRows } = await supabase.from('bms_sales').select('*');

    const norm = v => String(v || '').trim().toLowerCase();
    const allCosts = costs || [];
    const allSales = salesRows || [];

    const categories = [...new Set(
        allCosts
            .filter(c => { const t = norm(c.type); return t === '' || t === 'purchase'; })
            .map(c => String(c.cat || '').trim())
            .filter(Boolean)
    )];

    const inventory = {};

    categories.forEach(cat => {
        const catNorm = norm(cat);
        const purchases = allCosts
            .filter(c => { const t = norm(c.type); return norm(c.cat) === catNorm && (t === '' || t === 'purchase'); })
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        const soldQty = allSales
            .filter(s => norm(s.cat) === catNorm && norm(s.ord) !== 'cancelled')
            .reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
        const refundedQty = allCosts
            .filter(c => norm(c.cat) === catNorm && norm(c.type) === 'refund')
            .reduce((a, c) => a + (parseInt(c.qty) || 0), 0);
        const missingQty = allCosts
            .filter(c => norm(c.cat) === catNorm && norm(c.type) === 'missing')
            .reduce((a, c) => a + (parseInt(c.missing_from_box) || 0), 0);

        let toDeduct = soldQty + refundedQty + missingQty;
        let totalRemaining = 0;

        purchases.forEach(b => {
            const effQty = Math.max(0, (parseInt(b.qty) || 0) - (parseInt(b.missing_from_box) || 0));
            const used = Math.min(toDeduct, effQty);
            toDeduct = Math.max(0, toDeduct - effQty);
            totalRemaining += effQty - used;
        });

        inventory[cat] = { totalRemaining, soldQty };
    });

    return inventory;
}

export async function fetchCategories() {
    const products = await fetchProducts();
    return [...new Set(products.map(p => p.category).filter(Boolean))];
}
