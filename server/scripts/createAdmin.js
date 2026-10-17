require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const logger = require('../utils/logger');

const createOrUpdateAdmin = async () => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@imovies.com').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

  logger.info(`[Admin Provisioning] Connecting to database...`);
  await connectDB();

  let admin = await User.findOne({ email });
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  if (admin) {
    admin.username = username;
    admin.role = 'ADMIN';
    admin.passwordHash = passwordHash;
    admin.isActive = true;
    await admin.save();
    logger.info(`[Admin Provisioning] Successfully updated existing user ${email} to ADMIN.`);
  } else {
    admin = await User.create({
      username,
      email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    });
    logger.info(`[Admin Provisioning] Successfully created new administrator: ${email}`);
  }

  logger.info(`Credentials: Email: ${email} | Password: ${password}`);
  await disconnectDB();
  process.exit(0);
};

createOrUpdateAdmin().catch((err) => {
  logger.error(`[Admin Provisioning] Error: ${err.message}`, err);
  process.exit(1);
});
