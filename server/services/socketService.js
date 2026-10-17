const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

const initSocket = (httpServer, clientOrigin) => {
  io = new Server(httpServer, {
    cors: {
      origin: clientOrigin || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for a specific show's real-time seat map
    socket.on('join_show', (showId) => {
      if (showId) {
        socket.join(`show_${showId}`);
        logger.debug(`[Socket.IO] Client ${socket.id} joined room show_${showId}`);
      }
    });

    // Leave room
    socket.on('leave_show', (showId) => {
      if (showId) {
        socket.leave(`show_${showId}`);
        logger.debug(`[Socket.IO] Client ${socket.id} left room show_${showId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Emit seat lock update to room
const emitSeatLocked = (showId, seats, lockToken, userId) => {
  if (io) {
    io.to(`show_${showId}`).emit('seat_locked', {
      showId,
      seats: seats.map((s) => s.seatNumber || s),
      lockToken,
      userId,
      timestamp: new Date(),
    });
  }
};

// Emit seat release update to room
const emitSeatReleased = (showId, seatNumbers) => {
  if (io) {
    io.to(`show_${showId}`).emit('seat_released', {
      showId,
      seats: seatNumbers,
      timestamp: new Date(),
    });
  }
};

// Emit booking confirmed update to room
const emitSeatsBooked = (showId, seatNumbers) => {
  if (io) {
    io.to(`show_${showId}`).emit('seats_booked', {
      showId,
      seats: seatNumbers,
      timestamp: new Date(),
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitSeatLocked,
  emitSeatReleased,
  emitSeatsBooked,
};
