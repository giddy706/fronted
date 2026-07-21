const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

dotenv.config();

const { getDB, initDB } = require('./server/config/db');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'skillpath_super_secret_key_2026';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve admin static files from the new frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend', 'admin')));

// Admin login - returns JWT when credentials valid and user is admin
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

        const db = await getDB();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access restricted to administrators' });

        const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });

        // return token in response; frontend should store it in memory/localStorage
        res.json({ success: true, token, user: payload });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// middleware to protect admin API
async function adminAuth(req, res, next) {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.admin_token) {
        token = req.cookies.admin_token;
    }

    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Administrator access required' });
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}

// Admin APIs
app.get('/api/admin/courses', adminAuth, async (req, res) => {
    try {
        const db = await getDB();
        const courses = await db.all('SELECT * FROM courses ORDER BY id DESC');
        res.json({ success: true, courses });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/admin/courses/:id', adminAuth, async (req, res) => {
    try {
        const db = await getDB();
        const courseId = req.params.id;
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        try {
            course.requirements = JSON.parse(course.requirements || '[]');
        } catch (e) {
            course.requirements = [];
        }
        try {
            course.outcomes = JSON.parse(course.outcomes || '[]');
        } catch (e) {
            course.outcomes = [];
        }
        const lessons = await db.all('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index ASC', [courseId]);
        course.lessons = lessons;
        res.json({ success: true, course });
    } catch (err) {
        console.error('Get admin course error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.patch('/api/admin/courses/:id', adminAuth, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, category, description, duration, price, image, instructor, level, requirements, outcomes } = req.body;
        const db = await getDB();
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await db.run(
            `UPDATE courses SET title = ?, category = ?, description = ?, duration = ?, price = ?, image = ?, instructor = ?, level = ?, requirements = ?, outcomes = ? WHERE id = ?`,
            [title || course.title, category || course.category, description || course.description, duration || course.duration, price || course.price, image || course.image, instructor || course.instructor, level || course.level, JSON.stringify(requirements || course.requirements || []), JSON.stringify(outcomes || course.outcomes || []), courseId]
        );
        res.json({ success: true, message: 'Course updated' });
    } catch (err) {
        console.error('Update course error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/admin/courses', adminAuth, async (req, res) => {
    try {
        const { title, category, description, duration, price, image, instructor, level, requirements, outcomes, lessons } = req.body;
        if (!title || !category) return res.status(400).json({ success: false, message: 'Missing required fields' });

        const db = await getDB();
        const result = await db.run(
            `INSERT INTO courses (title, category, description, duration, price, image, instructor, level, requirements, outcomes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, category, description || '', duration || '', price || 0, image || '', instructor || '', level || '', JSON.stringify(requirements || []), JSON.stringify(outcomes || [])]
        );
        const courseId = result.lastID;

        if (Array.isArray(lessons)) {
            for (let i = 0; i < lessons.length; i++) {
                const lessonItem = lessons[i];
                if (lessonItem && lessonItem.title && lessonItem.title.trim()) {
                    await db.run(
                        'INSERT INTO lessons (course_id, title, order_index, video_url) VALUES (?, ?, ?, ?)',
                        [courseId, lessonItem.title.trim(), i + 1, lessonItem.video_url || '']
                    );
                }
            }
        }

        res.status(201).json({ success: true, message: 'Course created', courseId });
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/admin/courses/:id', adminAuth, async (req, res) => {
    try {
        const courseId = req.params.id;
        const db = await getDB();
        const course = await db.get('SELECT id FROM courses WHERE id = ?', [courseId]);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await db.run('DELETE FROM courses WHERE id = ?', [courseId]);
        res.json({ success: true, message: 'Course deleted' });
    } catch (err) {
        console.error('Delete course error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/admin/courses/:id/lessons', adminAuth, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, video_url, content } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Lesson title required' });

        const db = await getDB();
        const last = await db.get('SELECT MAX(order_index) as max FROM lessons WHERE course_id = ?', [courseId]);
        const nextIndex = (last && last.max) ? last.max + 1 : 1;
        await db.run('INSERT INTO lessons (course_id, title, order_index, video_url, content) VALUES (?, ?, ?, ?, ?)', [courseId, title, nextIndex, video_url || '', content || '']);
        res.status(201).json({ success: true, message: 'Lesson added' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.patch('/api/admin/courses/:id/lessons/:lessonId', adminAuth, async (req, res) => {
    try {
        const { id: courseId, lessonId } = req.params;
        const { title, video_url, content } = req.body;
        const db = await getDB();
        const lesson = await db.get('SELECT * FROM lessons WHERE id = ? AND course_id = ?', [lessonId, courseId]);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        await db.run(
            'UPDATE lessons SET title = ?, video_url = ?, content = ? WHERE id = ?',
            [title || lesson.title, video_url || lesson.video_url, content || lesson.content, lessonId]
        );
        res.json({ success: true, message: 'Lesson updated' });
    } catch (err) {
        console.error('Update lesson error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/api/admin/courses/:id/lessons/:lessonId', adminAuth, async (req, res) => {
    try {
        const { id: courseId, lessonId } = req.params;
        const db = await getDB();
        const lesson = await db.get('SELECT * FROM lessons WHERE id = ? AND course_id = ?', [lessonId, courseId]);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        await db.run('DELETE FROM lessons WHERE id = ?', [lessonId]);
        res.json({ success: true, message: 'Lesson deleted' });
    } catch (err) {
        console.error('Delete lesson error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/admin/traffic', adminAuth, async (req, res) => {
    try {
        const db = await getDB();
        const logs = await db.all('SELECT * FROM traffic_logs ORDER BY timestamp DESC LIMIT 1000');
        res.json({ success: true, logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

initDB().then(() => {
    console.log('Database initialized for admin server');
    app.listen(PORT, () => {
        console.log(`Admin server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database for admin server:', err);
    process.exit(1);
});
