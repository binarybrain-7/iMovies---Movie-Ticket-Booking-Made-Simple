const { acquireSeatLock, releaseSeatLock } = require('../services/seatLockService');
const SeatLock = require('../models/SeatLock');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Acquire temporary seat locks
 * POST /api/v1/shows/:showId/seat-locks
 */
const createSeatLock = async (req, res, next) => {
  try {
    const { showId } = req.params;
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      throw new ValidationError('At least one seat must be selected');
    }

    if (seats.length > 10) {
      throw new ValidationError('A maximum of 10 seats can be reserved in one transaction');
    }

    const lockResult = await acquireSeatLock(showId, req.user._id, seats);

    return sendSuccess(res, lockResult, 'Seats locked temporarily for 5 minutes', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Release seat lock
 * DELETE /api/v1/seat-locks/:lockId
 */
const releaseLock = async (req, res, next) => {
  try {
    const { lockId } = req.params;
    const released = await releaseSeatLock(lockId, req.user._id);

    if (!released) {
      throw new NotFoundError('Active seat lock not found or already released');
    }

    return sendSuccess(res, {}, 'Seats released successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Check lock status
 * GET /api/v1/seat-locks/:lockId
 */
const getSeatLock = async (req, res, next) => {
  try {
    const { lockId } = req.params;
    const lock = await SeatLock.findById(lockId).populate('showId');

    if (!lock) {
      throw new NotFoundError('Seat lock record not found');
    }

    const isExpired = new Date() > new Date(lock.expiresAt);

    return sendSuccess(res, {
      lock,
      isExpired,
      isActive: lock.status === 'ACTIVE' && !isExpired,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSeatLock,
  releaseLock,
  getSeatLock,
};
