// ═══════════════════════════════════════════════════════════════
//  sheets.js — Read-only data fetching via Apps Script
//  Stock shown to customers = quantity field on the product row
//  BMS inventory is only touched when an order is confirmed
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function readTab(tabName) {
    const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'readTab', tabName }),
    });
    if (!res.ok) throw new Error(`Failed to read tab "${tabName}": ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(`Failed to read tab "${tabName}": ${data.error}`);
    return data.rows || [];
}

// ── Products ──────────────────────────────────────────────────
export async function fetchProducts() {
    const rows = await readTab('Products');
    const now = new Date();
    return rows
        .filter(p => String(p.active).toUpperCase() === 'TRUE')
        .map(p => {
            const price = parseFloat(p.price) || 0;
            const salePrice = parseFloat(p.saleprice) || 0;
            const saleEnds = p.saleends ? new Date(p.saleends) : null;
            const isOnSale = salePrice > 0 && saleEnds && saleEnds > now;
            // quantity = stock allocated to THIS product listing by admin
            const quantity = parseInt(p.quantity) || 0;
            return {
                id: p.id,
                name: p.name,
                category: p.category,
                bmsCategory: String(p.bmscategory || '').trim(),
                description: p.description,
                price,
                salePrice: isOnSale ? salePrice : null,
                saleEnds: isOnSale ? saleEnds : null,
                isOnSale,
                effectivePrice: isOnSale ? salePrice : price,
                images: p.images ? String(p.images).split(',').map(u => u.trim()).filter(Boolean) : [],
                active: true,
                stock: quantity,
                inStock: quantity > 0,
            };
        });
}

export async function fetchSingleProduct(id) {
    const products = await fetchProducts();
    return products.find(p => p.id === id) || null;
}

// ── fetchProductsWithStock — stock already on product, no extra call needed
export async function fetchProductsWithStock() {
    return fetchProducts();
}

// ── fetchInventory — still used by ProductDetail for display only ─
// Returns BMS raw inventory per category (not product quantity)
export async function fetchInventory() {
    const costs = await readTab('Costs');
    const salesRows = await readTab('Sales');

    const norm = v => String(v || '').trim().toLowerCase();

    const categories = [...new Set(
        costs
            .filter(c => { const t = norm(c.type); return t === '' || t === 'purchase'; })
            .map(c => String(c.cat || '').trim())
            .filter(Boolean)
    )];

    const inventory = {};

    categories.forEach(cat => {
        const catNorm = norm(cat);

        const purchases = costs
            .filter(c => { const t = norm(c.type); return norm(c.cat) === catNorm && (t === '' || t === 'purchase'); })
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        // Exclude cancelled orders from the sold count
        const soldQty = salesRows.filter(s => norm(s.cat) === catNorm && norm(s.status) !== 'cancelled').reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
        const refundedQty = costs.filter(c => norm(c.cat) === catNorm && norm(c.type) === 'refund').reduce((a, c) => a + (parseInt(c.qty) || 0), 0);
        const missingQty = costs.filter(c => norm(c.cat) === catNorm && norm(c.type) === 'missing').reduce((a, c) => a + (parseInt(c.missingfrombox) || 0), 0);

        let toDeduct = soldQty + refundedQty + missingQty;
        let totalRemaining = 0;

        purchases.forEach(b => {
            const effQty = Math.max(0, (parseInt(b.qty) || 0) - (parseInt(b.missingfrombox) || 0));
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