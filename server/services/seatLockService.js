const crypto = require('crypto');
const SeatLock = require('../models/SeatLock');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Screen = require('../models/Screen');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { emitSeatLocked, emitSeatReleased } = require('./socketService');
const logger = require('../utils/logger');

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Acquire temporary lock on selected seats for a show
 */
const acquireSeatLock = async (showId, userId, requestedSeatNumbers) => {
  if (!showId || !requestedSeatNumbers || !requestedSeatNumbers.length) {
    throw new ValidationError('Show ID and seat numbers are required');
  }

  // 1. Verify show exists and is active
  const show = await Show.findById(showId).populate('screenId');
  if (!show || show.status !== 'active') {
    throw new NotFoundError('Show is not available for booking');
  }

  // 2. Verify all requested seats exist in screen layout
  const screen = show.screenId;
  if (!screen || !screen.seatLayout) {
    throw new NotFoundError('Screen layout not found for this show');
  }

  const validSeatsMap = new Map();
  for (const s of screen.seatLayout) {
    validSeatsMap.set(s.seatNumber, s);
  }

  const lockedSeatsData = [];
  for (const seatNum of requestedSeatNumbers) {
    const seatConfig = validSeatsMap.get(seatNum);
    if (!seatConfig) {
      throw new ValidationError(`Seat ${seatNum} is invalid for this screen layout`);
    }
    // Calculate price based on show's seatPricing for this category
    const category = seatConfig.category; // 'Balcony', 'Middle', or 'Lower'
    const price = show.seatPricing[category] || 150;
    lockedSeatsData.push({
      seatNumber: seatConfig.seatNumber,
      category,
      price,
    });
  }

  const now = new Date();

  // 3. Concurrency check: Check if any seat is already booked for this show
  const existingBookings = await Booking.find({
    showId,
    status: 'CONFIRMED',
    'seats.seatNumber': { $in: requestedSeatNumbers },
  }).select('seats');

  if (existingBookings.length > 0) {
    const bookedSeatSet = new Set();
    existingBookings.forEach((b) => {
      b.seats.forEach((s) => {
        if (requestedSeatNumbers.includes(s.seatNumber)) {
          bookedSeatSet.add(s.seatNumber);
        }
      });
    });
    throw new ConflictError(
      `The following seats are already booked: ${Array.from(bookedSeatSet).join(', ')}`
    );
  }

  // 4. Concurrency check: Check if any seat is currently locked by another user (and not expired)
  const activeLocks = await SeatLock.find({
    showId,
    status: 'ACTIVE',
    expiresAt: { $gt: now },
    userId: { $ne: userId },
    'seats.seatNumber': { $in: requestedSeatNumbers },
  });

  if (activeLocks.length > 0) {
    const conflictingSeats = [];
    activeLocks.forEach((lock) => {
      lock.seats.forEach((s) => {
        if (requestedSeatNumbers.includes(s.seatNumber)) {
          conflictingSeats.push(s.seatNumber);
        }
      });
    });
    throw new ConflictError(
      `The following seats are temporarily held by another customer: ${conflictingSeats.join(', ')}`
    );
  }

  // Release any previous active locks by THIS user for this show to avoid duplicate locks
  await SeatLock.updateMany(
    {
      showId,
      userId,
      status: 'ACTIVE',
    },
    {
      status: 'RELEASED',
    }
  );

  // 5. Create new temporary seat lock
  const lockToken = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS);

  const newLock = await SeatLock.create({
    showId,
    userId,
    seats: lockedSeatsData,
    lockToken,
    expiresAt,
    status: 'ACTIVE',
  });

  // 6. Broadcast real-time seat lock to other clients
  emitSeatLocked(showId, lockedSeatsData, lockToken, userId);
  logger.info(`[SeatLock] Acquired lock for seats: ${requestedSeatNumbers.join(', ')} on show ${showId}`);

  return {
    lockId: newLock._id,
    lockToken: newLock.lockToken,
    expiresAt: newLock.expiresAt,
    seats: newLock.seats,
    durationMs: LOCK_DURATION_MS,
  };
};

/**
 * Release an active seat lock
 */
const releaseSeatLock = async (lockIdOrToken, userId) => {
  const query = {
    $or: [{ _id: lockIdOrToken }, { lockToken: lockIdOrToken }],
    status: 'ACTIVE',
  };
  if (userId) {
    query.userId = userId;
  }

  const lock = await SeatLock.findOne(query);
  if (!lock) {
    return false;
  }

  lock.status = 'RELEASED';
  await lock.save();

  const seatNumbers = lock.seats.map((s) => s.seatNumber);
  emitSeatReleased(lock.showId, seatNumbers);
  logger.info(`[SeatLock] Released seats: ${seatNumbers.join(', ')} for show ${lock.showId}`);

  return true;
};

/**
 * Get current seat status map for a show
 */
const getShowSeatAvailability = async (showId, currentUserId = null) => {
  const show = await Show.findById(showId).populate('screenId');
  if (!show || !show.screenId) {
    throw new NotFoundError('Show or screen not found');
  }

  const screen = show.screenId;
  const now = new Date();

  // Find confirmed bookings
  const confirmedBookings = await Booking.find({
    showId,
    status: 'CONFIRMED',
  }).select('seats');

  const bookedSeatNumbers = new Set();
  confirmedBookings.forEach((b) => {
    b.seats.forEach((s) => bookedSeatNumbers.add(s.seatNumber));
  });

  // Find active, unexpired locks
  const activeLocks = await SeatLock.find({
    showId,
    status: 'ACTIVE',
    expiresAt: { $gt: now },
  });

  const lockedByOtherSeats = new Set();
  const lockedByCurrentUserSeats = new Set();

  activeLocks.forEach((l) => {
    const isOwner = currentUserId && l.userId.toString() === currentUserId.toString();
    l.seats.forEach((s) => {
      if (isOwner) {
        lockedByCurrentUserSeats.add(s.seatNumber);
      } else {
        lockedByOtherSeats.add(s.seatNumber);
      }
    });
  });

  // Build complete seat map with pricing and status
  const seatsWithStatus = screen.seatLayout.map((s) => {
    const seatNumber = s.seatNumber;
    let status = 'available';

    if (bookedSeatNumbers.has(seatNumber)) {
      status = 'booked';
    } else if (lockedByCurrentUserSeats.has(seatNumber)) {
      status = 'selected';
    } else if (lockedByOtherSeats.has(seatNumber)) {
      status = 'locked';
    }

    const price = show.seatPricing[s.category] || 150;

    return {
      seatNumber: s.seatNumber,
      row: s.row,
      number: s.number,
      category: s.category,
      price,
      status,
    };
  });

  return {
    showId: show._id,
    screenName: screen.name,
    seatPricing: show.seatPricing,
    totalSeats: screen.totalSeats,
    seats: seatsWithStatus,
  };
};

module.exports = {
  acquireSeatLock,
  releaseSeatLock,
  getShowSeatAvailability,
  LOCK_DURATION_MS,
};
