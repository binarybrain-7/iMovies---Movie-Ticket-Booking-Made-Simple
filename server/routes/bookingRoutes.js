const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.post('/', bookingController.createNewBooking);
router.get('/me', bookingController.getMyBookings);
router.get('/:bookingId', bookingController.getBookingById);
router.post('/:bookingId/cancel', bookingController.cancelUserBooking);

module.exports = router;
