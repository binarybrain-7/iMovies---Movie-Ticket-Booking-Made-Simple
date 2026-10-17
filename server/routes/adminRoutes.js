const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');

router.use(authenticate, authorizeAdmin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/bookings', adminController.getAllBookings);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/status', adminController.toggleUserStatus);
router.get('/revenue', adminController.getRevenueReport);
router.patch('/reviews/:reviewId/status', adminController.moderateReview);

module.exports = router;
