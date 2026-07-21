const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // Attempt to get token from Authorization header or HTTP-only cookies
    let token = req.cookies.token;
    
    if (!token && req.headers['authorization']) {
        const authHeader = req.headers['authorization'];
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }

    if (!token) {
        return res.status(418).json({ success: false, message: 'Access denied. Please log in.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'skillpath_super_secret_key_2026');
        req.user = verified;
        next();
    } catch (err) {
        // Clear invalid token cookie
        res.clearCookie('token');
        return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }
}

function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access restricted to administrators only.' });
    }
    next();
}

module.exports = {
    authenticateToken,
    isAdmin
};
