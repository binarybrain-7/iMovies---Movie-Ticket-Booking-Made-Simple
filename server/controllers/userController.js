const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');
const { ValidationError, UnauthorizedError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get profile and statistics
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [bookingCount, favoriteCount, reviewCount] = await Promise.all([
      Booking.countDocuments({ userId }),
      Favorite.countDocuments({ userId }),
      Review.countDocuments({ userId }),
    ]);

    return sendSuccess(res, {
      user: req.user,
      stats: {
        bookings: bookingCount,
        favorites: favoriteCount,
        reviews: reviewCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { username, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (username) user.username = username.trim();
    if (phone !== undefined) user.phone = phone.trim();

    // Ensure role cannot be altered via profile update
    await user.save();

    return sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Change user password securely
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      throw new ValidationError('New passwords do not match');
    }

    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return sendSuccess(res, {}, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
