/**
 * generate-sitemap.js
 * Runs BEFORE vite build. Fetches all products from Supabase
 * and generates a sitemap.xml in the public/ directory.
 *
 * Usage: node scripts/generate-sitemap.js
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (or env variables on Vercel)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_URL = 'https://minivy.vercel.app';

function getEnvVars() {
    const env = { url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_ANON_KEY };
    const envPath = path.resolve(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
        const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
        if (urlMatch) env.url = urlMatch[1].trim();
        if (keyMatch) env.key = keyMatch[1].trim();
    }
    return env;
}

async function fetchProducts(url, key) {
    const res = await fetch(`${url}/rest/v1/products?active=eq.true&select=id`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data;
}

function buildSitemap(products) {
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/products', priority: '0.9', changefreq: 'daily' },
        { loc: '/auth', priority: '0.3', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
        xml += `  <url>\n    <loc>${SITE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    for (const product of products) {
        xml += `  <url>\n    <loc>${SITE_URL}/product/${product.id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    xml += `</urlset>`;
    return xml;
}

async function main() {
    console.log('[sitemap] Starting sitemap generation...');

    const env = getEnvVars();
    if (!env.url || !env.key) {
        console.warn('[sitemap] No Supabase credentials found. Generating static-only sitemap.');
        const xml = buildSitemap([]);
        const outPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
        fs.writeFileSync(outPath, xml, 'utf-8');
        console.log(`[sitemap] Written to ${outPath} (static pages only)`);
        return;
    }

    try {
        const products = await fetchProducts(env.url, env.key);
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
