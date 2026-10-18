const Screen = require('../models/Screen');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Booking = require('../models/Booking');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get all screens with optional theatre filtering, active filtering, and search
 */
const getAllScreens = async (req, res, next) => {
  try {
    const { theatreId, activeOnly, search } = req.query;
    const query = {};

    if (activeOnly === 'true' || activeOnly === true) {
      query.isActive = true;
    }

    if (theatreId && theatreId !== 'all') {
      query.theatreId = theatreId;
    }

    if (search && search.trim()) {
      query.name = new RegExp(search.trim(), 'i');
    }

    const screens = await Screen.find(query)
      .populate('theatreId', 'name location city address')
      .sort({ theatreId: 1, name: 1 });

    return sendSuccess(res, { screens });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single screen by ID
 */
const getScreenById = async (req, res, next) => {
  try {
    const { screenId } = req.params;
    const screen = await Screen.findById(screenId).populate('theatreId', 'name location city address');

    if (!screen) {
      throw new NotFoundError('Screen not found');
    }

    const activeShowsCount = await Show.countDocuments({ screenId, status: 'active' });

    return sendSuccess(res, { screen, activeShowsCount });
  } catch (err) {
    next(err);
  }
};

/**
 * Get screens for a theatre
 */
const getScreensByTheatre = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const { activeOnly = 'true' } = req.query;
    const query = { theatreId };

    if (activeOnly === 'true' || activeOnly === true) {
      query.isActive = true;
    }

    const screens = await Screen.find(query).sort({ name: 1 });
    return sendSuccess(res, { screens });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new screen (supports /theatres/:theatreId/screens and /screens)
 */
const createScreen = async (req, res, next) => {
  try {
    const theatreId = req.params.theatreId || req.body.theatreId;
    const { name, seatCategories, isActive = true } = req.body;

    if (!theatreId) {
      throw new ValidationError('Theatre ID is required');
    }

    if (!name || !name.trim()) {
      throw new ValidationError('Screen name is required');
    }

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      throw new NotFoundError('Associated theatre not found');
    }

    const screen = await Screen.create({
      theatreId,
      name: name.trim(),
      seatCategories: seatCategories || {
        balcony: { count: 30, price: 250 },
        middle: { count: 50, price: 180 },
        lower: { count: 40, price: 120 },
      },
      isActive: isActive !== false,
    });

    const populatedScreen = await Screen.findById(screen._id).populate('theatreId', 'name location city');

    return sendSuccess(res, { screen: populatedScreen }, 'Screen created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update screen
 */
const updateScreen = async (req, res, next) => {
  try {
    const { screenId } = req.params;
    const updateData = { ...req.body };

    // If theatreId changed, verify that new theatre exists
    if (updateData.theatreId) {
      const theatre = await Theatre.findById(updateData.theatreId);
      if (!theatre) {
        throw new NotFoundError('Target theatre not found');
      }

      // Check if this screen has active shows before moving to another theatre
      const activeShows = await Show.countDocuments({ screenId, status: 'active' });
      if (activeShows > 0) {
        throw new ValidationError('Cannot reassign screen to another theatre while active shows are scheduled on it.');
      }
    }

    const screen = await Screen.findByIdAndUpdate(screenId, updateData, {
      new: true,
      runValidators: true,
    }).populate('theatreId', 'name location city address');

    if (!screen) {
      throw new NotFoundError('Screen not found');
    }

    return sendSuccess(res, { screen }, 'Screen updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete / deactivate screen
 */
const deleteScreen = async (req, res, next) => {
  try {
    const { screenId } = req.params;
    const screen = await Screen.findById(screenId);

    if (!screen) {
      throw new NotFoundError('Screen not found');
    }

    // Check for shows and bookings attached to this screen
    const shows = await Show.find({ screenId }).select('_id');
    const showIds = shows.map((s) => s._id);

    const bookingsCount = await Booking.countDocuments({ showId: { $in: showIds } });
    const activeShows = await Show.countDocuments({ screenId, status: 'active' });

    if (bookingsCount > 0 || activeShows > 0) {
      screen.isActive = false;
      await screen.save();
      return sendSuccess(
        res,
        { screen, deactivated: true, bookingsCount, activeShows },
        `Screen deactivated to preserve ${bookingsCount} customer booking(s) and historical show schedules.`
      );
    }

    if (showIds.length > 0) {
      await Show.deleteMany({ screenId });
    }
    await Screen.findByIdAndDelete(screenId);
    return sendSuccess(res, {}, 'Screen deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllScreens,
  getScreenById,
  getScreensByTheatre,
  createScreen,
  updateScreen,
  deleteScreen,
};
