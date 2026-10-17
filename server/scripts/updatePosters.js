require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');
const Movie = require('../models/Movie');

const updates = [
  { match: /Drishyam/i, posterUrl: '/posters/drishyam.jpg' },
  { match: /OG/i, posterUrl: '/posters/og.jpg' },
  { match: /RRR/i, posterUrl: '/posters/rrr.jpg' },
  { match: /Baahubali/i, posterUrl: '/posters/baahubali2.jpg' },
  { match: /Raja Saab/i, posterUrl: '/posters/raja-saab.jpeg' },
  { match: /Toxic/i, posterUrl: '/posters/toxic.jpg' },
  { match: /Avatar/i, posterUrl: '/posters/avatar.jpg' },
];

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for updating posters...');

    for (const item of updates) {
      const res = await Movie.updateMany(
        { title: item.match },
        { $set: { posterUrl: item.posterUrl } }
      );
      console.log(`Updated movies matching ${item.match}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }

    const movies = await Movie.find({}, 'title posterUrl');
    console.log('Current Movies in DB:', movies);

    await disconnectDB();
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating posters in DB:', err);
    process.exit(1);
  }
};

run();
