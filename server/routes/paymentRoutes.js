const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authenticate');

router.post('/create-order', authenticate, paymentController.initiatePaymentOrder);
router.post('/verify', authenticate, paymentController.verifyAndConfirmPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handlePaymentWebhook);

module.exports = router;
