const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app, server } = require('../server');
const { connectDB, disconnectDB } = require('../config/database');
const { ensureDemoData } = require('../scripts/autoSeed');

describe('IMovies Full-Stack API Test Suite', () => {
  let customerToken = '';
  let adminToken = '';
  let sampleShowId = '';
  let sampleMovieId = '';
  let lockToken = '';
  let createdBookingId = '';
  let bookingReference = '';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await ensureDemoData();
  });

  after(async () => {
    await disconnectDB();
    if (server && server.close) {
      server.close();
    }
    setTimeout(() => process.exit(0), 100);
  });

  test('GET /api/v1/health - System health check returns 200', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'IMovies API is healthy and operational');
  });

  test('POST /api/v1/auth/register - Register new customer account', async () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'Test User',
        email: uniqueEmail,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        phone: '+91 9999988888',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, 'USER');
    assert.strictEqual(res.body.data.user.passwordHash, undefined); // Never return password hash
  });

  test('POST /api/v1/auth/register - Reject duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'Duplicate User',
        email: 'aditya@example.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'CONFLICT');
  });

  test('POST /api/v1/auth/login - Reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aditya@example.com',
        password: 'WrongPassword123',
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'UNAUTHORIZED');
  });

  test('POST /api/v1/auth/login - Successful customer login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aditya@example.com',
        password: 'User@123456',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    customerToken = res.body.data.token;
  });

  test('POST /api/v1/auth/login - Successful admin login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@imovies.com',
        password: 'Admin@123456',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.role, 'ADMIN');
    adminToken = res.body.data.token;
  });

  test('GET /api/v1/admin/dashboard - Customer access is forbidden (403)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.code, 'FORBIDDEN');
  });

  test('GET /api/v1/admin/dashboard - Admin access succeeds (200)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.stats.totalMovies > 0);
  });

  test('GET /api/v1/movies - Fetch movies catalogue with search', async () => {
    const res = await request(app).get('/api/v1/movies?search=OG');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.movies.length > 0);
    sampleMovieId = res.body.data.movies[0]._id;
  });

  test('GET /api/v1/shows - Fetch shows for movie', async () => {
    const res = await request(app).get(`/api/v1/shows?movieId=${sampleMovieId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.shows.length > 0);
    sampleShowId = res.body.data.shows[0]._id;
  });

  let testSeat1 = '';
  let testSeat2 = '';

  test('GET /api/v1/shows/:showId/seats - Fetch real-time seat availability map', async () => {
    const res = await request(app).get(`/api/v1/shows/${sampleShowId}/seats`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.seats.length > 0);
    assert.ok(res.body.data.seats[0].seatNumber);
    assert.ok(res.body.data.seats[0].status);
    const availableSeats = res.body.data.seats.filter((s) => s.status === 'available');
    assert.ok(availableSeats.length >= 2, 'Need at least 2 available seats for lock test');
    testSeat1 = availableSeats[0].seatNumber;
    testSeat2 = availableSeats[1].seatNumber;
  });

  test('POST /api/v1/shows/:showId/seat-locks - Acquire temporary seat reservation', async () => {
    const res = await request(app)
      .post(`/api/v1/shows/${sampleShowId}/seat-locks`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        seats: [testSeat1, testSeat2],
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.lockToken);
    assert.strictEqual(res.body.data.seats.length, 2);
    lockToken = res.body.data.lockToken;
  });

  test('POST /api/v1/shows/:showId/seat-locks - Reject conflicting seat lock from another user', async () => {
    const anotherUserRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'Second User',
        email: `second_${Date.now()}@example.com`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
    const secondToken = anotherUserRes.body.data.token;

    const conflictRes = await request(app)
      .post(`/api/v1/shows/${sampleShowId}/seat-locks`)
      .set('Authorization', `Bearer ${secondToken}`)
      .send({
        seats: [testSeat1], // Already locked by customerToken
      });

    assert.strictEqual(conflictRes.status, 409);
    assert.strictEqual(conflictRes.body.code, 'CONFLICT');
  });

  test('POST /api/v1/bookings - Initiate pending booking with server price calculation', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        showId: sampleShowId,
        lockToken,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.booking.status, 'PENDING');
    assert.strictEqual(res.body.data.booking.seats.length, 2);
    assert.ok(res.body.data.booking.totalAmount > 0);
    createdBookingId = res.body.data.booking._id;
    bookingReference = res.body.data.booking.bookingReference;
  });

  test('POST /api/v1/payments/create-order - Create sandbox payment order', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: createdBookingId,
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.orderId);
  });

  test('POST /api/v1/payments/verify - Verify payment and confirm booking idempotently', async () => {
    const orderRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: createdBookingId,
      });
    const orderId = orderRes.body.data.orderId;

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        bookingId: createdBookingId,
        orderId,
        simulationResult: 'success',
      });

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.success, true);
    assert.strictEqual(verifyRes.body.data.booking.status, 'CONFIRMED');
    assert.strictEqual(verifyRes.body.data.booking.paymentStatus, 'PAID');
    assert.ok(verifyRes.body.data.booking.qrVerificationToken);
  });

  test('GET /api/v1/tickets/:bookingReference/verify - Public digital ticket verification', async () => {
    const res = await request(app).get(`/api/v1/tickets/${bookingReference}/verify`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.isValid, true);
    assert.strictEqual(res.body.data.bookingReference, bookingReference);
  });

  test('GET /api/v1/bookings/me - User can see their confirmed booking in My Bookings', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/me')
      .set('Authorization', `Bearer ${customerToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.bookings.length > 0);
    const found = res.body.data.bookings.find((b) => b._id.toString() === createdBookingId.toString());
    assert.ok(found);
  });

  // ================= ADMIN CRUD & SECURITY SUITE =================

  let testMovieId = '';
  let testTheatreId = '';
  let testScreenId = '';
  let testShowId = '';

  test('POST /api/v1/movies - Customer cannot create movie (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/movies')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        title: 'Hacker Film',
        description: 'Unauthorized creation',
        posterUrl: '/posters/test.jpg',
      });
    assert.strictEqual(res.status, 403);
  });

  test('POST /api/v1/movies - Admin creates a new movie (201 Created)', async () => {
    const res = await request(app)
      .post('/api/v1/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Kantara: A Legend Chapter 1',
        description: 'A divine folklore action thriller set in the coastal forests of Karnataka.',
        genres: ['Action', 'Thriller', 'Drama'],
        language: 'Kannada',
        runtimeMinutes: 148,
        releaseDate: '2026-10-02',
        certification: 'UA',
        director: 'Rishab Shetty',
        cast: ['Rishab Shetty', 'Sapthami Gowda'],
        posterUrl: '/posters/kantara.jpg',
        backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c',
        status: 'now_showing',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.movie.title, 'Kantara: A Legend Chapter 1');
    testMovieId = res.body.data.movie._id;
  });

  test('PUT /api/v1/movies/:id - Admin updates existing movie details', async () => {
    const res = await request(app)
      .put(`/api/v1/movies/${testMovieId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Kantara: Chapter 1 (Updated)',
        runtimeMinutes: 155,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.movie.title, 'Kantara: Chapter 1 (Updated)');
    assert.strictEqual(res.body.data.movie.runtimeMinutes, 155);
  });

  test('POST /api/v1/theatres - Admin creates a new theatre with screen', async () => {
    const res = await request(app)
      .post('/api/v1/theatres')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'PVR Inox Megaplex',
        location: 'Madhapur, Hyderabad',
        address: 'Hitech City Road, Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500081',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.theatre._id);
    assert.ok(res.body.data.screen._id);
    testTheatreId = res.body.data.theatre._id;
    testScreenId = res.body.data.screen._id;
  });

  test('PUT /api/v1/theatres/:id - Admin updates theatre details', async () => {
    const res = await request(app)
      .put(`/api/v1/theatres/${testTheatreId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'PVR Inox Superplex Luxe',
        postalCode: '500082',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.theatre.name, 'PVR Inox Superplex Luxe');
  });

  test('GET /api/v1/screens - Fetch all screens with populated theatre', async () => {
    const res = await request(app)
      .get(`/api/v1/screens?theatreId=${testTheatreId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.screens.length > 0);
    assert.strictEqual(res.body.data.screens[0].theatreId.name, 'PVR Inox Superplex Luxe');
  });

  test('PUT /api/v1/screens/:id - Admin updates screen details', async () => {
    const res = await request(app)
      .put(`/api/v1/screens/${testScreenId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Audi 1 - IMAX with Laser',
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.screen.name, 'Audi 1 - IMAX with Laser');
  });

  test('POST /api/v1/shows - Admin schedules a show', async () => {
    const res = await request(app)
      .post('/api/v1/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: testMovieId,
        theatreId: testTheatreId,
        screenId: testScreenId,
        showDate: '2026-10-25',
        startTime: '10:00',
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.show._id);
    assert.strictEqual(res.body.data.show.showDate, '2026-10-25');
    assert.strictEqual(res.body.data.show.startTime, '10:00');
    testShowId = res.body.data.show._id;
  });

  test('POST /api/v1/shows - Reject conflicting overlapping show on same screen (409 Conflict)', async () => {
    // Show is 155 min runtime + 15 min buffer = 170 mins (10:00 to 12:50).
    // An overlapping show at 11:30 must be rejected
    const res = await request(app)
      .post('/api/v1/shows')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: testMovieId,
        theatreId: testTheatreId,
        screenId: testScreenId,
        showDate: '2026-10-25',
        startTime: '11:30',
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'CONFLICT');
  });

  test('PUT /api/v1/shows/:id - Admin edits existing show', async () => {
    const res = await request(app)
      .put(`/api/v1/shows/${testShowId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        showDate: '2026-10-25',
        startTime: '16:00',
        seatPricing: {
          Balcony: 350,
          Middle: 220,
          Lower: 150,
        },
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.show.startTime, '16:00');
    assert.strictEqual(res.body.data.show.seatPricing.Balcony, 350);
  });

  test('DELETE /api/v1/shows/:id - Safe deletion of show without bookings', async () => {
    const res = await request(app)
      .delete(`/api/v1/shows/${testShowId}?hardDelete=true`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  test('DELETE /api/v1/movies/:id - Delete movie without bookings', async () => {
    const res = await request(app)
      .delete(`/api/v1/movies/${testMovieId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });
});
