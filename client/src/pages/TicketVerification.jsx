import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiCheckCircle, FiXCircle, FiFilm, FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

const TicketVerification = () => {
  const { bookingReference } = useParams();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        setLoading(true);
        const res = await bookingService.verifyTicket(bookingReference);
        setTicketData(res.data);
      } catch (err) {
        setError(err.message || 'Invalid or unverified ticket reference.');
      } finally {
        setLoading(false);
      }
    };

    if (bookingReference) {
      verifyTicket();
    }
  }, [bookingReference]);

  if (loading) {
    return <LoadingSpinner message="Verifying ticket cryptographic record with cinema server..." />;
  }

  return (
    <div className="ticket-verification-page container py-5" style={{ maxWidth: '600px' }}>
      <div className="cinema-card p-4 text-center shadow-lg">
        <div className="brand-logo mb-3">
          <span className="brand-i">i</span>
          <span className="brand-movies">Movies</span>
          <span className="badge bg-secondary ms-2 small">TICKET VERIFIER</span>
        </div>

        {error ? (
          <div className="py-4">
            <FiXCircle size={64} className="text-danger mb-3" />
            <h3 className="h4 fw-bold text-danger mb-2">Invalid or Unconfirmed Ticket</h3>
            <p className="text-muted small mb-4">{error}</p>
            <Link to="/" className="btn btn-cinema-secondary">
              Back to Home
            </Link>
          </div>
        ) : ticketData?.isValid ? (
          <div className="py-2">
            <div
              className="rounded-circle d-inline-flex p-3 mb-3"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
            >
              <FiCheckCircle size={56} />
            </div>

            <h3 className="h4 fw-bold text-success mb-1">Valid Cinema Admission</h3>
            <div className="small font-monospace text-muted mb-4">
              Ref: {ticketData.bookingReference}
            </div>

            <div
              className="text-start p-3 rounded mb-4"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
            >
              <div className="mb-2">
                <span className="text-muted small d-block">Movie:</span>
                <strong className="fs-5" style={{ color: 'var(--color-text)' }}>
                  {ticketData.movie}
                </strong>
              </div>

              <div className="mb-2">
                <span className="text-muted small d-block">Theatre & Screen:</span>
                <strong>{ticketData.theatre}</strong> — {ticketData.screen}
              </div>

              <div className="row g-2 mb-2">
                <div className="col-6">
                  <span className="text-muted small d-block">Show Date:</span>
                  <strong>{ticketData.showDate}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted small d-block">Showtime:</span>
                  <strong style={{ color: 'var(--color-primary)' }}>{ticketData.startTime}</strong>
                </div>
              </div>

              <div className="mb-2">
                <span className="text-muted small d-block">Allocated Seats:</span>
                <strong className="text-success fs-6">
                  {ticketData.seats?.join(', ')} ({ticketData.ticketCount} tickets)
                </strong>
              </div>
            </div>

            <div className="badge bg-success py-2 px-3 fs-6">
              ADMISSION AUTHORIZED
            </div>
          </div>
        ) : (
          <div className="py-4">
            <FiXCircle size={64} className="text-danger mb-3" />
            <h3 className="h4 fw-bold text-danger mb-2">Ticket Inactive</h3>
            <p className="text-muted small">Status: {ticketData?.status || 'Unknown'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketVerification;
