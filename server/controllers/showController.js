const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const { getShowSeatAvailability } = require('../services/seatLockService');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get shows with filtering
 */
const getAllShows = async (req, res, next) => {
  try {
    const { movieId, theatreId, city, showDate, status = 'active' } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (movieId) {
      query.movieId = movieId;
    }

    if (theatreId) {
      query.theatreId = theatreId;
    }

    if (showDate) {
      query.showDate = showDate;
    }

    let theatreIdsInCity = null;
    if (city && city !== 'all') {
      const theatres = await Theatre.find({ city: new RegExp(`^${city.trim()}$`, 'i'), isActive: true }).select('_id');
      theatreIdsInCity = theatres.map((t) => t._id);
      query.theatreId = { $in: theatreIdsInCity };
    }

    const shows = await Show.find(query)
      .populate('movieId', 'title posterUrl runtimeMinutes certification language genres')
      .populate('theatreId', 'name location city address')
      .populate('screenId', 'name totalSeats')
      .sort({ showDate: 1, startTime: 1 });

    return sendSuccess(res, { shows });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single show by ID
 */
const getShowById = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await Show.findById(showId)
      .populate('movieId')
      .populate('theatreId')
      .populate('screenId');

    if (!show) {
      throw new NotFoundError('Show not found');
    }

    return sendSuccess(res, { show });
  } catch (err) {
    next(err);
  }
};

/**
 * Get real-time seat availability for a show
 */
const getShowSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const currentUserId = req.user ? req.user._id : null;

    const seatData = await getShowSeatAvailability(showId, currentUserId);
    return sendSuccess(res, seatData);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new show (Admin only)
 */
const createShow = async (req, res, next) => {
  try {
    const { movieId, theatreId, screenId, showDate, startTime, endTime, seatPricing } = req.body;

    if (!movieId || !theatreId || !showDate || !startTime) {
      throw new ValidationError('Movie, theatre, show date, and start time are required');
    }

    // If screenId is not provided, pick the first active screen of the theatre
    let resolvedScreenId = screenId;
    if (!resolvedScreenId) {
      const screen = await Screen.findOne({ theatreId, isActive: true });
      if (!screen) {
        throw new NotFoundError('No active screen found for this theatre');
      }
      resolvedScreenId = screen._id;
    }

    // Verify screen belongs to theatre
    const screenDoc = await Screen.findById(resolvedScreenId);
    if (!screenDoc || screenDoc.theatreId.toString() !== theatreId.toString()) {
      throw new ValidationError('The specified screen does not belong to this theatre');
    }

    // Conflict check: Check if an overlapping show is already scheduled on this screen
    const conflict = await Show.findOne({
      screenId: resolvedScreenId,
      showDate,
      startTime,
      status: 'active',
    });

    if (conflict) {
      throw new ConflictError('A show is already scheduled on this screen at this date and time');
    }

    // Resolve seat pricing from screen or request
    const resolvedPricing = seatPricing || {
      Balcony: screenDoc.seatCategories?.balcony?.price || 250,
      Middle: screenDoc.seatCategories?.middle?.price || 180,
      Lower: screenDoc.seatCategories?.lower?.price || 120,
    };

    const show = await Show.create({
      movieId,
      theatreId,
      screenId: resolvedScreenId,
      showDate,
      startTime,
      endTime: endTime || '',
      seatPricing: resolvedPricing,
      status: 'active',
    });

    const populatedShow = await Show.findById(show._id)
      .populate('movieId', 'title posterUrl')
      .populate('theatreId', 'name location')
      .populate('screenId', 'name');

    return sendSuccess(res, { show: populatedShow }, 'Show scheduled successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update show details (Admin only)
 */
const updateShow = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await Show.findByIdAndUpdate(showId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!show) {
      throw new NotFoundError('Show not found');
    }

    return sendSuccess(res, { show }, 'Show updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel show (Admin only)
 */
const deleteShow = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const show = await Show.findById(showId);

    if (!show) {
      throw new NotFoundError('Show not found');
    }

    show.status = 'cancelled';
    await show.save();

    return sendSuccess(res, { show }, 'Show cancelled successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllShows,
  getShowById,
  getShowSeats,
  createShow,
  updateShow,
  deleteShow,
};
