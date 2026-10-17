# IMovies REST API Documentation

Base URL: `/api/v1`

---

## 1. Health Check
- `GET /health` — Check system health and server uptime.

---

## 2. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register new customer account (`username`, `email`, `password`, `confirmPassword`). |
| POST | `/auth/login` | Public | Login with email and password, receives JWT. |
| POST | `/auth/logout` | Public | Logout and clear session. |
| GET | `/auth/me` | Authenticated | Fetch current authenticated user. |

---

## 3. Users (`/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users/me` | Authenticated | Get user profile and account statistics. |
| PATCH | `/users/me` | Authenticated | Update username or phone. |
| PATCH | `/users/me/password` | Authenticated | Securely change password with verification. |

---

## 4. Movies (`/movies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/movies` | Public | List movies with search, genre, language, status, and pagination. |
| GET | `/movies/:movieId` | Public | Get movie details, average rating, and active shows count. |
| POST | `/movies` | Admin | Create a new movie with poster, trailer, and metadata. |
| PATCH | `/movies/:movieId` | Admin | Update movie details. |
| DELETE | `/movies/:movieId` | Admin | Delete or archive movie. |
| GET | `/movies/:movieId/reviews` | Public | Get approved reviews for a movie. |
| POST | `/movies/:movieId/reviews` | Authenticated | Post or update a rating and review for a movie. |

---

## 5. Theatres & Screens (`/theatres`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/theatres` | Public | List theatres with city filter and search. |
| GET | `/theatres/:theatreId` | Public | Get single theatre with its screens. |
| POST | `/theatres` | Admin | Create theatre with initial screen seat categories and prices. |
| PATCH | `/theatres/:theatreId` | Admin | Update theatre information. |
| DELETE | `/theatres/:theatreId` | Admin | Deactivate or delete theatre. |
| GET | `/theatres/:theatreId/screens` | Public | List screens for a theatre. |
| POST | `/theatres/:theatreId/screens` | Admin | Add new screen to theatre. |

---

## 6. Shows (`/shows`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/shows` | Public | Filter shows by date, movie, theatre, or city. |
| GET | `/shows/:showId` | Public | Get single show details. |
| GET | `/shows/:showId/seats` | Public | Get real-time seat availability map. |
| POST | `/shows/:showId/seat-locks` | Authenticated | Concurrency-safe temporary seat lock (5 mins TTL). |
| POST | `/shows` | Admin | Schedule a conflict-free show on screen. |
| PATCH | `/shows/:showId` | Admin | Update show details. |
| DELETE | `/shows/:showId` | Admin | Cancel a show schedule. |

---

## 7. Seat Locks (`/seat-locks`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| DELETE | `/seat-locks/:lockId` | Authenticated | Manually release an active seat hold. |
| GET | `/seat-locks/:lockId` | Authenticated | Check expiration and status of seat lock. |

---

## 8. Bookings (`/bookings`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/bookings` | Authenticated | Initiate pending booking with server price calculation. |
| GET | `/bookings/me` | Authenticated | Fetch current user's booking history (all, upcoming, cancelled). |
| GET | `/bookings/:bookingId` | Authenticated | Get full booking details with QR verification token. |
| POST | `/bookings/:bookingId/cancel` | Authenticated | Cancel booking according to cutoff rules and initiate refund. |

---

## 9. Payments (`/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/payments/create-order` | Authenticated | Create payment order (Razorpay or Sandbox). |
| POST | `/payments/verify` | Authenticated | Verify HMAC signature and confirm booking idempotently. |
| POST | `/payments/webhook` | Public | Idempotent webhook listener for provider callbacks. |

---

## 10. Favorites & Reviews (`/favorites`, `/reviews`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/favorites` | Authenticated | Get user's saved favorite movies. |
| POST | `/favorites/:movieId` | Authenticated | Add movie to favorites. |
| DELETE | `/favorites/:movieId` | Authenticated | Remove movie from favorites. |
| DELETE | `/reviews/:reviewId` | Authenticated/Admin | Delete a user review. |

---

## 11. Tickets (`/tickets`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/tickets/:bookingReference/verify` | Public | Scan and verify cryptographic QR ticket status at cinema gate. |

---

## 12. Administration (`/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | High-level telemetry, shows list, recent bookings, KPIs. |
| GET | `/admin/bookings` | Admin | Searchable, paginated transaction log. |
| GET | `/admin/users` | Admin | Registered user accounts management. |
| PATCH | `/admin/users/:userId/status` | Admin | Toggle user active/deactivated state. |
| GET | `/admin/revenue` | Admin | Detailed gross, refund, and net revenue reports. |
