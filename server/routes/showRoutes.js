const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const seatLockController = require('../controllers/seatLockController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');

// Public show browsing & seat map
router.get('/', showController.getAllShows);
router.get('/:showId', showController.getShowById);
router.get('/:showId/seats', optionalAuth, showController.getShowSeats);

// Temporary seat locking
router.post('/:showId/seat-locks', authenticate, seatLockController.createSeatLock);

// Admin-only show management
router.post('/', authenticate, authorizeAdmin, showController.createShow);
router.patch('/:showId', authenticate, authorizeAdmin, showController.updateShow);
router.delete('/:showId', authenticate, authorizeAdmin, showController.deleteShow);

module.exports = router;
