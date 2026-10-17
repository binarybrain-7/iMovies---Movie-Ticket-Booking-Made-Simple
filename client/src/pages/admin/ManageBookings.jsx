import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import DigitalTicket from '../../components/booking/DigitalTicket';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSearch, FiEye, FiClock } from 'react-icons/fi';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [activeTicketBooking, setActiveTicketBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status !== 'all') params.status = status;

      const res = await adminService.getAllBookings(params);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  return (
    <div className="admin-manage-bookings container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <h1 className="section-title text-start mb-4">
        All <span className="text-accent">Bookings</span>
      </h1>

      {/* Filter and Search Bar */}
      <div className="cinema-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text cinema-input">
                <FiSearch />
              </span>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="Search by Booking Reference (e.g. IMV-2026...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-cinema px-3">
                Search
              </button>
            </div>
          </div>

          <div className="col-12 col-md-6 d-flex gap-2 justify-content-md-end">
            <button
              type="button"
              className={`btn btn-sm ${status === 'all' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'CONFIRMED' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('CONFIRMED')}
            >
              Confirmed
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'CANCELLED' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('CANCELLED')}
            >
              Cancelled
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'PENDING' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('PENDING')}
            >
              Pending
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading booking records..." />
      ) : bookings.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <FiClock size={40} className="text-muted mb-2" />
          <p className="text-muted">No booking records match the filter criteria.</p>
        </div>
      ) : (
        <div className="cinema-card p-0 overflow-hidden shadow">
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0" style={{ backgroundColor: 'var(--color-surface)' }}>
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Movie & Venue</th>
                  <th className="p-3">Showtime</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3 font-monospace small text-primary fw-bold" style={{ color: 'var(--color-primary)' }}>
                      {b.bookingReference}
                    </td>
                    <td className="p-3">
                      <div className="fw-bold small">{b.userId?.username || 'Customer'}</div>
                      <div className="text-muted small">{b.userId?.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="small fw-bold">{b.showId?.movieId?.title}</div>
                      <div className="small text-muted">{b.showId?.theatreId?.name}</div>
                    </td>
                    <td className="p-3 small text-muted">
                      {b.showId?.showDate} {b.showId?.startTime}
                    </td>
                    <td className="p-3 small">{b.seats?.map((s) => s.seatNumber).join(', ')}</td>
                    <td className="p-3 fw-bold">₹{b.totalAmount}</td>
                    <td className="p-3">
                      <span
                        className={`badge small ${
                          b.status === 'CONFIRMED'
                            ? 'bg-success'
                            : b.status === 'CANCELLED'
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setActiveTicketBooking(b)}
                        className="btn btn-cinema-secondary btn-sm p-1 px-2"
                        title="View Ticket"
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <h5 className="modal-title fw-bold">Booking Details & E-Ticket</h5>
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

export default ManageBookings;
