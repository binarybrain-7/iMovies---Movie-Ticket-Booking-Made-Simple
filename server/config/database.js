const mongoose = require('mongoose');
const logger = require('../utils/logger');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imovies';

  try {
    logger.info(`Attempting to connect to MongoDB at ${uri}...`);
    // Attempt standard connection with a short serverSelectionTimeoutMS
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    logger.info(`[MongoDB] Connected successfully to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (err) {
    logger.warn(`[MongoDB] Standard connection to ${uri} failed: ${err.message}`);

    // If in development or test, try MongoMemoryServer fallback for seamless out-of-the-box operation
    if (process.env.NODE_ENV !== 'production') {
      try {
        const path = require('path');
        const fs = require('fs');
        const dataDir = path.resolve(__dirname, '../../.mongodb_data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        logger.info(`[MongoDB] Starting persistent database instance on disk at: ${dataDir}`);
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'imovies',
            dbPath: dataDir,
            storageEngine: 'wiredTiger',
          },
        });
        const memoryUri = memoryServer.getUri();
        logger.info(`[MongoDB] Database process started at ${memoryUri}. Connecting Mongoose...`);
        await mongoose.connect(memoryUri);
        logger.info('[MongoDB] Connected successfully to persistent database on disk.');
        return mongoose.connection;
      } catch (memErr) {
        logger.error(`[MongoDB] Failed to start database: ${memErr.message}`, memErr);
        throw new Error(`MongoDB connection error: ${err.message}. Fallback also failed: ${memErr.message}`);
      }
    }


    throw err;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      logger.info('[MongoDB] MongoMemoryServer stopped.');
    }
    logger.info('[MongoDB] Disconnected successfully.');
  } catch (err) {
    logger.error(`[MongoDB] Error during disconnection: ${err.message}`, err);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
