// ═══════════════════════════════════════════════════════════════
//  sheets.js — Read-only Google Sheets data fetching
//  Uses Sheets API v4 with a public API key (safe for frontend)
// ═══════════════════════════════════════════════════════════════

const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY;
const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

async function readTab(tabName) {
    const url = `${BASE}/${encodeURIComponent(tabName)}?key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to read tab "${tabName}": ${res.statusText}`);
    const data = await res.json();
    const [headers, ...rows] = data.values || [];
    if (!headers) return [];
    return rows.map(row => {
        const obj = {};
        headers.forEach((h, i) => { 
            const key = String(h || '').trim();
            if (key) obj[key] = row[i] ?? ''; 
        });
        return obj;
    });
}

// ── Products ──────────────────────────────────────────────────
export async function fetchProducts() {
    const rows = await readTab('Products');
    const now = new Date();
    return rows
        .filter(p => String(p.active).toUpperCase() === 'TRUE')
        .map(p => {
            const price = parseFloat(p.price) || 0;
            const salePrice = parseFloat(p.salePrice) || 0;
            const saleEnds = p.saleEnds ? new Date(p.saleEnds) : null;
            const isOnSale = salePrice > 0 && saleEnds && saleEnds > now;
            return {
                id: p.id,
                name: p.name,
                category: p.category,
                bmsCategory: p.bmsCategory || p.category,
                description: p.description,
                price,
                salePrice: isOnSale ? salePrice : null,
                saleEnds: isOnSale ? saleEnds : null,
                isOnSale,
                effectivePrice: isOnSale ? salePrice : price,
                images: p.images ? p.images.split(',').map(u => u.trim()).filter(Boolean) : [],
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
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        
        const refunds = costs.filter(c => String(c.cat || '').trim() === catClean && String(c.type || '').toLowerCase().trim() === 'refund');
        const missing = costs.filter(c => String(c.cat || '').trim() === catClean && String(c.type || '').toLowerCase().trim() === 'missing');

        const soldQty = salesRows
            .filter(s => String(s.cat || '').trim() === catClean)
            .reduce((a, s) => a + (parseInt(s.qty) || 0), 0);
        const refundedQty = refunds.reduce((a, c) => a + (parseInt(c.qty) || 0), 0);
        const missingQty = missing.reduce((a, c) => a + (parseInt(c.qty) || 0), 0);

        let toDeduct = soldQty + refundedQty + missingQty;
        let totalRemaining = 0;

        purchases.forEach(b => {
            const effQty = Math.max(0, (parseInt(b.qty) || 0) - (parseInt(b.missingFromBox) || 0));
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
