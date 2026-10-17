# IMovies — Movie Ticket Booking Made Simple

> **Project Category:** Entertainment / Full-Stack Web Application  
> **Project Owner:** Aditya Vishwakarma  
> **Stack:** MERN (MongoDB, Express.js, React.js, Node.js) with Socket.IO & Razorpay

---

## 1. Project Overview

**IMovies** is a full-featured, cinema ticket booking web platform delivering a modern experience. Inspired by the supplied reference designs, the application enables cinema-goers to discover movies, browse theatres, view schedules, select seats in real-time, complete payments, view digital tickets with QR verification, and manage bookings and favorites.

The platform includes an **Administration Interface** for managing movies, theatres, screens, show schedules, user accounts, and financial revenue reports.

---

## 2. Key Features

- **Cinematic Visual Design:** Curated dark theme (`#08090D`) with red accents (`#E50914`), custom typography, responsive grid layouts, and working dark/light theme switching.
- **Authentication & Security:** JWT-based authentication, bcrypt password hashing, input sanitization, rate limiting, and role-based route guards (`USER` vs `ADMIN`).
- **Real-Time Seat Management:** Interactive auditorium seat map powered by Socket.IO with real-time seat lock and release broadcasting across simultaneous clients.
- **Concurrency-Safe Seat Locking:** Concurrency-safe, 5-minute temporary reservation engine preventing double bookings.
- **Automated Price Recalculation:** Subtotal, 18% GST, and convenience fees are computed strictly on the backend to prevent client-side price tampering.
- **Flexible Payment Integration:** Dedicated payment service supporting live/test **Razorpay** checkout and development **Sandbox Simulation** mode.
- **Digital Tickets with QR Codes:** Instant digital e-tickets featuring verifiable QR codes and print-to-PDF support.
- **Booking Management:** Complete booking lifecycle (`PENDING` -> `CONFIRMED` -> `CANCELLED`) with policy-based cancellation rules.
- **Movie Reviews & Ratings:** User reviews with automatic calculation of aggregate movie ratings.
- **Favorites & Watchlist:** Private user movie watchlists.
- **Admin Dashboard:** Real-time telemetry, show schedules, transactions log, user moderation, and revenue breakdown analytics.

---

## 3. Technology Stack

### Frontend
- **Framework:** React.js (Vite)
- **Routing:** React Router DOM (v7)
- **Icons & UI:** React Icons, Bootstrap 5, React Toastify
- **QR Code:** `qrcode.react`
- **Real-Time:** `socket.io-client`
- **HTTP Client:** Axios (Centralized API client)
- **Effects:** Canvas Confetti

### Backend
- **Runtime:** Node.js (v24+)
- **Framework:** Express.js (MVC Pattern)
- **Database ODM:** Mongoose (v8+)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Security:** Helmet, CORS, Express Rate Limit, Express Validator
- **Real-Time:** Socket.IO
- **Logging:** Structured Morgan & Custom Logger
- **Notifications:** Nodemailer (SMTP with safe development fallback)
- **Testing:** Node.js built-in test runner (`node:test`) & Supertest

### Database
- **MongoDB:** Compatible with MongoDB local instance (`mongodb://127.0.0.1:27017/imovies`), MongoDB Atlas, or automated development `mongodb-memory-server` out-of-the-box.

---

## 4. Directory Structure

```
IMovies/
|-- client/
|   |-- public/
|   |   |-- favicon.svg
|   |-- src/
|   |   |-- components/
|   |   |   |-- common/          # LoadingSpinner, Confirmation modals
|   |   |   |-- layout/          # Navbar, Footer
|   |   |   |-- movies/          # MovieCard
|   |   |   |-- seats/           # SeatMap with live sockets
|   |   |   |-- booking/         # DigitalTicket with QR code
|   |   |-- pages/
|   |   |   |-- Home.jsx         # Landing page (Screenshot 1)
|   |   |   |-- Movies.jsx       # Catalogue (Screenshot 4 & 5)
|   |   |   |-- MovieDetails.jsx # Movie details & reviews
|   |   |   |-- Login.jsx        # Login page (Screenshot 2)
|   |   |   |-- Register.jsx     # Registration page (Screenshot 1)
|   |   |   |-- SelectShow.jsx   # Date & showtimes picker
|   |   |   |-- SeatSelection.jsx# Auditorium seat map & lock
|   |   |   |-- Payment.jsx      # Payment order & checkout simulation
|   |   |   |-- BookingConfirmation.jsx # Confirmed ticket view
|   |   |   |-- MyBookings.jsx   # User orders (Screenshot 5)
|   |   |   |-- Favorites.jsx    # User watchlist
|   |   |   |-- Profile.jsx      # Account & stats
|   |   |   |-- TicketVerification.jsx # QR admission validation
|   |   |   |-- NotFound.jsx     # 404 page
|   |   |-- pages/admin/
|   |   |   |-- AdminDashboard.jsx # Admin dashboard (Screenshot 2)
|   |   |   |-- ManageMovies.jsx   # Available movies list (Screenshot 4)
|   |   |   |-- AddMovie.jsx       # Add movie (Screenshot 4)
|   |   |   |-- ManageTheatres.jsx # Theatres management
|   |   |   |-- AddTheatre.jsx     # Add theatre (Screenshot 3)
|   |   |   |-- ManageShows.jsx    # Shows management
|   |   |   |-- AddShow.jsx        # Add show (Screenshot 3)
|   |   |   |-- ManageBookings.jsx # All bookings transaction table
|   |   |   |-- ManageUsers.jsx    # User accounts
|   |   |   |-- RevenueReports.jsx # Revenue analytics
|   |   |-- context/               # AuthContext, BookingContext, ThemeContext
|   |   |-- services/              # Centralized Axios API services
|   |   |-- routes/                # ProtectedRoute, AdminRoute, AppRoutes
|   |   |-- styles/                # global.css, theme.css
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |-- package.json
|   |-- vite.config.js
|
|-- server/
|   |-- config/          # database.js, payment.js
|   |-- models/          # User, Movie, Theatre, Screen, Show, SeatLock, Booking, Payment, Review, Favorite, Notification
|   |-- controllers/     # auth, user, movie, theatre, show, booking, payment, admin...
|   |-- routes/          # RESTful routes under /api/v1
|   |-- services/        # bookingService, seatLockService, paymentService, socketService, emailService
|   |-- middleware/      # authenticate, authorizeAdmin, errorHandler, rateLimiter, validate
|   |-- scripts/         # seed.js, createAdmin.js, autoSeed.js
|   |-- tests/           # api.test.js
|   |-- package.json
|   |-- server.js
|
|-- docs/
|   |-- architecture.md
|   |-- er-diagram.md
|   |-- api-documentation.md
|   |-- user-flow.md
|-- README.md
```

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js:** v18.0.0 or later (v24 recommended)
- **npm:** v9.0.0 or later

### Step 1: Clone or Open the Workspace
```bash
cd "IMovies - Movie ticket booking made simple"
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

## 6. Environment Configuration

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=8000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/imovies
JWT_SECRET=super_secret_imovies_jwt_token_key_change_in_production_987654321
CLIENT_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000/api/v1

# Payment Configuration
# Set to 'sandbox' for development simulation or 'razorpay' for live credentials
PAYMENT_PROVIDER=sandbox
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Optional SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="IMovies" <tickets@imovies.app>
```

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
VITE_PAYMENT_PROVIDER=sandbox
VITE_RAZORPAY_KEY_ID=
```

---

## 7. Database Initialization & Seeding

The application automatically initializes sample demo data on first start if the database is empty! Alternatively, you can seed manually:

```bash
cd server
npm run seed
```

### Default Demo Accounts
| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@imovies.com` | `Admin@123456` |
| **Customer** | `aditya@example.com` | `User@123456` |
| **Demo Customer** | `gvvdkumar@gmail.com` | `User@123456` |

---

## 8. Running the Application

### Start Backend Server
```bash
cd server
npm run dev
# Server runs on: http://localhost:8000
# Health check: http://localhost:8000/api/v1/health
```

### Start Frontend Application
In a separate terminal:
```bash
cd client
npm run dev
# Client runs on: http://localhost:5173
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## 9. Automated Testing

The backend includes an automated integration test suite validating:
- Health check
- User registration and duplicate rejection
- Invalid login rejection and successful login
- Role-based authorization (`USER` vs `ADMIN`)
- Movie catalogue search and filtering
- Show schedules and real-time seat availability
- Concurrency-safe seat locks and conflict rejection
- Pending booking calculation (subtotal + GST + fee)
- Payment order creation and simulation verification
- Digital ticket cryptographic verification

To execute all tests:
```bash
cd server
npm test
```

---

## 10. Security Notes

1. **No Plaintext Passwords:** Passwords are salted and hashed using `bcryptjs` with 10 rounds.
2. **No Secret Leaks:** Frontend variables use only `VITE_` public identifiers. Private API keys and JWT secrets are restricted to the server environment.
3. **Server-Side Validation:** All seat availability, prices, GST, convenience fees, and payment signatures are computed on the server.
4. **Idempotent Confirmation:** Duplicate payment callbacks or browser retries will not duplicate bookings.
5. **Rate Limiting:** Protects `/api/v1/auth` endpoints from brute-force login attacks.

---

## 11. Known Limitations & Production Enhancements

- **Email Delivery:** SMTP email delivery requires valid credentials. If SMTP is omitted, confirmation emails are safely logged without throwing errors.
- **Payment Gateway:** If Razorpay credentials are not provided, the application runs in sandbox simulation mode. Real payments require setting `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- **MongoDB Transactions:** Concurrency safety uses atomic MongoDB operations. Multi-document transactions require a replica set deployment (such as MongoDB Atlas).

---

## 12. License & Author

- **Developed by:** Aditya Vishwakarma
- **Project:** IMovies — Movie Ticket Booking Made Simple
