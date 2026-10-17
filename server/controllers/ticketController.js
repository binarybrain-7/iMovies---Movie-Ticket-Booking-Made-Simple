const Booking = require('../models/Booking');
const { NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Verify digital ticket by booking reference (public verification for cinema gate check)
 * GET /api/v1/tickets/:bookingReference/verify
 */
const verifyTicket = async (req, res, next) => {
  try {
    const { bookingReference } = req.params;

    const booking = await Booking.findOne({ bookingReference }).populate({
      path: 'showId',
      populate: [
        { path: 'movieId', select: 'title posterUrl runtimeMinutes certification language' },
        { path: 'theatreId', select: 'name location city' },
        { path: 'screenId', select: 'name' },
      ],
    });

    if (!booking) {
      throw new NotFoundError('Invalid ticket reference. Booking record does not exist.');
    }

    const isValid = booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';

    return sendSuccess(res, {
      isValid,
      bookingReference: booking.bookingReference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      movie: booking.showId?.movieId?.title || 'Unknown',
      theatre: booking.showId?.theatreId?.name || 'Unknown',
      screen: booking.showId?.screenId?.name || 'Screen 1',
      showDate: booking.showId?.showDate,
      startTime: booking.showId?.startTime,
      seats: booking.seats.map((s) => s.seatNumber),
      ticketCount: booking.seats.length,
      bookedAt: booking.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyTicket,
};
