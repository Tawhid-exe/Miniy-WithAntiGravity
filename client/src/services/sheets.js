// ═══════════════════════════════════════════════════════════════
//  sheets.js — Read-only data fetching via Apps Script
//  Routes all reads through the Apps Script backend so the
//  Google Sheet can stay private (no public API key needed)
// ═══════════════════════════════════════════════════════════════

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Internal helper — reads any tab through Apps Script backend
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
                // normalise bmsCategory: trim + use category as fallback
                bmsCategory: String(p.bmscategory || p.category || '').trim(),
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

// ── Inventory (FIFO) ──────────────────────────────────────────
export async function fetchInventory() {
    const costs = await readTab('Costs');
    const salesRows = await readTab('Sales');

    // Normalise helper — trim + lowercase for safe comparison
    const norm = v => String(v || '').trim().toLowerCase();

    // Collect all unique purchase categories from Costs tab
    const categories = [...new Set(
        costs
            .filter(c => {
                const t = norm(c.type);
                return t === '' || t === 'purchase';
            })
            .map(c => String(c.cat || '').trim())
            .filter(Boolean)
    )];

    const inventory = {};

    categories.forEach(cat => {
        const catNorm = norm(cat);

        const purchases = costs
            .filter(c => {
                const t = norm(c.type);
                return norm(c.cat) === catNorm && (t === '' || t === 'purchase');
            })
            .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));

        const refunds = costs.filter(c =>
            norm(c.cat) === catNorm && norm(c.type) === 'refund'
        );
        const missing = costs.filter(c =>
            norm(c.cat) === catNorm && norm(c.type) === 'missing'
        );

        const soldQty = salesRows
            .filter(s => norm(s.cat) === catNorm)
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

        // Store with ORIGINAL cat name (not lowercased) so lookup works
        inventory[cat] = { totalRemaining, soldQty };
    });

    return inventory;
}

// ── Enrich products with stock ────────────────────────────────
export async function fetchProductsWithStock() {
    const [products, inventory] = await Promise.all([fetchProducts(), fetchInventory()]);

    // Build a lowercase → original key map so lookup is case-insensitive
    const invLower = {};
    Object.keys(inventory).forEach(k => {
        invLower[k.toLowerCase().trim()] = inventory[k];
    });

    return products.map(p => {
        const key = (p.bmsCategory || p.category || '').toLowerCase().trim();
        const inv = invLower[key] || { totalRemaining: 0 };
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