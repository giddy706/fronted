const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', jobController.listJobs);
router.get('/my-applications', authenticateToken, jobController.getMyApplications);
router.get('/:id', jobController.getJobDetails);
router.post('/:id/apply', authenticateToken, jobController.applyJob);

// Admin-only routes
router.post('/', authenticateToken, isAdmin, jobController.createJob);
router.delete('/:id', authenticateToken, isAdmin, jobController.deleteJob);

module.exports = router;
