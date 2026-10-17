import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiPrinter, FiCheckCircle } from 'react-icons/fi';

const DigitalTicket = ({ booking }) => {
  if (!booking) return null;

  const show = booking.showId || {};
  const movie = show.movieId || {};
  const theatre = show.theatreId || {};
  const screen = show.screenId || {};

  const verificationUrl = `${window.location.origin}/verify-ticket/${booking.bookingReference}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="ticket-container my-3" style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div
        className="cinema-card ticket-print-area p-4 position-relative overflow-hidden shadow-lg"
        style={{
          border: '2px dashed var(--color-primary)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="brand-logo">
            <span className="brand-i">i</span>
            <span className="brand-movies">Movies</span>
            <span className="badge bg-danger ms-2 px-2 py-1 small" style={{ fontSize: '0.65rem' }}>
              E-TICKET
            </span>
          </div>
          <div className="text-end">
            <div className="small text-muted">Booking Reference</div>
            <div className="fw-bold font-monospace text-primary" style={{ color: 'var(--color-primary)' }}>
              {booking.bookingReference}
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="row g-3 align-items-center">
          {/* Movie Poster & Title */}
          <div className="col-12 col-sm-4 text-center">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title || 'Movie'}
                className="rounded shadow"
                style={{ width: '130px', height: '180px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="bg-secondary rounded d-flex align-items-center justify-content-center"
                style={{ width: '130px', height: '180px', margin: '0 auto' }}
              >
                No Image
              </div>
            )}
          </div>

          <div className="col-12 col-sm-8">
            <h4 className="fw-bold mb-1" style={{ color: 'var(--color-text)' }}>
              {movie.title || 'Movie Title'}
            </h4>
            <div className="small text-muted mb-3">
              {movie.certification || 'UA'} • {movie.runtimeMinutes || 120} mins • {movie.language || 'Hindi'}
            </div>

            <div className="mb-2">
              <span className="text-muted small d-block">Theatre & Screen:</span>
              <strong>{theatre.name || 'Cinema Hall'}</strong> — {screen.name || 'Screen 1'}
              <div className="small text-muted">{theatre.location || theatre.city || ''}</div>
            </div>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <span className="text-muted small d-block">Show Date:</span>
                <strong>{show.showDate}</strong>
              </div>
              <div className="col-6">
                <span className="text-muted small d-block">Showtime:</span>
                <strong style={{ color: 'var(--color-primary)' }}>{show.startTime}</strong>
              </div>
            </div>

            <div className="mb-2">
              <span className="text-muted small d-block">Seats Reserved:</span>
              <strong className="text-success" style={{ fontSize: '1.1rem' }}>
                {booking.seats?.map((s) => s.seatNumber).join(', ')}
              </strong>
              <span className="small text-muted ms-2">({booking.seats?.length} tickets)</span>
            </div>
          </div>
        </div>

        {/* QR Code and Verification Row */}
        <div className="d-flex flex-wrap justify-content-between align-items-center border-top pt-3 mt-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="p-2 bg-white rounded shadow-sm">
              <QRCodeSVG value={verificationUrl} size={84} level="H" />
            </div>
            <div>
              <div className="d-flex align-items-center gap-1 text-success fw-bold small">
                <FiCheckCircle /> Verified Admission
              </div>
              <div className="small text-muted" style={{ maxWidth: '240px' }}>
                Scan QR code at the cinema gate for rapid digital ticket validation.
              </div>
            </div>
          </div>

          <div className="text-end mt-2 mt-sm-0">
            <div className="small text-muted">Total Paid</div>
            <h3 className="fw-bold mb-0" style={{ color: 'var(--color-text)' }}>
              ₹{booking.totalAmount}
            </h3>
            <span className="badge bg-success small">PAID</span>
          </div>
        </div>
      </div>

      {/* Print Button (hidden during print) */}
      <div className="d-flex justify-content-end mt-3 no-print">
        <button onClick={handlePrint} className="btn btn-cinema-secondary d-flex align-items-center gap-2">
          <FiPrinter /> Print / Save PDF
        </button>
      </div>
    </div>
  );
};

export default DigitalTicket;
