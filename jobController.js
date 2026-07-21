const { getDB } = require('../config/db');

exports.listJobs = async (req, res) => {
    try {
        const db = await getDB();
        const jobs = await db.all(`
            SELECT j.*, c.title as requiredCourseTitle
            FROM jobs j
            LEFT JOIN courses c ON j.required_course_id = c.id
            ORDER BY j.created_at DESC
        `);
        // Parse JSON array strings for client
        for (const job of jobs) {
            job.postedDate = job.created_at;
            try {
                job.requirements = JSON.parse(job.requirements);
            } catch (e) {
                job.requirements = [];
            }
            try {
                job.responsibilities = JSON.parse(job.responsibilities);
            } catch (e) {
                job.responsibilities = [];
            }
            try {
                job.benefits = JSON.parse(job.benefits);
            } catch (e) {
                job.benefits = [];
            }
        }
        res.json({ success: true, jobs });
    } catch (err) {
        console.error('List jobs error:', err);
        res.status(500).json({ success: false, message: 'Server error listing jobs' });
    }
};

exports.getJobDetails = async (req, res) => {
    try {
        const db = await getDB();
        const jobId = req.params.id;
        const job = await db.get(`
            SELECT j.*, c.title as requiredCourseTitle
            FROM jobs j
            LEFT JOIN courses c ON j.required_course_id = c.id
            WHERE j.id = ?
        `, [jobId]);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        job.postedDate = job.created_at;

        try {
            job.requirements = JSON.parse(job.requirements);
        } catch (e) {
            job.requirements = [];
        }
        try {
            job.responsibilities = JSON.parse(job.responsibilities);
        } catch (e) {
            job.responsibilities = [];
        }
        try {
            job.benefits = JSON.parse(job.benefits);
        } catch (e) {
            job.benefits = [];
        }

        res.json({ success: true, job });
    } catch (err) {
        console.error('Get job error:', err);
        res.status(500).json({ success: false, message: 'Server error getting job details' });
    }
};

exports.applyJob = async (req, res) => {
    try {
        const db = await getDB();
        const jobId = req.params.id;
        const userId = req.user.id;
        const { fullName, email, phone, coverLetter } = req.body;

        if (!fullName || !email || !phone || !coverLetter) {
            return res.status(400).json({ success: false, message: 'All application fields are required' });
        }

        // Get job details
        const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Check if course is required and completed
        if (job.required_course_id) {
            const completed = await db.get(
                'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND completed = 1',
                [userId, job.required_course_id]
            );
            if (!completed) {
                return res.status(400).json({
                    success: false,
                    message: 'You must complete the required course before applying'
                });
            }
        }

        // Check if already applied
        const existing = await db.get('SELECT * FROM job_applications WHERE job_id = ? AND user_id = ?', [jobId, userId]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already applied for this job' });
        }

        // Create application
        await db.run(
            `INSERT INTO job_applications (job_id, user_id, full_name, email, phone, cover_letter)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [jobId, userId, fullName, email, phone, coverLetter]
        );

        res.status(201).json({ success: true, message: 'Application submitted successfully' });
    } catch (err) {
        console.error('Apply job error:', err);
        res.status(500).json({ success: false, message: 'Server error submitting application' });
    }
};

exports.getMyApplications = async (req, res) => {
    try {
        const db = await getDB();
        const userId = req.user.id;

        const applications = await db.all(`
            SELECT a.*, j.title as jobTitle, j.company as company, j.location as location
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
            ORDER BY a.applied_at DESC
        `, [userId]);

        res.json({ success: true, applications });
    } catch (err) {
        console.error('Get applications error:', err);
        res.status(500).json({ success: false, message: 'Server error getting applications' });
    }
};

// Admin routes
exports.createJob = async (req, res) => {
    try {
        const { title, company, location, type, salary, category, description, requirements, responsibilities, benefits, requiredCourseId } = req.body;
        
        if (!title || !company || !location || !type || !salary || !category || !description) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        const reqs = Array.isArray(requirements) ? requirements : [];
        const resps = Array.isArray(responsibilities) ? responsibilities : [];
        const bens = Array.isArray(benefits) ? benefits : [];

        const db = await getDB();
        await db.run(
            `INSERT INTO jobs (title, company, location, type, salary, category, description, requirements, responsibilities, benefits, required_course_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, company, location, type, salary, category, description, JSON.stringify(reqs), JSON.stringify(resps), JSON.stringify(bens), requiredCourseId || null]
        );

        res.status(201).json({ success: true, message: 'Job posted successfully' });
    } catch (err) {
        console.error('Create job error:', err);
        res.status(500).json({ success: false, message: 'Server error posting job' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const db = await getDB();
        const jobId = req.params.id;

        const job = await db.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        await db.run('DELETE FROM jobs WHERE id = ?', [jobId]);
        res.json({ success: true, message: 'Job deleted successfully' });
    } catch (err) {
        console.error('Delete job error:', err);
        res.status(500).json({ success: false, message: 'Server error deleting job' });
    }
};
