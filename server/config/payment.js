const crypto = require('crypto');
const logger = require('../utils/logger');

let razorpayInstance = null;

const getPaymentConfig = () => {
  const provider = (process.env.PAYMENT_PROVIDER || 'sandbox').toLowerCase();
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  const isRealRazorpay = provider === 'razorpay' && Boolean(keyId && keySecret);

  if (isRealRazorpay && !razorpayInstance) {
    try {
      const Razorpay = require('razorpay');
      razorpayInstance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
      logger.info('[Payment] Razorpay SDK initialized with provided credentials.');
    } catch (err) {
      logger.error(`[Payment] Failed to initialize Razorpay SDK: ${err.message}`);
    }
  }

  return {
    provider: isRealRazorpay ? 'razorpay' : 'sandbox',
    isSimulation: !isRealRazorpay,
    keyId: isRealRazorpay ? keyId : 'rzp_test_simulated_key',
    keySecret,
    webhookSecret,
    razorpayInstance,
  };
};

/**
 * Verify Razorpay HMAC SHA256 payment signature
 */
const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
};

/**
 * Verify Razorpay Webhook signature
 */
const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  if (!rawBody || !signature || !webhookSecret) {
    return false;
  }
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
};

module.exports = {
  getPaymentConfig,
  verifyRazorpaySignature,
  verifyWebhookSignature,
};
