const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get Admin Dashboard Overview stats
 * GET /api/v1/admin/dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMovies,
      activeTheatres,
      upcomingShows,
      totalBookings,
      confirmedBookings,
      pendingPayments,
      revenueStats,
      recentShows,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({ role: 'USER' }),
      Movie.countDocuments(),
      Theatre.countDocuments({ isActive: true }),
      Show.countDocuments({ status: 'active' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'CONFIRMED' }),
      Booking.countDocuments({ status: 'PENDING' }),
      Booking.aggregate([
        {
          $group: {
            _id: null,
            grossRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'CONFIRMED'] }, '$totalAmount', 0],
              },
            },
            refundAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'CANCELLED'] }, '$refundAmount', 0],
              },
            },
          },
        },
      ]),
      Show.find({ status: 'active' })
        .populate('movieId', 'title posterUrl')
        .populate('theatreId', 'name location')
        .sort({ showDate: 1, startTime: 1 })
        .limit(8),
      Booking.find()
        .populate('userId', 'username email')
        .populate({
          path: 'showId',
          populate: ['movieId', 'theatreId'],
        })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const gross = revenueStats.length ? revenueStats[0].grossRevenue : 0;
    const refunds = revenueStats.length ? revenueStats[0].refundAmount : 0;
    const netRevenue = gross - refunds;

    return sendSuccess(res, {
      stats: {
        totalUsers,
        totalMovies,
        activeTheatres,
        upcomingShows,
        totalBookings,
        confirmedBookings,
        pendingPayments,
        grossRevenue: gross,
        refundAmount: refunds,
        netRevenue,
      },
      recentShows,
      recentBookings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all bookings with filtering, search, and pagination
 * GET /api/v1/admin/bookings
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      query.bookingReference = new RegExp(search.trim(), 'i');
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('userId', 'username email phone')
        .populate({
          path: 'showId',
          populate: ['movieId', 'theatreId', 'screenId'],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Booking.countDocuments(query),
    ]);

    return sendSuccess(res, {
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all users
 * GET /api/v1/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ username: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    return sendSuccess(res, {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle user active status (protecting last admin)
 * PATCH /api/v1/admin/users/:userId/status
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Safety rule: Prevent deactivating the last active administrator
    if (targetUser.role === 'ADMIN' && isActive === false) {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', isActive: true });
      if (activeAdminCount <= 1) {
        throw new ForbiddenError('Cannot deactivate the last remaining administrator account');
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    return sendSuccess(res, { user: targetUser }, 'User status updated');
  } catch (err) {
    next(err);
  }
};

/**
 * Get revenue report with breakdown
 * GET /api/v1/admin/revenue
 */
const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const matchFilter = { status: 'CONFIRMED' };

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    // Revenue by movie
    const movieBreakdown = await Booking.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'shows',
          localField: 'showId',
          foreignField: '_id',
          as: 'show',
        },
      },
      { $unwind: '$show' },
      {
        $lookup: {
          from: 'movies',
          localField: 'show.movieId',
          foreignField: '_id',
          as: 'movie',
        },
      },
      { $unwind: '$movie' },
      {
        $group: {
          _id: '$movie._id',
          movieTitle: { $first: '$movie.title' },
          posterUrl: { $first: '$movie.posterUrl' },
          bookingsCount: { $sum: 1 },
          ticketsCount: { $sum: { $size: '$seats' } },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    // Revenue totals
    const grossRevenue = movieBreakdown.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalTickets = movieBreakdown.reduce((sum, item) => sum + item.ticketsCount, 0);

    const cancelledBookings = await Booking.find({ status: 'CANCELLED' });
    const totalRefunds = cancelledBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0);

    return sendSuccess(res, {
      summary: {
        grossRevenue,
        totalRefunds,
        netRevenue: grossRevenue - totalRefunds,
        totalTickets,
        confirmedBookingsCount: movieBreakdown.reduce((sum, item) => sum + item.bookingsCount, 0),
      },
      movieBreakdown,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Moderate review status
 * PATCH /api/v1/admin/reviews/:reviewId/status
 */
const moderateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'FLAGGED', 'REMOVED'].includes(status)) {
      throw new ValidationError('Invalid review status');
    }

    const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true });
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Trigger recalculation of movie rating
    await Review.calculateMovieRating(review.movieId);

    return sendSuccess(res, { review }, 'Review status updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllBookings,
  getAllUsers,
  toggleUserStatus,
  getRevenueReport,
  moderateReview,
};
