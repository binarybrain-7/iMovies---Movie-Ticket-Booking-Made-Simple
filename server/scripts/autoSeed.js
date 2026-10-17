const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const upgradeToCinepolisAuditorium = async () => {
  try {
    const cinepolisLayout = Screen.generateCinepolisLayout ? Screen.generateCinepolisLayout() : [];
    if (!cinepolisLayout.length) return;

    // Ensure all screens have Cinepolis layout
    const allScreens = await Screen.find({});
    for (const scr of allScreens) {
      if (!scr.seatLayout || scr.seatLayout.length < 150) {
        scr.seatLayout = cinepolisLayout;
        scr.totalSeats = cinepolisLayout.length;
        await scr.save();
        logger.info(`[AutoSeed] Upgraded screen ${scr.name} to Cinepolis 184-seat auditorium.`);
      }
    }

    // Ensure Cinepolis Bansal Plaza, Bhopal exists
    let cinepolis = await Theatre.findOne({ name: /Cinepolis/i });
    if (!cinepolis) {
      cinepolis = await Theatre.create({
        name: 'Cinepolis Bansal Plaza',
        location: 'Bhopal',
        address: 'Bansal One, Rani Kamlapati, Bhopal',
        city: 'Bhopal',
        state: 'Madhya Pradesh',
        postalCode: '462016',
        isActive: true,
      });
      logger.info('[AutoSeed] Created Cinepolis Bansal Plaza, Bhopal theatre.');
    }

    let cineScreen = await Screen.findOne({ theatreId: cinepolis._id });
    if (!cineScreen) {
      cineScreen = await Screen.create({
        theatreId: cinepolis._id,
        name: 'Audi 2 (2K Laser Dolby)',
        totalSeats: cinepolisLayout.length,
        seatLayout: cinepolisLayout,
      });
    }

    const cinemaPricing = {
      Recliner: 690,
      'Premium Plus': 230,
      'Premium XL': 230,
      Premium: 210,
      Executive: 210,
      Normal: 210,
      Balcony: 450,
      Middle: 320,
      Lower: 220,
    };

    // Update all shows seat pricing to reference Cinepolis pricing
    await Show.updateMany({}, { $set: { seatPricing: cinemaPricing } });

    // Seed Drishyam: The Conclusion at Cinepolis with reference showtimes
    const drishyam = await Movie.findOne({ title: /Drishyam/i });
    if (drishyam && cinepolis && cineScreen) {
      const formatLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      for (let offset = -1; offset <= 5; offset++) {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const dateStr = formatLocalDate(d);
        const times = [
          { start: '11:00 AM', end: '01:45 PM' },
          { start: '02:10 PM', end: '04:55 PM' },
          { start: '03:10 PM', end: '05:55 PM' },
        ];

        for (const t of times) {
          const existing = await Show.findOne({
            movieId: drishyam._id,
            theatreId: cinepolis._id,
            showDate: dateStr,
            startTime: t.start,
          });
          if (!existing) {
            await Show.create({
              movieId: drishyam._id,
              theatreId: cinepolis._id,
              screenId: cineScreen._id,
              showDate: dateStr,
              startTime: t.start,
              endTime: t.end,
              seatPricing: cinemaPricing,
              status: 'active',
            });
          }
        }
      }
    }
  } catch (err) {
    logger.warn(`[AutoSeed] Note during auditorium upgrade: ${err.message}`);
  }
};

const ensureDemoData = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    if (movieCount > 0) {
      await upgradeToCinepolisAuditorium();
      const showCount = await Show.countDocuments();
      if (showCount < 30) {
        logger.info(`[AutoSeed] Database has ${movieCount} movies but only ${showCount} shows. Seeding comprehensive shows...`);
        await seedShowsForAllMovies();
      } else {
        logger.info(`[AutoSeed] Database verified with ${movieCount} movies and ${showCount} shows.`);
      }
      return;
    }


    logger.info('[AutoSeed] Database is empty. Seeding essential demo data...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
    const userPasswordHash = await bcrypt.hash('User@123456', salt);

    // Create Admin and Standard Users with stable IDs
    await User.create([
      {
        _id: new mongoose.Types.ObjectId('65a000000000000000000001'),
        username: 'admin',
        email: 'admin@imovies.com',
        passwordHash: adminPasswordHash,
        phone: '+91 9876543210',
        role: 'ADMIN',
      },
      {
        _id: new mongoose.Types.ObjectId('65a000000000000000000002'),
        username: 'Aditya Vishwakarma',
        email: 'aditya@example.com',
        passwordHash: userPasswordHash,
        phone: '+91 9123456789',
        role: 'USER',
      },
      {
        _id: new mongoose.Types.ObjectId('65a000000000000000000003'),
        username: 'G V V D Kumar',
        email: 'gvvdkumar@gmail.com',
        passwordHash: userPasswordHash,
        phone: '+91 9848022338',
        role: 'USER',
      },
    ]);

    // Create Theatres & Screens
    const srinivasaTheatre = await Theatre.create({
      name: 'Srinivasa Theatre',
      location: 'RTC X Roads, Hyderabad',
      address: 'Near Chikkadpally, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500020',
      isActive: true,
    });

    const srinivasaScreen = await Screen.create({
      theatreId: srinivasaTheatre._id,
      name: 'Screen 1 (Main Audi)',
      seatCategories: {
        balcony: { count: 30, price: 250 },
        middle: { count: 50, price: 180 },
        lower: { count: 40, price: 120 },
      },
    });

    const srinivasaScreen2 = await Screen.create({
      theatreId: srinivasaTheatre._id,
      name: 'Screen 2 (RGB Laser)',
      seatCategories: {
        balcony: { count: 30, price: 250 },
        middle: { count: 50, price: 180 },
        lower: { count: 40, price: 120 },
      },
    });

    const gokulTheatre = await Theatre.create({
      name: 'Gokul Cinema',
      location: 'KPHB Colony, Hyderabad',
      address: 'Road No. 1, Kukatpally, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500072',
      isActive: true,
    });

    const gokulScreen = await Screen.create({
      theatreId: gokulTheatre._id,
      name: 'Screen 1 (Dolby Atmos)',
      seatCategories: {
        balcony: { count: 30, price: 280 },
        middle: { count: 50, price: 200 },
        lower: { count: 40, price: 130 },
      },
    });

    const gokulScreen2 = await Screen.create({
      theatreId: gokulTheatre._id,
      name: 'Screen 2 (Silver Screen)',
      seatCategories: {
        balcony: { count: 30, price: 280 },
        middle: { count: 50, price: 200 },
        lower: { count: 40, price: 130 },
      },
    });

    const buildCinepolisSeatLayout = () => {
      const layout = [];
      // Row L: RECLINER (11 seats, descending 11 to 1)
      for (let s = 11; s >= 1; s--) {
        layout.push({ seatNumber: `L-${s}`, row: 'L', number: s, category: 'Recliner' });
      }
      // Row K: PREMIUM PLUS (15 seats, descending 15 to 1)
      for (let s = 15; s >= 1; s--) {
        layout.push({ seatNumber: `K-${s}`, row: 'K', number: s, category: 'Premium Plus' });
      }
      // Row J: PREMIUM XL (13 seats, descending 13 to 1)
      for (let s = 13; s >= 1; s--) {
        layout.push({ seatNumber: `J-${s}`, row: 'J', number: s, category: 'Premium XL' });
      }
      // Rows I, H, G, F, E: PREMIUM (19 seats each, descending 19 to 1)
      ['I', 'H', 'G', 'F', 'E'].forEach((row) => {
        for (let s = 19; s >= 1; s--) {
          layout.push({ seatNumber: `${row}-${s}`, row, number: s, category: 'Premium' });
        }
      });
      // Rows D, C, B: EXECUTIVE (15 seats each, descending 15 to 1)
      ['D', 'C', 'B'].forEach((row) => {
        for (let s = 15; s >= 1; s--) {
          layout.push({ seatNumber: `${row}-${s}`, row, number: s, category: 'Executive' });
        }
      });
      // Row A: NORMAL (15 seats, descending 15 to 1)
      for (let s = 15; s >= 1; s--) {
        layout.push({ seatNumber: `A-${s}`, row: 'A', number: s, category: 'Normal' });
      }
      return layout;
    };

    // Cinepolis Bansal Plaza, Bhopal (matching Image 2)
    const cinepolisBhopal = await Theatre.create({
      name: 'Cinepolis Bansal Plaza',
      location: 'Bhopal',
      address: 'Bansal One, Rani Kamlapati, Bhopal',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      postalCode: '462016',
      isActive: true,
    });

    const cinepolisScreen = await Screen.create({
      theatreId: cinepolisBhopal._id,
      name: 'Audi 2 (2K Laser Dolby)',
      totalSeats: 194,
      seatLayout: buildCinepolisSeatLayout(),
      seatCategories: {
        balcony: { count: 11, price: 690 },
        middle: { count: 123, price: 230 },
        lower: { count: 60, price: 210 },
      },
    });

    const pvrForum = await Theatre.create({
      name: 'PVR IMAX Forum Mall',
      location: 'Koramangala, Bangalore',
      address: 'Hosur Road, Koramangala, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560095',
      isActive: true,
    });

    const pvrScreen = await Screen.create({
      theatreId: pvrForum._id,
      name: 'IMAX Laser Audi',
      seatCategories: {
        balcony: { count: 30, price: 450 },
        middle: { count: 50, price: 320 },
        lower: { count: 40, price: 220 },
      },
    });

    const pvrScreen2 = await Screen.create({
      theatreId: pvrForum._id,
      name: 'PVR P[XL] Audi',
      seatCategories: {
        balcony: { count: 30, price: 450 },
        middle: { count: 50, price: 320 },
        lower: { count: 40, price: 220 },
      },
    });

    // Create Movies
    const movies = await Movie.insertMany([
      {
        title: 'Drishyam: The Conclusion',
        description: 'Gripping investigative crime thriller continuing the complex story of Georgekutty and his family protecting their secrets.',
        genres: ['Crime', 'Thriller', 'Drama'],
        language: 'Hindi',
        runtimeMinutes: 152,
        releaseDate: new Date(),
        certification: 'UA',
        cast: ['Ajay Devgn', 'Tabu', 'Akshaye Khanna', 'Shriya Saran'],
        director: 'Abhishek Pathak',
        posterUrl: '/posters/drishyam.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=sa9yW3QGf6E',
        status: 'now_showing',
        averageRating: 4.8,
        reviewCount: 95,
      },
      {
        title: 'Og (They Call Him OG)',
        description: 'A relentless crime boss returns to Mumbai to eliminate deadly crime syndicates that threaten the city.',
        genres: ['Action', 'Thriller'],
        language: 'Telugu',
        runtimeMinutes: 165,
        releaseDate: new Date('2026-09-25'),
        certification: 'UA',
        cast: ['Pawan Kalyan', 'Emraan Hashmi', 'Priyanka Arul Mohan'],
        director: 'Sujeeth',
        posterUrl: '/posters/og.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'now_showing',
        averageRating: 4.8,
        reviewCount: 42,
      },
      {
        title: 'RRR',
        description: 'A fearless revolutionary and an officer in the British force decide to join hands and fight together against the British Empire.',
        genres: ['Action', 'Drama', 'Historical'],
        language: 'Telugu',
        runtimeMinutes: 187,
        releaseDate: new Date('2022-03-25'),
        certification: 'UA',
        cast: ['NTR Jr.', 'Ram Charan', 'Alia Bhatt', 'Ajay Devgn'],
        director: 'S.S. Rajamouli',
        posterUrl: '/posters/rrr.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=GY4BgdUSpbE',
        status: 'now_showing',
        averageRating: 4.9,
        reviewCount: 156,
      },
      {
        title: 'Baahubali 2: The Conclusion',
        description: 'When Shiva discovers his royal heritage, he embarks on an epic quest to avenge his father and free his captive kingdom of Mahishmati.',
        genres: ['Action', 'Drama', 'Fantasy'],
        language: 'Telugu',
        runtimeMinutes: 167,
        releaseDate: new Date('2017-04-28'),
        certification: 'UA',
        cast: ['Prabhas', 'Rana Daggubati', 'Anushka Shetty', 'Tamannaah'],
        director: 'S.S. Rajamouli',
        posterUrl: '/posters/baahubali2.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=qD-6d8Wo3do',
        status: 'now_showing',
        averageRating: 4.9,
        reviewCount: 220,
      },
      {
        title: 'The Raja Saab',
        description: 'A high-voltage romantic horror comedy that takes an adventurous couple through mystical twists and uncanny royal mansions.',
        genres: ['Comedy', 'Horror', 'Romantic'],
        language: 'Telugu',
        runtimeMinutes: 150,
        releaseDate: new Date('2026-12-05'),
        certification: 'UA',
        cast: ['Prabhas', 'Malavika Mohanan', 'Nidhhi Agerwal'],
        director: 'Maruthi',
        posterUrl: '/posters/raja-saab.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'now_showing',
        averageRating: 4.5,
        reviewCount: 19,
      },
      {
        title: 'Toxic',
        description: 'A dark, stylish fairy tale for grown-ups set against the underworld of narcotics and high-stakes crime syndicates.',
        genres: ['Action', 'Thriller'],
        language: 'Kannada',
        runtimeMinutes: 160,
        releaseDate: new Date('2026-10-01'),
        certification: 'A',
        cast: ['Yash', 'Kiara Advani', 'Nayanthara'],
        director: 'Geetu Mohandas',
        posterUrl: '/posters/toxic.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'now_showing',
        averageRating: 4.7,
        reviewCount: 35,
      },
      {
        title: 'Avatar: Fire and Ash',
        description: 'Jake Sully and Neytiri travel across Pandora to encounter the aggressive fire-dwelling Ash People clan.',
        genres: ['Action', 'Adventure', 'Sci-Fi'],
        language: 'English',
        runtimeMinutes: 190,
        releaseDate: new Date('2026-09-30'),
        certification: 'UA',
        cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
        director: 'James Cameron',
        posterUrl: '/posters/avatar.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'upcoming',
        averageRating: 4.6,
        reviewCount: 28,
      },
    ]);

    // Seed comprehensive shows across all movies, theatres, and dates
    const shows = await seedShowsForAllMovies();

    // Create initial demo booking for customer
    const userGvvd = await User.findOne({ email: 'gvvdkumar@gmail.com' });
    const existingDemoBooking = await Booking.findOne({ bookingReference: 'IMV-20261017-DEMO1' });
    if (userGvvd && shows && shows.length > 0 && !existingDemoBooking) {
      const demoShow = shows[0];
      const demoSeats = [
        { seatNumber: 'M-D1', category: 'Middle', price: 180 },
        { seatNumber: 'M-D2', category: 'Middle', price: 180 },
      ];
      const subtotal = 360;
      const taxes = Math.round(subtotal * 0.18);
      const fees = 20;
      const totalAmount = subtotal + taxes + fees;

      const booking = await Booking.create({
        bookingReference: 'IMV-20261017-DEMO1',
        userId: userGvvd._id,
        showId: demoShow._id,
        seats: demoSeats,
        subtotal,
        taxes,
        fees,
        totalAmount,
        currency: 'INR',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        qrVerificationToken: 'simulated_demo_qr_token_verified',
      });

      await Payment.create({
        bookingId: booking._id,
        provider: 'sandbox',
        providerOrderId: 'sim_order_demo_12345',
        providerPaymentId: 'sim_pay_demo_67890',
        amount: totalAmount,
        currency: 'INR',
        status: 'SUCCEEDED',
        verifiedAt: new Date(),
      });
    }

    logger.info('[AutoSeed] Successfully initialized demo data on server start.');
  } catch (err) {
    logger.error(`[AutoSeed] Error ensuring demo data: ${err.message}`, err);
  }
};

const seedShowsForAllMovies = async () => {
  try {
    const movies = await Movie.find({});
    const theatres = await Theatre.find({});
    let screens = await Screen.find({});

    if (movies.length === 0 || theatres.length === 0) {
      return [];
    }

    // Ensure each theatre has at least 2 screens for rich multiplex scheduling
    for (const theatre of theatres) {
      const existing = screens.filter((s) => s.theatreId.equals(theatre._id));
      if (existing.length < 2) {
        const extraScreen = await Screen.create({
          theatreId: theatre._id,
          name: `${theatre.name.includes('PVR') ? 'PVR P[XL]' : 'Screen 2'} (Laser Audi)`,
          seatCategories: {
            balcony: { count: 30, price: existing[0]?.seatCategories?.balcony?.price || 250 },
            middle: { count: 50, price: existing[0]?.seatCategories?.middle?.price || 180 },
            lower: { count: 40, price: existing[0]?.seatCategories?.lower?.price || 120 },
          },
        });
        screens.push(extraScreen);
      }
    }

    const formatLocalDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Clean existing shows to avoid collision
    await Show.deleteMany({});

    const newShows = [];
    const scheduledKeys = new Set();

    // Standard non-overlapping daily slots for each screen
    const slotTimes = [
      { start: '10:30', end: '13:15' },
      { start: '14:00', end: '16:45' },
      { start: '18:00', end: '20:45' },
      { start: '21:30', end: '00:15' },
    ];

    // Dates across yesterday (-1), today (0), and the next 6 days (1 to 6)
    for (let offset = -1; offset <= 6; offset++) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const dateStr = formatLocalDate(d);
      const isoStr = d.toISOString().slice(0, 10);
      const datesToSeed = Array.from(new Set([dateStr, isoStr]));

      for (const curDate of datesToSeed) {
        let movieIndex = 0;

        // Iterate through all theatres and screens
        for (const theatre of theatres) {
          const theatreScreens = screens.filter((s) => s.theatreId.equals(theatre._id));
          const pricing = {
            Recliner: 690,
            'Premium Plus': 230,
            'Premium XL': 230,
            Premium: 210,
            Executive: 210,
            Normal: 210,
            Balcony: theatreScreens[0]?.seatCategories?.balcony?.price || 250,
            Middle: theatreScreens[0]?.seatCategories?.middle?.price || 180,
            Lower: theatreScreens[0]?.seatCategories?.lower?.price || 120,
          };

          for (const screen of theatreScreens) {
            for (const slot of slotTimes) {
              const movie = movies[movieIndex % movies.length];
              movieIndex++;

              const key = `${screen._id}_${curDate}_${slot.start}`;
              if (!scheduledKeys.has(key)) {
                scheduledKeys.add(key);
                newShows.push({
                  movieId: movie._id,
                  theatreId: theatre._id,
                  screenId: screen._id,
                  showDate: curDate,
                  startTime: slot.start,
                  endTime: slot.end,
                  seatPricing: pricing,
                  status: 'active',
                });
              }
            }
          }
        }
      }
    }

    const insertedShows = await Show.insertMany(newShows);
    logger.info(`[AutoSeed] Successfully seeded ${insertedShows.length} shows across all movies, screens, and dates!`);
    return insertedShows;
  } catch (err) {
    logger.error(`[AutoSeed] Error seeding comprehensive shows: ${err.message}`, err);
    return [];
  }
};

module.exports = { ensureDemoData, seedShowsForAllMovies };
