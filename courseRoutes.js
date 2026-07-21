const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', courseController.listCourses);
router.get('/my-enrollments', authenticateToken, courseController.getMyEnrollments);
router.get('/certificates', authenticateToken, courseController.getCertificates);
router.get('/:id', courseController.getCourseDetails);
router.post('/:id/enroll', authenticateToken, courseController.enroll);
router.post('/:id/lessons/:lessonId/complete', authenticateToken, courseController.completeLesson);

// Admin-only routes
router.post('/', authenticateToken, isAdmin, courseController.createCourse);
router.delete('/:id', authenticateToken, isAdmin, courseController.deleteCourse);

module.exports = router;
