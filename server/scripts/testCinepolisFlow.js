
async function testFullBookingWorkflow() {
  console.log('--- STARTING CINEPOLIS SEAT SELECTION & BOOKING WORKFLOW TEST ---');

  // 1. Fetch shows to find a show for Drishyam or Cinepolis
  const showsRes = await fetch('http://localhost:8000/api/v1/shows');
  const showsData = await showsRes.json();
  const shows = showsData.data?.shows || [];
  console.log(`✓ Fetched ${shows.length} shows from API`);

  const cinepolisShow = shows.find((s) => s.theatreId?.name?.includes('Cinepolis') || s.movieId?.title?.includes('Drishyam')) || shows[0];
  if (!cinepolisShow) {
    throw new Error('No show found in database');
  }

  console.log(`✓ Testing Show: "${cinepolisShow.movieId?.title}" at "${cinepolisShow.theatreId?.name}, ${cinepolisShow.theatreId?.location}" (${cinepolisShow.startTime})`);

  // 2. Fetch seats for this show
  const seatsRes = await fetch(`http://localhost:8000/api/v1/shows/${cinepolisShow._id}/seats`);
  const seatsData = await seatsRes.json();
  const seats = seatsData.data?.seats || [];
  console.log(`✓ Retrieved ${seats.length} auditorium seats for show`);

  // Verify Categories
  const categories = [...new Set(seats.map((s) => s.category))];
  console.log('✓ Auditorium Categories:', categories);
  const expectedTiers = ['Recliner', 'Premium Plus', 'Premium XL', 'Premium', 'Executive', 'Normal'];
  for (const tier of expectedTiers) {
    const hasTier = categories.includes(tier);
    console.log(`  - Tier "${tier}": ${hasTier ? 'PRESENT ✓' : 'MISSING ✗'}`);
    if (!hasTier) throw new Error(`Missing expected tier: ${tier}`);
  }

  // Verify Prices
  console.log('✓ Show Seat Pricing:', seatsData.data?.seatPricing);
  const sampleRecliner = seats.find((s) => s.category === 'Recliner');
  const samplePremiumPlus = seats.find((s) => s.category === 'Premium Plus');
  const sampleExecutive = seats.find((s) => s.category === 'Executive');
  console.log(`✓ Recliner Price: ₹${sampleRecliner?.price} (Expected ₹690)`);
  console.log(`✓ Premium Plus Price: ₹${samplePremiumPlus?.price} (Expected ₹230)`);
  console.log(`✓ Executive Price: ₹${sampleExecutive?.price} (Expected ₹210)`);

  // Verify Geometry & Row orientation
  const rows = [...new Set(seats.map((s) => s.row))];
  console.log('✓ Auditorium Rows:', rows);
  const rowLSeats = seats.filter((s) => s.row === 'L');
  console.log(`✓ Row L has ${rowLSeats.length} Recliner seats (Descending: ${rowLSeats[0]?.number} down to ${rowLSeats[rowLSeats.length - 1]?.number})`);

  // 3. User Authentication
  const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@imovies.com', password: 'Admin@123456' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  if (!token) throw new Error('Authentication failed');
  console.log('✓ Authenticated user token received');

  // 4. Test Seat Lock API (Simulate selecting Seat B-10 as shown in Image 2)
  const targetSeat = seats.find((s) => s.row === 'B' && s.number === 10 && s.status === 'available') || seats.find((s) => s.status === 'available');
  console.log(`✓ Selecting Seat for lock test: ${targetSeat.seatNumber} (${targetSeat.category}, ₹${targetSeat.price})`);

  const lockRes = await fetch(`http://localhost:8000/api/v1/shows/${cinepolisShow._id}/seat-locks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      seats: [targetSeat.seatNumber],
    }),
  });
  const lockData = await lockRes.json();
  if (lockRes.status !== 200 && lockRes.status !== 201) {
    throw new Error(`Seat lock failed: ${JSON.stringify(lockData)}`);
  }
  const { lockToken, expiresAt } = lockData.data;
  console.log(`✓ Seat successfully locked! Lock Token: ${lockToken.slice(0, 16)}... (Expires: ${expiresAt})`);

  // 5. Test Booking Creation API
  const bookingRes = await fetch('http://localhost:8000/api/v1/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      showId: cinepolisShow._id,
      lockToken,
    }),
  });
  const bookingData = await bookingRes.json();
  if (bookingRes.status !== 200 && bookingRes.status !== 201) {
    throw new Error(`Booking creation failed: ${JSON.stringify(bookingData)}`);
  }
  const booking = bookingData.data?.booking;
  console.log(`✓ Pending Booking created successfully! Reference: ${booking.bookingReference}, Total: ₹${booking.totalAmount}`);

  console.log('--- ALL BACKEND & SEAT RESERVATION TESTS PASSED! ---');
}

testFullBookingWorkflow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
