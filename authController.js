const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'skillpath_super_secret_key_2026';

exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const db = await getDB();
        
        // Check if user exists
        const userExists = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await db.run(
            `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
            [fullName, email, passwordHash]
        );

        const newUser = {
            id: result.lastID,
            name: fullName,
            email,
            role: 'student'
        };

        // Create JWT token
        const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: false, // Set to true in prod if using HTTPS
            sameSite: 'lax'
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: newUser
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const db = await getDB();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const userPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Create JWT token
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

        // Set secure cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: false, // Set to true in prod if using HTTPS
            sameSite: 'lax'
        });

        res.json({
            success: true,
            message: 'Login successful',
            user: userPayload
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const db = await getDB();
        const userId = req.user.id;
        
        const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch enrollments
        const enrollments = await db.all(`
            SELECT e.*, c.title as courseTitle, c.image as courseImage, c.duration as courseDuration, c.instructor as courseInstructor
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ?
        `, [userId]);

        for (const enrollment of enrollments) {
            const lessons = await db.all(`
                SELECT l.id, l.title, l.order_index,
                       CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END as completed
                FROM lessons l
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = ?
                WHERE l.course_id = ?
                ORDER BY l.order_index ASC
            `, [enrollment.id, enrollment.course_id]);
            
            // Format to match localstorage layout: lessons is array of objects {id, title, completed: bool}
            enrollment.lessons = lessons.map(l => ({
                id: l.id,
                title: l.title,
                completed: l.completed === 1
            }));
            
            // Format enrollment dates/fields
            enrollment.enrolledDate = enrollment.enrolled_at;
            enrollment.completed = enrollment.completed === 1;
        }

        // Certificates
        const certificates = await db.all(`
            SELECT e.id as id, e.course_id as courseId, e.completed_at as issuedDate, c.title as courseTitle
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ? AND e.completed = 1
        `, [userId]);

        // Job Applications
        const applications = await db.all(`
            SELECT a.*, j.title as jobTitle, j.company as company, a.applied_at as appliedDate
            FROM job_applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.user_id = ?
        `, [userId]);

        const mergedUser = {
            id: user.id,
            fullName: user.name,
            email: user.email,
            role: user.role,
            enrolledCourses: enrollments,
            completedCourses: enrollments.filter(e => e.completed),
            certificates,
            jobApplications: applications
        };

        res.json({
            success: true,
            user: mergedUser
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ success: false, message: 'Server error getting profile' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
};
