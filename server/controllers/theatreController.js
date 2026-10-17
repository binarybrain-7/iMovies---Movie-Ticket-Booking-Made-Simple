const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Show = require('../models/Show');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get all theatres with optional city/location filtering
 */
const getAllTheatres = async (req, res, next) => {
  try {
    const { city, search, activeOnly = 'true' } = req.query;
    const query = {};

    if (activeOnly === 'true') {
      query.isActive = true;
    }

    if (city && city !== 'all') {
      query.city = new RegExp(`^${city.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { location: searchRegex }, { city: searchRegex }];
    }

    const theatres = await Theatre.find(query).sort({ name: 1 });

    // Also get distinct cities for filtering
    const cities = await Theatre.distinct('city', { isActive: true });

    return sendSuccess(res, { theatres, cities });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single theatre with its screens
 */
const getTheatreById = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const theatre = await Theatre.findById(theatreId);

    if (!theatre) {
      throw new NotFoundError('Theatre not found');
    }

    const screens = await Screen.find({ theatreId, isActive: true });

    return sendSuccess(res, { theatre, screens });
  } catch (err) {
    next(err);
  }
};

/**
 * Create theatre with screen configuration (as shown in Add Theatre UI)
 */
const createTheatre = async (req, res, next) => {
  try {
    const {
      name,
      location,
      address,
      city,
      state,
      postalCode,
      // Screen & seat configuration from Add Theatre screen
      balconySeatPrice = 250,
      balconySeatCount = 30,
      middleSeatPrice = 180,
      middleSeatCount = 50,
      lowerSeatPrice = 120,
      lowerSeatCount = 40,
    } = req.body;

    if (!name || !location) {
      throw new ValidationError('Theatre name and location are required');
    }

    const resolvedCity = city || location.split(',')[0].trim();

    const theatre = await Theatre.create({
      name: name.trim(),
      location: location.trim(),
      address: address ? address.trim() : location.trim(),
      city: resolvedCity,
      state: state ? state.trim() : '',
      postalCode: postalCode ? postalCode.trim() : '',
      isActive: true,
    });

    // Create default Screen 1 with seat layout
    const screen = await Screen.create({
      theatreId: theatre._id,
      name: 'Main Screen (Audi 1)',
      seatCategories: {
        balcony: {
          count: Number(balconySeatCount) || 30,
          price: Number(balconySeatPrice) || 250,
        },
        middle: {
          count: Number(middleSeatCount) || 50,
          price: Number(middleSeatPrice) || 180,
        },
        lower: {
          count: Number(lowerSeatCount) || 40,
          price: Number(lowerSeatPrice) || 120,
        },
      },
    });

    return sendSuccess(res, { theatre, screen }, 'Theatre and screen created successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update theatre
 */
const updateTheatre = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const theatre = await Theatre.findByIdAndUpdate(theatreId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      throw new NotFoundError('Theatre not found');
    }

    return sendSuccess(res, { theatre }, 'Theatre updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete / deactivate theatre
 */
const deleteTheatre = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const activeShows = await Show.countDocuments({ theatreId, status: 'active' });
    if (activeShows > 0) {
      await Theatre.findByIdAndUpdate(theatreId, { isActive: false });
      return sendSuccess(res, {}, 'Theatre deactivated due to active shows');
    }

    await Theatre.findByIdAndDelete(theatreId);
    await Screen.deleteMany({ theatreId });
    return sendSuccess(res, {}, 'Theatre and associated screens deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
