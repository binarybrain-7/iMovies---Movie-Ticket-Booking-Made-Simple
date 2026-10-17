const Screen = require('../models/Screen');
const Show = require('../models/Show');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get screens for a theatre
 */
const getScreensByTheatre = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const screens = await Screen.find({ theatreId, isActive: true });
    return sendSuccess(res, { screens });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new screen for a theatre
 */
const createScreen = async (req, res, next) => {
  try {
    const { theatreId } = req.params;
    const { name, seatCategories } = req.body;

    if (!name) {
      throw new ValidationError('Screen name is required');
    }

    const screen = await Screen.create({
      theatreId,
      name: name.trim(),
      seatCategories: seatCategories || {
        balcony: { count: 30, price: 250 },
        middle: { count: 50, price: 180 },
        lower: { count: 40, price: 120 },
      },
    });

    return sendSuccess(res, { screen }, 'Screen created successfully', 201);
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
    const screen = await Screen.findByIdAndUpdate(screenId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!screen) {
      throw new NotFoundError('Screen not found');
    }

    return sendSuccess(res, { screen }, 'Screen updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getScreensByTheatre,
  createScreen,
  updateScreen,
};
