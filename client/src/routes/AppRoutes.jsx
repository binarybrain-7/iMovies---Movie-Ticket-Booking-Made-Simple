import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Public & Customer Pages
import Home from '../pages/Home';
import Movies from '../pages/Movies';
import MovieDetails from '../pages/MovieDetails';
import Login from '../pages/Login';
import Register from '../pages/Register';
import SelectShow from '../pages/SelectShow';
import SeatSelection from '../pages/SeatSelection';
import Payment from '../pages/Payment';
import BookingConfirmation from '../pages/BookingConfirmation';
import MyBookings from '../pages/MyBookings';
import Favorites from '../pages/Favorites';
import Profile from '../pages/Profile';
import TicketVerification from '../pages/TicketVerification';
import NotFound from '../pages/NotFound';

// Administration Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageShows from '../pages/admin/ManageShows';
import AddShow from '../pages/admin/AddShow';
import ManageTheatres from '../pages/admin/ManageTheatres';
import AddTheatre from '../pages/admin/AddTheatre';
import ManageMovies from '../pages/admin/ManageMovies';
import AddMovie from '../pages/admin/AddMovie';
import ManageBookings from '../pages/admin/ManageBookings';
import ManageUsers from '../pages/admin/ManageUsers';
import RevenueReports from '../pages/admin/RevenueReports';

// Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/movies" element={<Movies />} />
      <Route path="/movies/:movieId" element={<MovieDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/select-show" element={<SelectShow />} />
      <Route path="/seat-selection" element={<SeatSelection />} />
      <Route path="/verify-ticket/:bookingReference" element={<TicketVerification />} />

      {/* Protected Customer Routes */}
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking-confirmation/:bookingId"
        element={
          <ProtectedRoute>
            <BookingConfirmation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/shows"
        element={
          <AdminRoute>
            <ManageShows />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/add-show"
        element={
          <AdminRoute>
            <AddShow />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/theatres"
        element={
          <AdminRoute>
            <ManageTheatres />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/add-theatre"
        element={
          <AdminRoute>
            <AddTheatre />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/manage-movies"
        element={
          <AdminRoute>
            <ManageMovies />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/add-movie"
        element={
          <AdminRoute>
            <AddMovie />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <AdminRoute>
            <ManageBookings />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/revenue"
        element={
          <AdminRoute>
            <RevenueReports />
          </AdminRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
