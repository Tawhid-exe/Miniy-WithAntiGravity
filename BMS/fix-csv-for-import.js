// Converts ALL 5 Google Sheets CSVs → Supabase-compatible format
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const srcDir = path.join(__dirname, 'BMS files', 'sheets tabs csv');
const outDir = path.join(__dirname, 'supabase-import');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

// Proper CSV parser that handles multiline quoted fields
function parseCSV(text) {
    const rows = [];
    let current = '';
    let inQuotes = false;
    let row = [];
    
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            row.push(current.trim());
            current = '';
        } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
            if (ch === '\r' && text[i + 1] === '\n') i++; // skip \r\n
            row.push(current.trim());
            if (row.some(c => c !== '')) rows.push(row);
            row = [];
            current = '';
        } else {
            current += ch;
        }
    }
    row.push(current.trim());
    if (row.some(c => c !== '')) rows.push(row);
    return rows;
}

// Map to store legacy cus_ IDs and map them to UUIDs
const customerIdMap = {};

// ═══════════════════════════════════════════════════════════
// 4. CUSTOMERS — no header in source, add proper columns, convert to UUID
// ═══════════════════════════════════════════════════════════
{
    const file = path.join(srcDir, 'BMS Data - Customers.csv');
    const rows = parseCSV(fs.readFileSync(file, 'utf8'));
    const header = 'id,name,email,password_hash,phone,address,created_at';
    const out = [header];
    for (let i = 0; i < rows.length; i++) {
        const c = rows[i];
        if (!c[0] || c[0].startsWith('id')) continue; // skip if header row
        
        const oldId = c[0];
        const newUuid = crypto.randomUUID();
        customerIdMap[oldId] = newUuid; // Store for orders mapping
        
        out.push([
            esc(newUuid), esc(c[1]||''), esc(c[2]||''), esc(c[3]||''),
            esc(c[4]||''), esc(c[5]||''), esc(c[6]||new Date().toISOString())
        ].join(','));
    }
    const outPath = path.join(outDir, 'customers.csv');
    fs.writeFileSync(outPath, out.join('\n'), 'utf8');
    console.log(`✅ customers: ${out.length - 1} rows → ${outPath}`);
}

// ═══════════════════════════════════════════════════════════
// 5. ORDERS — no header in source, add proper columns, update customer_id to UUID
// ═══════════════════════════════════════════════════════════
{
    const file = path.join(srcDir, 'BMS Data - Orders.csv');
    const rows = parseCSV(fs.readFileSync(file, 'utf8'));
    const header = 'id,created_at,customer_id,customer_name,phone,address,items,total_price,status';
    const out = [header];
    for (let i = 0; i < rows.length; i++) {
        const c = rows[i];
        if (!c[0] || c[0].startsWith('id')) continue;
        
        const oldCustId = c[2];
        const newCustId = customerIdMap[oldCustId] || crypto.randomUUID(); // Use mapped UUID or generate fallback
        
        out.push([
            esc(c[0]||uid()), esc(c[1]||new Date().toISOString()),
            esc(newCustId), esc(c[3]||''), esc(c[4]||''), esc(c[5]||''),
            esc(c[6]||'[]'), c[7]||'0', esc(c[8]||'Pending')
        ].join(','));
    }
    const outPath = path.join(outDir, 'orders.csv');
    fs.writeFileSync(outPath, out.join('\n'), 'utf8');
    console.log(`✅ orders: ${out.length - 1} rows → ${outPath}`);
}

// ═══════════════════════════════════════════════════════════
// 1. SALES — headers already match! Just copy with cleanup
// ═══════════════════════════════════════════════════════════
{
    const file = path.join(srcDir, 'BMS Data - Sales.csv');
    const rows = parseCSV(fs.readFileSync(file, 'utf8'));
    const header = 'id,item,cat,customer,qty,rev,cost,date,pay,due,ord,disc,notes,batch_ref';
    const out = [header];
    for (let i = 1; i < rows.length; i++) {
        const c = rows[i];
        out.push([
            esc(c[0] || uid()), esc(c[1]||''), esc(c[2]||''), esc(c[3]||''),
            c[4]||'1', c[5]||'0', c[6]||'0',
            esc(c[7]||''), esc(c[8]||'Paid'), c[9]||'0', esc(c[10]||'Completed'), c[11]||'0',
            esc(c[12]||''), esc(c[13]||'')
        ].join(','));
    }
    const outPath = path.join(outDir, 'bms_sales.csv');
    fs.writeFileSync(outPath, out.join('\n'), 'utf8');
    console.log(`✅ bms_sales: ${out.length - 1} rows → ${outPath}`);
}

// ═══════════════════════════════════════════════════════════
// 2. COSTS — rename camelCase → snake_case
// ═══════════════════════════════════════════════════════════
{
    const file = path.join(srcDir, 'BMS Data - Costs.csv');
    const rows = parseCSV(fs.readFileSync(file, 'utf8'));
    const header = 'id,item,cat,qty,total_cost,date,notes,type,missing_from_box,refund_received,batch_num';
    const out = [header];
    for (let i = 1; i < rows.length; i++) {
        const c = rows[i];
        out.push([
            esc(c[0] || uid()), esc(c[1]||''), esc(c[2]||''),
            c[3]||'0', c[4]||'0',
            esc(c[5]||''), esc(c[6]||''), esc(c[7]||'purchase'),
            c[8]||'0', c[9]||'0', c[10]||'0'
        ].join(','));
    }
    const outPath = path.join(outDir, 'bms_costs.csv');
    fs.writeFileSync(outPath, out.join('\n'), 'utf8');
    console.log(`✅ bms_costs: ${out.length - 1} rows → ${outPath}`);
}

// ═══════════════════════════════════════════════════════════
// 3. PRODUCTS — rename camelCase → snake_case
// ═══════════════════════════════════════════════════════════
{
    const file = path.join(srcDir, 'BMS Data - Products.csv');
    const rows = parseCSV(fs.readFileSync(file, 'utf8'));
    const header = 'id,name,category,description,price,sale_price,sale_ends,images,active,bms_category,quantity';
    const out = [header];
    for (let i = 1; i < rows.length; i++) {
        const c = rows[i];
        const active = (c[8]||'').toUpperCase() === 'TRUE' || c[8] === '1' ? 'true' : 'false';
        out.push([
            esc(c[0]||uid()), esc(c[1]||''), esc(c[2]||''), esc(c[3]||''),
            c[4]||'0', c[5]||'0', esc(c[6]||''), esc(c[7]||''),
            active, esc(c[9]||''), c[10]||'0'
        ].join(','));
    }
    const outPath = path.join(outDir, 'products.csv');
    fs.writeFileSync(outPath, out.join('\n'), 'utf8');
    console.log(`✅ products: ${out.length - 1} rows → ${outPath}`);
}

console.log(`\n🎯 All files ready in: ${outDir}`);
