const { getDB } = require('../config/db');

exports.getMetrics = async (req, res) => {
    try {
        const db = await getDB();
        const usersCount = await db.get("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
        const coursesCount = await db.get("SELECT COUNT(*) as count FROM courses");
        const jobsCount = await db.get("SELECT COUNT(*) as count FROM jobs");
        const enrollmentsCount = await db.get("SELECT COUNT(*) as count FROM enrollments");
        const applicationsCount = await db.get("SELECT COUNT(*) as count FROM job_applications");

        res.json({
            success: true,
            metrics: {
                totalStudents: usersCount.count,
                totalCourses: coursesCount.count,
                totalJobs: jobsCount.count,
                totalEnrollments: enrollmentsCount.count,
                totalApplications: applicationsCount.count
            }
        });
    } catch (err) {
        console.error('Get metrics error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching metrics' });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const db = await getDB();
        const applications = await db.all(`
            SELECT a.*, j.title as jobTitle, j.company as company, u.name as userName, u.email as userEmail
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN users u ON a.user_id = u.id
            ORDER BY a.applied_at DESC
        `);
        res.json({ success: true, applications });
    } catch (err) {
        console.error('Get applications error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching applications' });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const db = await getDB();
        const { id } = req.params;
        const { status } = req.body; // 'approved', 'rejected', 'pending'

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const app = await db.get('SELECT * FROM job_applications WHERE id = ?', [id]);
        if (!app) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        await db.run('UPDATE job_applications SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: `Application status updated to ${status}` });
    } catch (err) {
        console.error('Update status error:', err);
        res.status(500).json({ success: false, message: 'Server error updating application status' });
    }
};

exports.getTrafficStats = async (req, res) => {
    try {
        const db = await getDB();
        
        // 1. Core KPIs
        const totalViews = await db.get("SELECT COUNT(*) as count FROM traffic_logs");
        const uniqueVisitors = await db.get("SELECT COUNT(DISTINCT session_id) as count FROM traffic_logs");
        
        // 2. Views by URL
        const topPages = await db.all(`
            SELECT page_url as url, page_title as title, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
            FROM traffic_logs
            GROUP BY page_url
            ORDER BY views DESC
            LIMIT 10
        `);

        // 3. Views by Referrer
        const referrers = await db.all(`
            SELECT referrer, COUNT(*) as count
            FROM traffic_logs
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 10
        `);

        // 4. Traffic over time (last 14 days)
        const trafficOverTime = await db.all(`
            SELECT date(timestamp) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
            FROM traffic_logs
            WHERE timestamp >= date('now', '-14 days')
            GROUP BY date(timestamp)
            ORDER BY date(timestamp) ASC
        `);

        res.json({
            success: true,
            stats: {
                totalViews: totalViews.count,
                uniqueVisitors: uniqueVisitors.count,
                topPages,
                referrers,
                trafficOverTime
            }
        });
    } catch (err) {
        console.error('Get traffic stats error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching traffic stats' });
    }
};
