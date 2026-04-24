// ═══════════════════════════════════════════════════════════════
//  appsScript.js — All write operations via Google Apps Script
//  The Apps Script Web App acts as a free serverless backend
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function post(action, payload = {}) {
    const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) throw new Error(`Apps Script error: ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Unknown error from Apps Script');
    return data;
}

// ── Customer Auth ─────────────────────────────────────────────
export async function registerCustomer({ name, email, password, phone, address }) {
    return post('register', { name, email, password, phone, address });
}

export async function loginCustomer({ email, password }) {
    return post('login', { email, password });
}

export async function fetchCustomerProfile(customerId) {
    return post('getProfile', { customerId });
}

export async function updateCustomerProfile(customerId, updates) {
    return post('updateProfile', { customerId, ...updates });
}

// ── Orders ────────────────────────────────────────────────────
export async function submitOrder({ customerId, customerName, phone, address, items, totalPrice, notes }) {
    return post('submitOrder', { customerId, customerName, phone, address, items, totalPrice, notes });
}

export async function fetchCustomerOrders(customerId) {
    return post('getOrders', { customerId });
}

// ── Admin ─────────────────────────────────────────────────────
export async function adminAuth(password) {
    return post('adminAuth', { password });
}

export async function adminGetOrders() {
    return post('adminGetOrders', {});
}

export async function adminUpdateOrderStatus(orderId, status) {
    return post('adminUpdateOrder', { orderId, status });
}

export async function adminAddProduct(productData) {
    return post('adminAddProduct', productData);
}

export async function adminUpdateProduct(id, updates) {
    return post('adminUpdateProduct', { id, ...updates });
}

export async function adminDeleteProduct(id) {
    return post('adminDeleteProduct', { id });
}

// ── Admin Product Reads (bypasses public Sheets API) ──────────
export async function adminFetchProducts() {
    const data = await post('getProducts', {});
    const now = new Date();
    return (data.products || [])
        .filter(p => String(p.active).toUpperCase() === 'TRUE')
        .map(p => {
            const price = parseFloat(p.price) || 0;
            const salePrice = parseFloat(p.saleprice) || 0;
            const saleEnds = p.saleends ? new Date(p.saleends) : null;
            const isOnSale = salePrice > 0 && saleEnds && saleEnds > now;
            return {
                id: p.id,
                name: p.name,
                category: p.category,
                bmsCategory: p.bmscategory || p.category,
                description: p.description,
                price,
                salePrice: isOnSale ? salePrice : null,
                saleEnds: isOnSale ? saleEnds : null,
                isOnSale,
                effectivePrice: isOnSale ? salePrice : price,
                images: p.images ? String(p.images).split(',').map(u => u.trim()).filter(Boolean) : [],
                active: true,
            };
        });
}

export async function adminFetchBmsCategories() {
    const data = await post('getBmsCategories', {});
    return data.categories || [];
}