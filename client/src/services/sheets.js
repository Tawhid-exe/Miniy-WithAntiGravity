// ═══════════════════════════════════════════════════════════════
//  sheets.js — Read-only data fetching via Apps Script
//  Routes all reads through the Apps Script backend so the
//  Google Sheet can stay private (no public API key needed)
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Internal helper — mirrors appsScript.js but only for reads
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

export async function fetchSingleProduct(id) {
    const products = await fetchProducts();
    return products.find(p => p.id === id) || null;
}

// ── Inventory (FIFO — same logic as BMS) ─────────────────────
export async function fetchInventory() {
    const costs = await readTab('Costs');
    const salesRows = await readTab('Sales');

    const categories = [...new Set(
        costs.filter(c => (c.type || 'purchase') === 'purchase').map(c => c.cat)
    )];

    const inventory = {};
    categories.forEach(cat => {
        const catClean = String(cat || '').trim();
        if (!catClean) return;

        const purchases = costs
            .filter(c => String(c.cat || '').trim() === catClean && String(c.type || 'purchase').toLowerCase().trim() === 'purchase')
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        const refunds = costs.filter(c => String(c.cat || '').trim() === catClean && String(c.type || '').toLowerCase().trim() === 'refund');
        const missing = costs.filter(c => String(c.cat || '').trim() === catClean && String(c.type || '').toLowerCase().trim() === 'missing');

        const soldQty = salesRows
            .filter(s => String(s.cat || '').trim() === catClean)
            .reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
        const refundedQty = refunds.reduce((a, c) => a + (parseInt(c.qty) || 0), 0);
        const missingQty = missing.reduce((a, c) => a + (parseInt(c.missingfrombox) || 0), 0);

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

// ── Enrich products with stock data ──────────────────────────
export async function fetchProductsWithStock() {
    const [products, inventory] = await Promise.all([fetchProducts(), fetchInventory()]);
    return products.map(p => {
        const inv = inventory[p.bmsCategory || p.category] || { totalRemaining: 0 };
        return {
            ...p,
            stock: inv.totalRemaining,
            inStock: inv.totalRemaining > 0,
        };
    });
}

// ── Categories list ───────────────────────────────────────────
export async function fetchCategories() {
    const products = await fetchProducts();
    return [...new Set(products.map(p => p.category).filter(Boolean))];
}