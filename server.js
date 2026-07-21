const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Define routes later, but reference them here so they load after DB is initialized
const { initDB } = require('./server/config/db');

// Serve static frontend files from the new frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Initialize database then start server
initDB().then(() => {
    // Traffic tracking route
    const tracker = require('./server/middleware/tracker');
    app.use('/api/traffic', tracker.router);

    // API Routes
    app.use('/api/auth', require('./server/routes/authRoutes'));
    app.use('/api/courses', require('./server/routes/courseRoutes'));
    app.use('/api/jobs', require('./server/routes/jobRoutes'));
    app.use('/api/admin', require('./server/routes/adminRoutes'));

    // Global Error Handler
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    });

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
