import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import DigitalTicket from '../components/booking/DigitalTicket';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiClock, FiFilm, FiCalendar, FiMapPin, FiXCircle, FiEye } from 'react-icons/fi';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeTicketBooking, setActiveTicketBooking] = useState(null);
  const [cancellingId, setCancellingId] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings(filter);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleCancel = async (bookingId, bookingRef) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingRef}?`)) return;

    try {
      setCancellingId(bookingId);
      await bookingService.cancelBooking(bookingId, 'User requested cancellation');
      toast.success('Booking cancelled successfully and refund initiated');
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Cancellation rejected by policy');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="my-bookings-page container py-4">
      {/* Title matching Screenshot 5: "Your Bookings" (Bookings in red) */}
      <h1 className="section-title mb-4">
        Your <span className="text-accent">Bookings</span>
      </h1>

      {/* Filter Tabs */}
      <div className="d-flex justify-content-center gap-2 mb-4">
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`btn btn-sm ${filter === 'upcoming' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
          onClick={() => setFilter('upcoming')}
        >
          Confirmed
        </button>
        <button
          className={`btn btn-sm ${filter === 'cancelled' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving your cinema bookings..." />
      ) : bookings.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <FiClock size={42} className="text-muted mb-3" />
          <h4 className="fw-bold mb-2">No bookings found</h4>
          <p className="text-muted small mb-4">You haven't reserved any movie tickets yet.</p>
          <Link to="/movies" className="btn btn-cinema">
            Explore Available Movies
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {bookings.map((b) => {
            const show = b.showId || {};
            const movie = show.movieId || {};
            const theatre = show.theatreId || {};
            const isConfirmed = b.status === 'CONFIRMED';
            const isCancelled = b.status === 'CANCELLED';

            // Group seats by category (e.g. Balcony Seats: B1, Middle Seats: M1, M2)
            const seatsByCategory = (b.seats || []).reduce((acc, s) => {
              const cat = s.category || 'Standard';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(s.seatNumber);
              return acc;
            }, {});

            return (
              <div key={b._id} className="col-12 col-md-6 col-lg-4">
                {/* Order card layout matching Screenshot 5 */}
                <div
                  className="cinema-card h-100 p-3 d-flex flex-column"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="d-flex gap-3 mb-3">
                    {/* Poster */}
                    <img
                      src={movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300'}
                      alt={movie.title || 'Movie'}
                      className="rounded shadow"
                      style={{ width: '100px', height: '140px', objectFit: 'cover', flexShrink: 0 }}
                    />

                    {/* Meta info matching Screenshot 5 format:
                        Movie: Og
                        Theatre: Srinivasa
                        Showdate: Sep 26, 2025
                        showtime: 21:00
                        Middle Seats: 261, 262
                        Total Price: 260₹
                    */}
                    <div className="small flex-grow-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="mb-1">
                        <strong>Movie: </strong>
                        <span style={{ color: 'var(--color-text)' }}>{movie.title}</span>
                      </div>
                      <div className="mb-1">
                        <strong>Theatre: </strong>
                        <span>{theatre.name}</span>
                      </div>
                      <div className="mb-1">
                        <strong>Showdate: </strong>
                        <span>{show.showDate}</span>
                      </div>
                      <div className="mb-1">
                        <strong>showtime: </strong>
                        <span style={{ color: 'var(--color-primary)' }}>{show.startTime}</span>
                      </div>

                      {/* Seats categorized */}
                      {Object.entries(seatsByCategory).map(([cat, seatNums]) => (
                        <div key={cat} className="mb-1">
                          <strong>{cat} Seats: </strong>
                          <span>{seatNums.join(', ')}</span>
                        </div>
                      ))}

                      <div className="mt-2 pt-1 border-top" style={{ borderColor: 'var(--color-border)' }}>
                        <strong>Total Price: </strong>
                        <span className="fw-bold" style={{ color: 'var(--color-text)', fontSize: '1rem' }}>
                          {b.totalAmount}₹
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Action buttons */}
                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      {isConfirmed && <span className="badge bg-success small">CONFIRMED</span>}
                      {isCancelled && <span className="badge bg-danger small">CANCELLED</span>}
                      {b.status === 'PENDING' && <span className="badge bg-warning text-dark small">PENDING</span>}
                    </div>

                    <div className="d-flex gap-2">
                      {isConfirmed && (
                        <>
                          <button
                            onClick={() => setActiveTicketBooking(b)}
                            className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1"
                            title="View E-Ticket & QR"
                          >
                            <FiEye size={13} /> View Ticket
                          </button>

                          <button
                            onClick={() => handleCancel(b._id, b.bookingReference)}
                            disabled={cancellingId === b._id}
                            className="btn btn-cinema-danger btn-sm"
                            title="Cancel Booking"
                          >
                            {cancellingId === b._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Modal */}
      {activeTicketBooking && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setActiveTicketBooking(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content cinema-card p-2">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Digital Cinema Admission Ticket</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActiveTicketBooking(null)}
                />
              </div>
              <div className="modal-body">
                <DigitalTicket booking={activeTicketBooking} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
