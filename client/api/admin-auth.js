// ═══════════════════════════════════════════════════════════════
//  api/admin-auth.js — Vercel serverless function
//  Checks the admin password SERVER-SIDE so it never leaks to
//  the browser bundle. The ADMIN_PASSWORD env var has no VITE_
//  prefix, so Vite will never embed it in the JS bundle.
// ═══════════════════════════════════════════════════════════════

export default function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { password } = req.body || {};

    if (!password) {
        return res.status(400).json({ success: false, error: 'Password required' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        return res.status(500).json({ success: false, error: 'Admin password not configured on server' });
    }

    if (password !== adminPassword) {
        return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    return res.status(200).json({ success: true });
}
