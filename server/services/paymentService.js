const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { getPaymentConfig, verifyRazorpaySignature, verifyWebhookSignature } = require('../config/payment');
const { AppError, ValidationError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create a payment order for a booking
 */
const createOrder = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId });
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status === 'CONFIRMED') {
    throw new ValidationError('This booking has already been confirmed and paid');
  }

  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
    throw new ValidationError(`Cannot pay for a booking with status ${booking.status}`);
  }

  const config = getPaymentConfig();
  const amountInPaise = Math.round(booking.totalAmount * 100);

  let providerOrderId = null;
  let status = 'CREATED';

  if (!config.isSimulation && config.razorpayInstance) {
    try {
      const order = await config.razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${booking.bookingReference}`,
        notes: {
          bookingId: booking._id.toString(),
          bookingReference: booking.bookingReference,
        },
      });
      providerOrderId = order.id;
      logger.info(`[Payment] Razorpay order created: ${order.id} for ₹${booking.totalAmount}`);
    } catch (err) {
      logger.error(`[Payment] Razorpay order creation failed: ${err.message}`, err);
      throw new AppError(`Payment provider error: ${err.message}`, 502);
    }
  } else {
    // Development sandbox simulation
    providerOrderId = `sim_order_${crypto.randomBytes(12).toString('hex')}`;
    logger.info(`[Payment] Created Sandbox simulation order ${providerOrderId} for ₹${booking.totalAmount}`);
  }

  // Create payment record
  const payment = await Payment.create({
    bookingId: booking._id,
    provider: config.provider,
    providerOrderId,
    amount: booking.totalAmount,
    currency: 'INR',
    status,
  });

  return {
    paymentId: payment._id,
    orderId: providerOrderId,
    amount: booking.totalAmount,
    currency: 'INR',
    provider: config.provider,
    isSimulation: config.isSimulation,
    keyId: config.keyId,
    bookingReference: booking.bookingReference,
  };
};

/**
 * Verify payment
 */
const verifyPayment = async ({
  bookingId,
  orderId,
  paymentId,
  signature,
  simulationResult,
}) => {
  const config = getPaymentConfig();
  const paymentRecord = await Payment.findOne({
    bookingId,
    providerOrderId: orderId,
  });

  if (!paymentRecord) {
    throw new NotFoundError('Payment order not found for verification');
  }

  if (paymentRecord.status === 'SUCCEEDED') {
    logger.info(`[Payment] Payment already verified for order ${orderId}`);
    return { verified: true, payment: paymentRecord, alreadyProcessed: true };
  }

  let isVerified = false;

  if (!config.isSimulation) {
    // Real Razorpay signature verification
    isVerified = verifyRazorpaySignature(
      orderId,
      paymentId,
      signature,
      config.keySecret
    );
  } else {
    // Sandbox simulation: only succeeds if simulationResult !== 'fail'
    if (simulationResult === 'fail') {
      paymentRecord.status = 'FAILED';
      await paymentRecord.save();
      logger.warn(`[Payment] Simulated payment deliberately marked failed for order ${orderId}`);
      return { verified: false, payment: paymentRecord, reason: 'SIMULATED_FAILURE' };
    }
    // Simulation success
    isVerified = true;
  }

  if (!isVerified) {
    paymentRecord.status = 'FAILED';
    await paymentRecord.save();
    throw new ValidationError('Invalid payment signature verification failed');
  }

  paymentRecord.status = 'SUCCEEDED';
  paymentRecord.providerPaymentId = paymentId || `sim_pay_${crypto.randomBytes(8).toString('hex')}`;
  paymentRecord.providerSignature = signature || 'simulated_signature';
  paymentRecord.verifiedAt = new Date();
  await paymentRecord.save();

  logger.info(`[Payment] Payment verified successfully for order ${orderId}`);
  return { verified: true, payment: paymentRecord, alreadyProcessed: false };
};

/**
 * Process Razorpay Webhook
 */
const processWebhook = async (rawBody, signature) => {
  const config = getPaymentConfig();
  if (config.isSimulation) {
    return { received: true, note: 'Simulation mode does not use webhooks' };
  }

  const isValid = verifyWebhookSignature(rawBody, signature, config.webhookSecret);
  if (!isValid) {
    throw new ValidationError('Webhook signature verification failed');
  }

  const payload = JSON.parse(rawBody.toString());
  const event = payload.event;
  logger.info(`[Payment Webhook] Received valid webhook event: ${event}`);

  // Idempotent webhook event handling
  if (event === 'payment.captured' || event === 'order.paid') {
    const entity = payload.payload.payment.entity;
    const orderId = entity.order_id;
    const paymentRecord = await Payment.findOne({ providerOrderId: orderId });
    if (paymentRecord && paymentRecord.status !== 'SUCCEEDED') {
      paymentRecord.status = 'SUCCEEDED';
      paymentRecord.providerPaymentId = entity.id;
      paymentRecord.verifiedAt = new Date();
      paymentRecord.rawResponse = entity;
      await paymentRecord.save();
    }
  }

  return { received: true, event };
};

module.exports = {
  createOrder,
  verifyPayment,
  processWebhook,
};
