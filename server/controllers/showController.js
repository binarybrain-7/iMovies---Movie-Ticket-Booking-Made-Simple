const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Booking = require('../models/Booking');
const { getShowSeatAvailability } = require('../services/seatLockService');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Helper to parse time string (24h "14:30" or 12h "02:30 PM") into minutes from midnight
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const str = timeStr.trim();
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match12) return null;

  let hours = parseInt(match12[1], 10);
  const minutes = parseInt(match12[2], 10);
  const modifier = match12[3] ? match12[3].toUpperCase() : null;

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

/**
 * Helper to format minutes from midnight into 24h "HH:MM"
 */
const formatMinutesToTime = (totalMinutes) => {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const minutes = norm % 60;
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${pad(hours)}:${pad(minutes)}`;
};

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
      const theatres = await Theatre.find({
        city: new RegExp(`^${city.trim()}$`, 'i'),
        isActive: true,
      }).select('_id');
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

    const bookingsCount = await Booking.countDocuments({
      showId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });

    return sendSuccess(res, { show, bookingsCount });
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
 * Verify show conflict taking movie runtime and buffer into account
 */
const checkShowOverlap = async ({ screenId, showDate, startTime, movieRuntimeMinutes, excludeShowId = null }) => {
  const startMins = parseTimeToMinutes(startTime);
  if (startMins === null) {
    throw new ValidationError('Invalid show start time format. Use HH:MM or hh:mm AM/PM');
  }

  // Runtime + 15 minute cleaning/intermission buffer
  const runtime = Number(movieRuntimeMinutes) || 120;
  const bufferMinutes = 15;
  const endMins = startMins + runtime + bufferMinutes;

  const query = {
    screenId,
    showDate,
    status: 'active',
  };

  if (excludeShowId) {
    query._id = { $ne: excludeShowId };
  }

  const existingShows = await Show.find(query).populate('movieId', 'title runtimeMinutes');

  for (const existing of existingShows) {
    const existingStart = parseTimeToMinutes(existing.startTime);
    if (existingStart === null) continue;

    const existingRuntime = Number(existing.movieId?.runtimeMinutes) || 120;
    const existingEnd = existingStart + existingRuntime + bufferMinutes;

    // Check interval overlap: [startMins, endMins) intersects [existingStart, existingEnd)
    if (startMins < existingEnd && existingStart < endMins) {
      const conflictTitle = existing.movieId?.title || 'Another Movie';
      throw new ConflictError(
        `Schedule conflict on this screen: Overlaps with "${conflictTitle}" scheduled from ${existing.startTime} to ${formatMinutesToTime(
          existingEnd
        )} (including buffer).`
      );
    }
  }

  return formatMinutesToTime(endMins);
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

    // Verify Movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Selected movie not found');
    }

    // Verify Theatre exists
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      throw new NotFoundError('Selected theatre not found');
    }

    // If screenId is not provided, pick the first active screen of the theatre
    let resolvedScreenId = screenId;
    if (!resolvedScreenId) {
      const screen = await Screen.findOne({ theatreId, isActive: true });
      if (!screen) {
        throw new NotFoundError('No active screen found for this theatre. Please add a screen first.');
      }
      resolvedScreenId = screen._id;
    }

    // Verify screen belongs to theatre
    const screenDoc = await Screen.findById(resolvedScreenId);
    if (!screenDoc || screenDoc.theatreId.toString() !== theatreId.toString()) {
      throw new ValidationError('The specified screen does not belong to the selected theatre');
    }

    // Check runtime overlap with 15m buffer
    const calculatedEndTime = await checkShowOverlap({
      screenId: resolvedScreenId,
      showDate,
      startTime,
      movieRuntimeMinutes: movie.runtimeMinutes,
    });

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
      endTime: endTime || calculatedEndTime,
      seatPricing: resolvedPricing,
      status: 'active',
    });

    const populatedShow = await Show.findById(show._id)
      .populate('movieId', 'title posterUrl runtimeMinutes certification language genres')
      .populate('theatreId', 'name location city address')
      .populate('screenId', 'name totalSeats');

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
    const existingShow = await Show.findById(showId);

    if (!existingShow) {
      throw new NotFoundError('Show not found');
    }

    const {
      movieId,
      theatreId,
      screenId,
      showDate,
      startTime,
      endTime,
      seatPricing,
      status,
      confirmReschedule,
    } = req.body;

    // Check existing customer bookings for this show
    const bookingsCount = await Booking.countDocuments({
      showId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
    });

    // 1. If bookings exist, forbid changing movie, theatre, or screen
    if (bookingsCount > 0) {
      if (movieId && movieId.toString() !== existingShow.movieId.toString()) {
        throw new ValidationError(
          `Cannot change movie because this show already has ${bookingsCount} customer booking(s). Please cancel the show instead or create a new show.`
        );
      }
      if (theatreId && theatreId.toString() !== existingShow.theatreId.toString()) {
        throw new ValidationError(
          `Cannot change theatre because this show already has ${bookingsCount} customer booking(s).`
        );
      }
      if (screenId && screenId.toString() !== existingShow.screenId.toString()) {
        throw new ValidationError(
          `Cannot change screen because this show already has ${bookingsCount} customer booking(s) assigned to existing seat numbers.`
        );
      }

      // Check if schedule (date/time) changed without explicit confirmation
      const isDateChanged = showDate && showDate !== existingShow.showDate;
      const isTimeChanged = startTime && startTime !== existingShow.startTime;
      if ((isDateChanged || isTimeChanged) && !confirmReschedule) {
        throw new ValidationError(
          `This show already has ${bookingsCount} customer booking(s). Rescheduling will alter showtimes for these ticket holders. Please confirm reschedule to apply changes.`
        );
      }
    }

    // Resolve target movie, theatre, screen
    const targetMovieId = movieId || existingShow.movieId;
    const targetTheatreId = theatreId || existingShow.theatreId;
    const targetScreenId = screenId || existingShow.screenId;
    const targetShowDate = showDate || existingShow.showDate;
    const targetStartTime = startTime || existingShow.startTime;

    const movie = await Movie.findById(targetMovieId);
    if (!movie) throw new NotFoundError('Selected movie not found');

    const theatre = await Theatre.findById(targetTheatreId);
    if (!theatre) throw new NotFoundError('Selected theatre not found');

    const screenDoc = await Screen.findById(targetScreenId);
    if (!screenDoc || screenDoc.theatreId.toString() !== targetTheatreId.toString()) {
      throw new ValidationError('Screen does not belong to the selected theatre');
    }

    // If schedule or screen changed, re-check overlap conflict
    const scheduleChanged =
      targetScreenId.toString() !== existingShow.screenId.toString() ||
      targetShowDate !== existingShow.showDate ||
      targetStartTime !== existingShow.startTime ||
      targetMovieId.toString() !== existingShow.movieId.toString();

    let calculatedEndTime = existingShow.endTime;
    if (scheduleChanged) {
      calculatedEndTime = await checkShowOverlap({
        screenId: targetScreenId,
        showDate: targetShowDate,
        startTime: targetStartTime,
        movieRuntimeMinutes: movie.runtimeMinutes,
        excludeShowId: showId,
      });
    }

    existingShow.movieId = targetMovieId;
    existingShow.theatreId = targetTheatreId;
    existingShow.screenId = targetScreenId;
    existingShow.showDate = targetShowDate;
    existingShow.startTime = targetStartTime;
    existingShow.endTime = endTime || calculatedEndTime;

    if (seatPricing) {
      existingShow.seatPricing = seatPricing;
    }
    if (status) {
      existingShow.status = status;
    }

    await existingShow.save();

    const populatedShow = await Show.findById(existingShow._id)
      .populate('movieId', 'title posterUrl runtimeMinutes certification language genres')
      .populate('theatreId', 'name location city address')
      .populate('screenId', 'name totalSeats');

    return sendSuccess(res, { show: populatedShow }, 'Show updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel or delete show (Admin only)
 */
const deleteShow = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { hardDelete = 'false' } = req.query;
    const show = await Show.findById(showId);

    if (!show) {
      throw new NotFoundError('Show not found');
    }

    const bookingsCount = await Booking.countDocuments({ showId });

    // If bookings exist or hardDelete not specified, cancel safely to retain tickets & financial audit trail
    if (bookingsCount > 0 || hardDelete !== 'true') {
      show.status = 'cancelled';
      await show.save();

      const populatedShow = await Show.findById(show._id)
        .populate('movieId', 'title posterUrl')
        .populate('theatreId', 'name location')
        .populate('screenId', 'name');

      return sendSuccess(
        res,
        { show: populatedShow, cancelled: true, bookingsPreserved: bookingsCount },
        bookingsCount > 0
          ? `Show cancelled. Preserved ${bookingsCount} customer booking(s) and transaction records.`
          : 'Show cancelled successfully.'
      );
    }

    // No bookings and explicit hardDelete requested: delete permanently
    await Show.findByIdAndDelete(showId);
    return sendSuccess(res, { showId }, 'Show deleted permanently');
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
