require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { connectDB, disconnectDB } = require('./config/database');
const { ensureDemoData } = require('./scripts/autoSeed');
const { initSocket } = require('./services/socketService');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or matching dev ports
      if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return callback(null, true);
      }
      if (origin === CLIENT_URL) {
        return callback(null, true);
      }
      callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api', apiLimiter);

// Body parsers (skip json parsing for raw webhook endpoint)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded static assets (posters, banners, qr codes)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/posters', express.static(path.join(__dirname, 'public/uploads/posters')));


// Initialize Socket.IO
initSocket(server, CLIENT_URL);

// Mount main API
app.use('/api/v1', routes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('[Server] HTTP and Socket server closed.');
    await disconnectDB();
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
const start = async () => {
  try {
    // Connect to database before accepting traffic
    await connectDB();
    await ensureDemoData();

    server.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`  🎬 IMovies Backend Server Running!`);
      logger.info(`  🌍 URL: http://localhost:${PORT}`);
      logger.info(`  📡 Health Check: http://localhost:${PORT}/api/v1/health`);
      logger.info(`  💻 Frontend Origin: ${CLIENT_URL}`);
      logger.info(`  🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`, err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = { app, server };
