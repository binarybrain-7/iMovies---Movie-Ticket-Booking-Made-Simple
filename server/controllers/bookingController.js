const Booking = require('../models/Booking');
const { createBooking, cancelBooking } = require('../services/bookingService');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Create a new pending booking with server-calculated price breakdown
 * POST /api/v1/bookings
 */
const createNewBooking = async (req, res, next) => {
  try {
    const { showId, lockToken } = req.body;

    if (!showId || !lockToken) {
      throw new ValidationError('showId and lockToken are required to initiate booking');
    }

    const bookingResult = await createBooking(req.user._id, showId, lockToken);

    return sendSuccess(res, bookingResult, 'Booking initiated successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user's bookings with filter (upcoming, completed, cancelled)
 * GET /api/v1/bookings/me
 */
const getMyBookings = async (req, res, next) => {
  try {
    const { filter = 'all' } = req.query;
    const query = { userId: req.user._id };

    if (filter === 'upcoming') {
      query.status = 'CONFIRMED';
    } else if (filter === 'completed') {
      query.status = 'CONFIRMED';
    } else if (filter === 'cancelled') {
      query.status = 'CANCELLED';
    } else if (filter === 'failed') {
      query.status = 'FAILED';
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'showId',
        populate: [
          { path: 'movieId', select: 'title posterUrl runtimeMinutes certification language genres' },
          { path: 'theatreId', select: 'name location city address' },
          { path: 'screenId', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, { bookings });
  } catch (err) {
    next(err);
  }
};

/**
 * Get booking by ID
 * GET /api/v1/bookings/:bookingId
 */
const getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate({
      path: 'showId',
      populate: [
        { path: 'movieId', select: 'title posterUrl runtimeMinutes certification language genres director cast' },
        { path: 'theatreId', select: 'name location city address' },
        { path: 'screenId', select: 'name' },
      ],
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check ownership unless admin
    if (req.user.role !== 'ADMIN' && booking.userId.toString() !== req.user._id.toString()) {
      throw new NotFoundError('Booking not found');
    }

    return sendSuccess(res, { booking });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel a booking
 * POST /api/v1/bookings/:bookingId/cancel
 */
const cancelUserBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const cancelledBooking = await cancelBooking(bookingId, req.user._id, reason);

    return sendSuccess(res, { booking: cancelledBooking }, 'Booking cancelled successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNewBooking,
  getMyBookings,
  getBookingById,
  cancelUserBooking,
};
