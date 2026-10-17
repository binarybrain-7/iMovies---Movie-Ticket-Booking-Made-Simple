import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import DigitalTicket from '../components/booking/DigitalTicket';
import LoadingSpinner from '../components/common/LoadingSpinner';
import confetti from 'canvas-confetti';
import { FiCheckCircle, FiFilm, FiClock } from 'react-icons/fi';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingService.getBookingById(bookingId);
        setBooking(res.data.booking);

        // Fire festive celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#E50914', '#FFFFFF', '#F59E0B'],
          });
        } catch {
          // Ignore if confetti not supported
        }
      } catch (err) {
        console.error('Error loading booking confirmation:', err);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  if (loading) {
    return <LoadingSpinner message="Generating your verified digital cinema ticket..." />;
  }

  if (!booking) {
    return (
      <div className="container py-5 text-center">
        <h2>Booking record not found</h2>
        <Link to="/movies" className="btn btn-cinema mt-3">
          Explore Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="booking-confirmation-page container py-4">
      {/* Success Banner */}
      <div className="text-center mb-4">
        <div
          className="rounded-circle d-inline-flex p-3 mb-2"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
        >
          <FiCheckCircle size={48} />
        </div>
        <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--color-text)' }}>
          Booking Confirmed!
        </h1>
        <p className="text-muted small">
          Your payment was verified and your seats have been permanently allocated.
        </p>
      </div>

      {/* Verified Digital Ticket */}
      <DigitalTicket booking={booking} />

      {/* Action Navigation */}
      <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap no-print">
        <Link to="/my-bookings" className="btn btn-cinema d-flex align-items-center gap-2">
          <FiClock /> Go to My Bookings
        </Link>
        <Link to="/movies" className="btn btn-cinema-secondary d-flex align-items-center gap-2">
          <FiFilm /> Browse More Movies
        </Link>
      </div>
    </div>
  );
};

export default BookingConfirmation;
