import React, { useEffect, useState } from 'react';
import { showService } from '../../services/showService';
import { FiX, FiFilm, FiCalendar, FiClock, FiDollarSign, FiUsers, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const ShowDetailsModal = ({ isOpen, show, onClose, onOpenEdit }) => {
  const [details, setDetails] = useState(null);
  const [seatStats, setSeatStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !show) return;

    let isMounted = true;
    const fetchFullDetails = async () => {
      try {
        setLoading(true);
        const [showRes, seatsRes] = await Promise.allSettled([
          showService.getShowById(show._id),
          showService.getShowSeats(show._id),
        ]);

        if (!isMounted) return;

        if (showRes.status === 'fulfilled') {
          setDetails(showRes.value.data);
        }
        if (seatsRes.status === 'fulfilled') {
          setSeatStats(seatsRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load show details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFullDetails();
    return () => {
      isMounted = false;
    };
  }, [isOpen, show]);

  if (!isOpen || !show) return null;

  const currentShow = details?.show || show;
  const movie = currentShow.movieId || {};
  const theatre = currentShow.theatreId || {};
  const screen = currentShow.screenId || {};
  const bookingsCount = details?.bookingsCount ?? 0;
  const totalSeats = screen.totalSeats || seatStats?.seats?.length || 120;
  const bookedSeats = seatStats?.seats?.filter((s) => s.status === 'booked' || s.status === 'locked').length || 0;
  const availableSeats = totalSeats - bookedSeats;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1055,
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="cinema-card p-4 mx-3 shadow-2xl"
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#111827',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--color-border)' }}>
          <h4 className="modal-title mb-0 text-light fw-bold d-flex align-items-center gap-2">
            <FiFilm className="text-danger" /> Show <span className="text-danger">Details</span>
          </h4>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px' }}
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="row g-4 mb-3">
          {/* Movie poster & title */}
          <div className="col-12 col-sm-4 text-center">
            <div
              className="rounded overflow-hidden shadow-sm mx-auto mb-2"
              style={{
                width: '130px',
                height: '190px',
                backgroundColor: '#08090D',
                border: '2px solid rgba(229, 9, 20, 0.5)',
              }}
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title || 'Movie Poster'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                  <FiFilm size={32} />
                </div>
              )}
            </div>
            <span
              className={`badge ${
                currentShow.status === 'active'
                  ? 'bg-success'
                  : currentShow.status === 'cancelled'
                  ? 'bg-danger'
                  : 'bg-secondary'
              }`}
            >
              Status: {currentShow.status || 'Active'}
            </span>
          </div>

          {/* Core Info */}
          <div className="col-12 col-sm-8 text-start">
            <h4 className="text-white fw-bold mb-1">{movie.title || 'Unknown Title'}</h4>
            <div className="text-muted small mb-3">
              {movie.language || 'Hindi'} • {movie.certification || 'UA'} • {movie.runtimeMinutes || 120} min
            </div>

            <div className="mb-2 d-flex align-items-start gap-2">
              <FaTheaterMasks className="text-warning flex-shrink-0 mt-1" />
              <div>
                <strong className="text-light">{theatre.name || 'Venue'}</strong>
                <div className="small text-muted">{theatre.location || theatre.address || theatre.city || ''}</div>
              </div>
            </div>

            <div className="mb-2 d-flex align-items-center gap-2 small">
              <span className="badge bg-dark border text-light">Auditorium: {screen.name || 'Screen 1'}</span>
            </div>

            <div className="row g-2 my-2 p-2 rounded" style={{ backgroundColor: '#08090D' }}>
              <div className="col-6 small">
                <FiCalendar className="text-danger me-1" />
                <span className="text-muted">Date: </span>
                <strong className="text-light">{currentShow.showDate}</strong>
              </div>
              <div className="col-6 small">
                <FiClock className="text-danger me-1" />
                <span className="text-muted">Time: </span>
                <strong className="text-light">{currentShow.startTime}</strong>
              </div>
            </div>

            {/* Occupancy stats */}
            <div className="row g-2 mt-2">
              <div className="col-4">
                <div className="p-2 rounded text-center" style={{ backgroundColor: '#1F2937' }}>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Total Seats</div>
                  <strong className="text-light">{totalSeats}</strong>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded text-center" style={{ backgroundColor: '#1F2937' }}>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Booked</div>
                  <strong className="text-danger">{bookedSeats}</strong>
                </div>
              </div>
              <div className="col-4">
                <div className="p-2 rounded text-center" style={{ backgroundColor: '#1F2937' }}>
                  <div className="text-muted small" style={{ fontSize: '0.72rem' }}>Available</div>
                  <strong className="text-success">{availableSeats}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing breakdown */}
        <div className="pt-3 border-top text-start" style={{ borderColor: 'var(--color-border)' }}>
          <h6 className="text-light small fw-bold mb-2 d-flex align-items-center gap-1">
            <FiDollarSign className="text-success" /> Ticket Pricing Breakdown
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {currentShow.seatPricing &&
              Object.entries(currentShow.seatPricing).map(([cat, pr]) => (
                <div
                  key={cat}
                  className="px-3 py-1 rounded small border"
                  style={{
                    backgroundColor: '#0B0F17',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <span className="text-muted">{cat}: </span>
                  <strong className="text-white">₹{pr}</strong>
                </div>
              ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
          <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
            Close
          </button>
          {onOpenEdit && (
            <button
              type="button"
              className="btn btn-cinema btn-sm px-4 d-flex align-items-center gap-1"
              onClick={() => {
                onClose();
                onOpenEdit(currentShow);
              }}
            >
              <FiEdit2 size={15} /> Edit This Show
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowDetailsModal;
