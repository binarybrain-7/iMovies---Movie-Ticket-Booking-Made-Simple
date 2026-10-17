const { createOrder, verifyPayment, processWebhook } = require('../services/paymentService');
const { confirmBooking } = require('../services/bookingService');
const { ValidationError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Create payment order
 * POST /api/v1/payments/create-order
 */
const initiatePaymentOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      throw new ValidationError('bookingId is required');
    }

    const orderData = await createOrder(bookingId, req.user._id);

    return sendSuccess(res, orderData, 'Payment order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Verify payment and confirm booking
 * POST /api/v1/payments/verify
 */
const verifyAndConfirmPayment = async (req, res, next) => {
  try {
    const { bookingId, orderId, paymentId, signature, simulationResult } = req.body;

    if (!bookingId || !orderId) {
      throw new ValidationError('bookingId and orderId are required for payment verification');
    }

    // 1. Verify payment status independently server-side
    const verification = await verifyPayment({
      bookingId,
      orderId,
      paymentId,
      signature,
      simulationResult,
    });

    if (!verification.verified) {
      return sendSuccess(
        res,
        { verified: false, reason: verification.reason || 'PAYMENT_FAILED' },
        'Payment was not completed successfully',
        400
      );
    }

    // 2. Confirm booking and permanently allocate seats
    const confirmedBooking = await confirmBooking(bookingId, verification.payment._id);

    return sendSuccess(
      res,
      {
        verified: true,
        booking: confirmedBooking,
        payment: verification.payment,
      },
      'Payment verified and booking confirmed successfully'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Handle payment gateway webhooks
 * POST /api/v1/payments/webhook
 */
const handlePaymentWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body;

    const result = await processWebhook(rawBody, signature);

    return sendSuccess(res, result, 'Webhook processed successfully');
  } catch (err) {
    logger.error(`[Webhook] Error processing webhook: ${err.message}`);
    return res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  initiatePaymentOrder,
  verifyAndConfirmPayment,
  handlePaymentWebhook,
};
