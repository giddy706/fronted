const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// All admin routes require JWT and Admin role
router.use(authenticateToken, isAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/applications', adminController.getApplications);
router.post('/applications/:id/status', adminController.updateApplicationStatus);
router.get('/traffic', adminController.getTrafficStats);

module.exports = router;
