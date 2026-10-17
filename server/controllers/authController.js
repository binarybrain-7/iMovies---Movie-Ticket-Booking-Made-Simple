const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'imovies_default_jwt_secret',
    { expiresIn: '7d' }
  );
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword, phone, adminSecretKey } = req.body;

    if (!username || !email || !password) {
      throw new ValidationError('Username, email, and password are required');
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new ValidationError('Passwords do not match');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    // Check admin creation security: Never allow public users to set admin role without secret key or seed script
    let role = 'USER';
    // If user attempts to register as admin (as shown in UI "Register as an Admin" link):
    if (req.body.role === 'ADMIN') {
      const validAdminSecret = process.env.ADMIN_REGISTRATION_SECRET || 'imovies_admin_secure_secret_2026';
      if (adminSecretKey === validAdminSecret) {
        role = 'ADMIN';
        logger.info(`[Auth] Admin account provisioned for ${email}`);
      } else {
        logger.warn(`[Auth] Attempted unauthorized admin registration for ${email}`);
        throw new ValidationError('Invalid admin authorization credentials');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone ? phone.trim() : '',
      role,
    });

    const token = signToken(newUser);

    logger.info(`[Auth] User registered successfully: ${newUser.email} (${newUser.role})`);

    return sendSuccess(
      res,
      {
        user: newUser,
        token,
      },
      'Registration successful',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated. Please contact support.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken(user);
    logger.info(`[Auth] User logged in successfully: ${user.email} (${user.role})`);

    return sendSuccess(
      res,
      {
        user,
        token,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, { user: req.user }, 'User profile retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * Logout
 */
const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
