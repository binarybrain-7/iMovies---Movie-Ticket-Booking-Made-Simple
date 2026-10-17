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

  test('GET /api/v1/shows/:showId/seats - Fetch real-time seat availability map', async () => {
    const res = await request(app).get(`/api/v1/shows/${sampleShowId}/seats`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.seats.length > 0);
    assert.ok(res.body.data.seats[0].seatNumber);
    assert.ok(res.body.data.seats[0].status);
  });

  test('POST /api/v1/shows/:showId/seat-locks - Acquire temporary seat reservation', async () => {
    const res = await request(app)
      .post(`/api/v1/shows/${sampleShowId}/seat-locks`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        seats: ['B-A1', 'B-A2'],
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
        seats: ['B-A1'], // Already locked by customerToken
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
});
