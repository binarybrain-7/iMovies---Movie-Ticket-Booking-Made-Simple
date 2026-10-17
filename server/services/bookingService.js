const crypto = require('crypto');
const Booking = require('../models/Booking');
const SeatLock = require('../models/SeatLock');
const Show = require('../models/Show');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { emitSeatsBooked, emitSeatReleased } = require('./socketService');
const { sendBookingConfirmationEmail } = require('./emailService');
const logger = require('../utils/logger');

const TAX_RATE = 0.18; // 18% GST
const CONVENIENCE_FEE = 20; // ₹20 flat fee

/**
 * Generate unique human-readable booking reference
 */
const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `IMV-${dateStr}-${randomSuffix}`;
};

/**
 * Create a pending booking based on an active seat lock
 */
const createBooking = async (userId, showId, lockToken) => {
  if (!showId || !lockToken) {
    throw new ValidationError('Show ID and lock token are required');
  }

  // 1. Verify show exists
  const show = await Show.findById(showId).populate('movieId theatreId screenId');
  if (!show || show.status !== 'active') {
    throw new NotFoundError('Show is unavailable');
  }

  // 2. Validate active seat lock owned by this user
  const now = new Date();
  const seatLock = await SeatLock.findOne({
    showId,
    userId,
    lockToken,
    status: 'ACTIVE',
    expiresAt: { $gt: now },
  });

  if (!seatLock) {
    throw new ConflictError('Seat reservation has expired or is invalid. Please select your seats again.');
  }

  // 3. Calculate all financial amounts strictly on the server
  let subtotal = 0;
  seatLock.seats.forEach((seat) => {
    subtotal += seat.price;
  });

  const taxes = Math.round(subtotal * TAX_RATE);
  const fees = CONVENIENCE_FEE;
  const totalAmount = subtotal + taxes + fees;

  const bookingReference = generateBookingReference();

  // 4. Create pending booking record
  const booking = await Booking.create({
    bookingReference,
    userId,
    showId,
    seats: seatLock.seats,
    subtotal,
    taxes,
    fees,
    totalAmount,
    currency: 'INR',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    reservationExpiresAt: seatLock.expiresAt,
  });

  logger.info(`[Booking] Created pending booking ${bookingReference} for user ${userId}, total ₹${totalAmount}`);

  return {
    booking,
    expiresAt: seatLock.expiresAt,
    movie: show.movieId,
    theatre: show.theatreId,
    screen: show.screenId,
    showDate: show.showDate,
    startTime: show.startTime,
  };
};

/**
 * Confirm a booking after payment succeeds (idempotent)
 */
const confirmBooking = async (bookingId, paymentId) => {
  const booking = await Booking.findById(bookingId).populate({
    path: 'showId',
    populate: ['movieId', 'theatreId', 'screenId'],
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Idempotency: if already confirmed, return directly
  if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    logger.info(`[Booking] Booking ${booking.bookingReference} already confirmed (idempotent return)`);
    return booking;
  }

  // Verify seat lock is still valid or hasn't been claimed by someone else
  const seatNumbers = booking.seats.map((s) => s.seatNumber);

  // Check if another confirmed booking exists for these seats
  const conflictingBooking = await Booking.findOne({
    _id: { $ne: booking._id },
    showId: booking.showId._id,
    status: 'CONFIRMED',
    'seats.seatNumber': { $in: seatNumbers },
  });

  if (conflictingBooking) {
    booking.status = 'FAILED';
    booking.paymentStatus = 'PAID'; // Paid but couldn't confirm
    await booking.save();
    logger.error(`[Booking] Double-booking conflict detected for booking ${booking.bookingReference}`);
    throw new ConflictError(
      'Reservation could not be confirmed because seats were allocated. Refund is pending.'
    );
  }

  // Create digital ticket verification token
  const qrVerificationToken = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'imovies_ticket_secret')
    .update(`${booking.bookingReference}|${booking._id}|${booking.showId._id}`)
    .digest('hex');

  // Update booking to CONFIRMED
  booking.status = 'CONFIRMED';
  booking.paymentStatus = 'PAID';
  booking.qrVerificationToken = qrVerificationToken;
  await booking.save();

  // Mark active seat locks for these seats as CONFIRMED
  await SeatLock.updateMany(
    {
      showId: booking.showId._id,
      'seats.seatNumber': { $in: seatNumbers },
      status: 'ACTIVE',
    },
    {
      status: 'CONFIRMED',
    }
  );

  // Broadcast real-time seats booked event
  emitSeatsBooked(booking.showId._id, seatNumbers);

  // Create in-app notification for the user
  await Notification.create({
    userId: booking.userId,
    type: 'BOOKING_CONFIRMATION',
    title: 'Booking Confirmed!',
    message: `Your booking for "${booking.showId.movieId?.title}" (${seatNumbers.join(', ')}) at ${booking.showId.theatreId?.name} is confirmed. Ref: ${booking.bookingReference}`,
    relatedBookingId: booking._id,
  });

  // Attempt email delivery in the background
  const user = await User.findById(booking.userId);
  if (user && user.email) {
    sendBookingConfirmationEmail({
      toEmail: user.email,
      username: user.username,
      booking,
      movie: booking.showId.movieId,
      theatre: booking.showId.theatreId,
      show: booking.showId,
    }).catch((err) => {
      logger.error(`[Booking] Background email failed: ${err.message}`);
    });
  }

  logger.info(`[Booking] Successfully confirmed booking ${booking.bookingReference}`);
  return booking;
};

/**
 * Cancel a booking and release seats
 */
const cancelBooking = async (bookingId, userId, reason = 'User requested cancellation') => {
  const booking = await Booking.findOne({ _id: bookingId, userId }).populate('showId');
  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new ValidationError(`Only confirmed bookings can be cancelled. Current status: ${booking.status}`);
  }

  // Check show date and cancellation cutoff (at least 2 hours before show)
  const show = booking.showId;
  const showDateTime = new Date(`${show.showDate}T${show.startTime}:00`);
  const now = new Date();

  if (showDateTime <= now) {
    throw new ValidationError('Cannot cancel tickets for a show that has already started or ended');
  }

  const hoursRemaining = (showDateTime - now) / (1000 * 60 * 60);
  if (hoursRemaining < 2) {
    throw new ValidationError('Cancellations are only permitted up to 2 hours before showtime');
  }

  // Update booking status
  booking.status = 'CANCELLED';
  booking.cancelledAt = new Date();
  booking.cancellationReason = reason;
  booking.paymentStatus = 'REFUNDED';
  booking.refundAmount = booking.totalAmount;
  await booking.save();

  // Release seats
  const seatNumbers = booking.seats.map((s) => s.seatNumber);
  await SeatLock.updateMany(
    {
      showId: booking.showId._id,
      'seats.seatNumber': { $in: seatNumbers },
    },
    {
      status: 'RELEASED',
    }
  );

  emitSeatReleased(booking.showId._id, seatNumbers);

  // Send cancellation notification
  await Notification.create({
    userId: booking.userId,
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    message: `Your booking ${booking.bookingReference} has been cancelled. A refund of ₹${booking.totalAmount} has been initiated.`,
    relatedBookingId: booking._id,
  });

  logger.info(`[Booking] Cancelled booking ${booking.bookingReference}`);
  return booking;
};

module.exports = {
  createBooking,
  confirmBooking,
  cancelBooking,
  generateBookingReference,
};
