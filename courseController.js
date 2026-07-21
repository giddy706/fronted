const { getDB } = require('../config/db');

exports.listCourses = async (req, res) => {
    try {
        const db = await getDB();
        const courses = await db.all('SELECT * FROM courses');
        courses.forEach(c => { c.students = c.students_count; });
        res.json({ success: true, courses });
    } catch (err) {
        console.error('List courses error:', err);
        res.status(500).json({ success: false, message: 'Server error listing courses' });
    }
};

exports.getCourseDetails = async (req, res) => {
    try {
        const db = await getDB();
        const courseId = req.params.id;
        
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }
        course.students = course.students_count;
        
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
        course.curriculum = lessons;
        
        res.json({ success: true, course });
    } catch (err) {
        console.error('Get course error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching course details' });
    }
};

exports.enroll = async (req, res) => {
    try {
        const db = await getDB();
        const courseId = req.params.id;
        const userId = req.user.id; // from JWT middleware

        // Verify course exists
        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Check if already enrolled
        const existing = await db.get('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
        }

        // Enroll
        await db.run(
            `INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)`,
            [userId, courseId]
        );

        // Update student count in course
        await db.run('UPDATE courses SET students_count = students_count + 1 WHERE id = ?', [courseId]);

        res.status(201).json({ success: true, message: 'Successfully enrolled in course' });
    } catch (err) {
        console.error('Enrollment error:', err);
        res.status(500).json({ success: false, message: 'Server error during enrollment' });
    }
};

exports.getMyEnrollments = async (req, res) => {
    try {
        const db = await getDB();
        const userId = req.user.id;

        // Fetch enrollments with course details
        const enrollments = await db.all(`
            SELECT e.*, c.title as courseTitle, c.image as courseImage, c.duration as courseDuration, c.instructor as courseInstructor
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ?
        `, [userId]);

        // For each enrollment, fetch lessons and their completion status
        for (const enrollment of enrollments) {
            const lessons = await db.all(`
                SELECT l.id, l.title, l.order_index,
                       CASE WHEN lp.id IS NOT NULL THEN 1 ELSE 0 END as completed
                FROM lessons l
                LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = ?
                WHERE l.course_id = ?
                ORDER BY l.order_index ASC
            `, [enrollment.id, enrollment.course_id]);
            
            enrollment.lessons = lessons;
        }

        res.json({ success: true, enrollments });
    } catch (err) {
        console.error('Get enrollments error:', err);
        res.status(500).json({ success: false, message: 'Server error getting enrollments' });
    }
};

exports.completeLesson = async (req, res) => {
    try {
        const db = await getDB();
        const { id: courseId, lessonId } = req.params;
        const userId = req.user.id;

        // Find enrollment
        const enrollment = await db.get('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', [userId, courseId]);
        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        // Verify lesson exists
        const lesson = await db.get('SELECT * FROM lessons WHERE id = ? AND course_id = ?', [lessonId, courseId]);
        if (!lesson) {
            return res.status(404).json({ success: false, message: 'Lesson not found in this course' });
        }

        // Insert lesson progress (ignore if duplicate)
        await db.run(
            `INSERT OR IGNORE INTO lesson_progress (enrollment_id, lesson_id) VALUES (?, ?)`,
            [enrollment.id, lessonId]
        );

        // Recalculate progress
        const totalLessonsRow = await db.get('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?', [courseId]);
        const completedLessonsRow = await db.get('SELECT COUNT(*) as count FROM lesson_progress WHERE enrollment_id = ?', [enrollment.id]);

        const total = totalLessonsRow.count || 1;
        const completed = completedLessonsRow.count || 0;
        const progress = Math.round((completed / total) * 100);

        let completedFlag = enrollment.completed;
        let completedDate = enrollment.completed_at;

        if (progress === 100 && !enrollment.completed) {
            completedFlag = 1;
            completedDate = new Date().toISOString();
            await db.run(
                'UPDATE enrollments SET progress = ?, completed = 1, completed_at = ? WHERE id = ?',
                [progress, completedDate, enrollment.id]
            );
        } else {
            await db.run(
                'UPDATE enrollments SET progress = ? WHERE id = ?',
                [progress, enrollment.id]
            );
        }

        res.json({
            success: true,
            progress,
            completed: completedFlag === 1,
            completedAt: completedDate
        });
    } catch (err) {
        console.error('Complete lesson error:', err);
        res.status(500).json({ success: false, message: 'Server error marking lesson completed' });
    }
};

exports.getCertificates = async (req, res) => {
    try {
        const db = await getDB();
        const userId = req.user.id;

        // Certificates are generated for completed courses
        const completedCourses = await db.all(`
            SELECT e.id as certificateId, e.course_id as courseId, e.completed_at as issuedDate, c.title as courseTitle, c.instructor as instructorName
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = ? AND e.completed = 1
        `, [userId]);

        res.json({ success: true, certificates: completedCourses });
    } catch (err) {
        console.error('Get certificates error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching certificates' });
    }
};

// ================= Admin Routes =================

exports.createCourse = async (req, res) => {
    try {
        const { title, category, description, duration, price, image, instructor, level, lessons } = req.body;
        if (!title || !category || !description || !duration || !price || !image || !instructor || !level) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const db = await getDB();
        
        // Insert course
        const result = await db.run(
            `INSERT INTO courses (title, category, description, duration, price, image, instructor, level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, category, description, duration, price, image, instructor, level]
        );
        const courseId = result.lastID;

        // Insert lessons if provided
        if (lessons && Array.isArray(lessons)) {
            for (let i = 0; i < lessons.length; i++) {
                if (lessons[i] && lessons[i].trim() !== '') {
                    await db.run(
                        `INSERT INTO lessons (course_id, title, order_index) VALUES (?, ?, ?)`,
                        [courseId, lessons[i].trim(), i + 1]
                    );
                }
            }
        }

        res.status(201).json({ success: true, message: 'Course created successfully', courseId });
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ success: false, message: 'Server error creating course' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const db = await getDB();
        const courseId = req.params.id;

        const course = await db.get('SELECT * FROM courses WHERE id = ?', [courseId]);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Delete course (cascades to lessons & enrollments)
        await db.run('DELETE FROM courses WHERE id = ?', [courseId]);

        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
        console.error('Delete course error:', err);
        res.status(500).json({ success: false, message: 'Server error deleting course' });
    }
};
