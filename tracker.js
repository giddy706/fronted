const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

// Simple random session ID generator
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

router.post('/track', async (req, res) => {
    try {
        const { page_url, page_title, referrer } = req.body;
        if (!page_url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        // Get or set session_id
        let sessionId = req.cookies.session_id;
        if (!sessionId) {
            sessionId = generateSessionId();
            res.cookie('session_id', sessionId, { maxAge: 1000 * 60 * 60 * 24 * 365, httpOnly: true }); // 1 year cookie
        }

        // Extract user_id if token is present
        let userId = null;
        const token = req.cookies.token;
        if (token) {
            try {
                const verified = jwt.verify(token, process.env.JWT_SECRET || 'skillpath_super_secret_key_2026');
                userId = verified.id;
            } catch (err) {
                // Ignore JWT verify errors here, track as anonymous
            }
        }

        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'];

        const db = await getDB();
        await db.run(
            `INSERT INTO traffic_logs (session_id, ip_address, page_url, page_title, referrer, user_agent, user_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [sessionId, ip, page_url, page_title || '', referrer || '', userAgent || '', userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Traffic tracking error:', err);
        res.status(500).json({ success: false, error: 'Failed to log traffic' });
    }
});

module.exports = { router };
