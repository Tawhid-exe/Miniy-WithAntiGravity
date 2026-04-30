/**
 * generate-sitemap.js
 * Runs BEFORE vite build. Fetches all products from Google Apps Script
 * and generates a sitemap.xml in the public/ directory.
 *
 * Usage: node scripts/generate-sitemap.js
 * Requires: VITE_APPS_SCRIPT_URL in .env.local (or env variable on Vercel)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://minivy.vercel.app';

// Read the Apps Script URL from .env.local or environment
function getAppsScriptUrl() {
    // First check environment variable (works on Vercel)
    if (process.env.VITE_APPS_SCRIPT_URL) {
        return process.env.VITE_APPS_SCRIPT_URL;
    }
    // Fallback: read from .env.local
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const match = envContent.match(/VITE_APPS_SCRIPT_URL=(.+)/);
        if (match) return match[1].trim();
    }
    return null;
}

async function fetchProducts(scriptUrl) {
    const res = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'getProducts' }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch products');
    return (data.products || []).filter(p => String(p.active).toUpperCase() === 'TRUE');
}

function buildSitemap(products) {
    const today = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/products', priority: '0.9', changefreq: 'daily' },
        { loc: '/auth', priority: '0.3', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
        xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add product pages
    for (const product of products) {
        xml += `  <url>
    <loc>${SITE_URL}/product/${product.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    xml += `</urlset>`;
    return xml;
}

async function main() {
    console.log('[sitemap] Starting sitemap generation...');

    const scriptUrl = getAppsScriptUrl();
    if (!scriptUrl || scriptUrl === 'your_google_apps_script_url_here') {
        console.warn('[sitemap] No Apps Script URL found. Generating static-only sitemap.');
        const xml = buildSitemap([]);
        const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
        fs.writeFileSync(outPath, xml, 'utf-8');
        console.log(`[sitemap] Written to ${outPath} (static pages only)`);
        return;
    }

    try {
        const products = await fetchProducts(scriptUrl);
        console.log(`[sitemap] Fetched ${products.length} active products`);
        const xml = buildSitemap(products);
        const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
        fs.writeFileSync(outPath, xml, 'utf-8');
        console.log(`[sitemap] Written to ${outPath} (${products.length} products + static pages)`);
    } catch (err) {
        console.error('[sitemap] Failed to fetch products:', err.message);
        console.log('[sitemap] Generating static-only sitemap as fallback...');
        const xml = buildSitemap([]);
        const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
        fs.writeFileSync(outPath, xml, 'utf-8');
    }
}

main();
