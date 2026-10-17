const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Public verification endpoint for scanning digital ticket QR codes
router.get('/:bookingReference/verify', ticketController.verifyTicket);

module.exports = router;
