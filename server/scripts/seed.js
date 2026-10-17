require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Screen = require('../models/Screen');
const Show = require('../models/Show');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const logger = require('../utils/logger');

const seedData = async () => {
  logger.info('[Seed] Connecting to database...');
  await connectDB();

  logger.info('[Seed] Clearing existing demo data...');
  await Promise.all([
    User.deleteMany({}),
    Movie.deleteMany({}),
    Theatre.deleteMany({}),
    Screen.deleteMany({}),
    Show.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // 1. Create Default Users (Admin + Standard User)
  logger.info('[Seed] Creating demo users...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@123456', salt);
  const userPasswordHash = await bcrypt.hash('User@123456', salt);

  const admin = await User.create({
    username: 'admin',
    email: 'admin@imovies.com',
    passwordHash: adminPasswordHash,
    phone: '+91 9876543210',
    role: 'ADMIN',
  });

  const demoUser = await User.create({
    username: 'Aditya Vishwakarma',
    email: 'aditya@example.com',
    passwordHash: userPasswordHash,
    phone: '+91 9123456789',
    role: 'USER',
  });

  const gvvdUser = await User.create({
    username: 'G V V D Kumar',
    email: 'gvvdkumar@gmail.com',
    passwordHash: userPasswordHash,
    phone: '+91 9848022338',
    role: 'USER',
  });

  // 2. Create Sample Theatres
  logger.info('[Seed] Creating theatres and screens...');
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

  // 3. Create Sample Movies (featuring the exact movies from reference screenshots)
  logger.info('[Seed] Creating movie catalogue...');
  const movies = await Movie.insertMany([
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
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
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
      posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
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
      posterUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&auto=format&fit=crop&q=80',
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
      posterUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=600&auto=format&fit=crop&q=80',
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
      posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
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
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      status: 'upcoming',
      averageRating: 4.6,
      reviewCount: 28,
    },
  ]);

  const ogMovie = movies[0];
  const rrrMovie = movies[1];

  // 4. Create Shows matching reference screenshot exactly
  logger.info('[Seed] Creating show schedules...');
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const shows = await Show.insertMany([
    {
      movieId: ogMovie._id,
      theatreId: srinivasaTheatre._id,
      screenId: srinivasaScreen._id,
      showDate: todayStr,
      startTime: '14:00',
      endTime: '16:45',
      seatPricing: { Balcony: 250, Middle: 180, Lower: 120 },
      status: 'active',
    },
    {
      movieId: ogMovie._id,
      theatreId: srinivasaTheatre._id,
      screenId: srinivasaScreen._id,
      showDate: todayStr,
      startTime: '18:30',
      endTime: '21:15',
      seatPricing: { Balcony: 250, Middle: 180, Lower: 120 },
      status: 'active',
    },
    {
      movieId: ogMovie._id,
      theatreId: srinivasaTheatre._id,
      screenId: srinivasaScreen._id,
      showDate: tomorrowStr,
      startTime: '21:00',
      endTime: '23:45',
      seatPricing: { Balcony: 250, Middle: 180, Lower: 120 },
      status: 'active',
    },
    {
      movieId: rrrMovie._id,
      theatreId: gokulTheatre._id,
      screenId: gokulScreen._id,
      showDate: todayStr,
      startTime: '14:00',
      endTime: '17:10',
      seatPricing: { Balcony: 280, Middle: 200, Lower: 130 },
      status: 'active',
    },
    {
      movieId: rrrMovie._id,
      theatreId: gokulTheatre._id,
      screenId: gokulScreen._id,
      showDate: tomorrowStr,
      startTime: '18:00',
      endTime: '21:10',
      seatPricing: { Balcony: 280, Middle: 200, Lower: 130 },
      status: 'active',
    },
    {
      movieId: ogMovie._id,
      theatreId: pvrForum._id,
      screenId: pvrScreen._id,
      showDate: todayStr,
      startTime: '19:30',
      endTime: '22:15',
      seatPricing: { Balcony: 450, Middle: 320, Lower: 220 },
      status: 'active',
    },
  ]);

  // 5. Create Sample Confirmed Booking (as seen in Screenshot 5 "Your Bookings")
  logger.info('[Seed] Creating demo confirmed booking...');
  const demoShow = shows[0];
  const demoSeats = [
    { seatNumber: 'M-D1', category: 'Middle', price: 180 },
    { seatNumber: 'M-D2', category: 'Middle', price: 180 },
  ];
  const subtotal = 360;
  const taxes = Math.round(subtotal * 0.18); // 65
  const fees = 20;
  const totalAmount = subtotal + taxes + fees; // 445

  const booking = await Booking.create({
    bookingReference: 'IMV-20261017-DEMO1',
    userId: gvvdUser._id,
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

  logger.info('====================================================');
  logger.info('✅ SEEDING COMPLETE!');
  logger.info('👥 Admin User: admin@imovies.com / Admin@123456');
  logger.info('👤 Customer User: aditya@example.com / User@123456');
  logger.info(`🎬 Movies Seeded: ${movies.length}`);
  logger.info(`🎭 Theatres Seeded: 3`);
  logger.info(`🎟️ Shows Seeded: ${shows.length}`);
  logger.info('====================================================');

  await disconnectDB();
  process.exit(0);
};

seedData().catch((err) => {
  logger.error(`[Seed] Error: ${err.message}`, err);
  process.exit(1);
});
