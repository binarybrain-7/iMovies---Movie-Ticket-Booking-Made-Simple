import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService';
import { theatreService } from '../../services/theatreService';
import { screenService } from '../../services/screenService';
import { showService } from '../../services/showService';
import { toast } from 'react-toastify';
import { FiX, FiFilm, FiCalendar, FiClock, FiDollarSign, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const EditShowModal = ({ isOpen, show, onClose, onSaved }) => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);

  // Form fields
  const [movieId, setMovieId] = useState('');
  const [theatreId, setTheatreId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [showDate, setShowDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [status, setStatus] = useState('active');

  // Pricing fields
  const [balconyPrice, setBalconyPrice] = useState(250);
  const [middlePrice, setMiddlePrice] = useState(180);
  const [lowerPrice, setLowerPrice] = useState(120);

  // Bookings & confirmation
  const [bookingsCount, setBookingsCount] = useState(0);
  const [confirmReschedule, setConfirmReschedule] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Initialize data on show change or modal open
  useEffect(() => {
    if (!isOpen || !show) return;

    let isMounted = true;

    const loadMeta = async () => {
      try {
        setLoadingInitial(true);
        const [mvRes, thRes] = await Promise.all([
          movieService.getMovies({ limit: 100 }),
          theatreService.getTheatres({ activeOnly: 'false' }),
        ]);

        if (!isMounted) return;

        const mList = mvRes.data.movies || [];
        const tList = thRes.data.theatres || [];
        setMovies(mList);
        setTheatres(tList);

        // Pre-fill initial values
        const initialMovieId = show.movieId?._id || show.movieId || '';
        const initialTheatreId = show.theatreId?._id || show.theatreId || '';
        const initialScreenId = show.screenId?._id || show.screenId || '';

        setMovieId(initialMovieId);
        setTheatreId(initialTheatreId);
        setShowDate(show.showDate || '');
        setStartTime(show.startTime || '');
        setStatus(show.status || 'active');

        // Pre-fill pricing
        const p = show.seatPricing || {};
        setBalconyPrice(p.Balcony || p.balcony || 250);
        setMiddlePrice(p.Middle || p.middle || 180);
        setLowerPrice(p.Lower || p.lower || 120);

        // Check if show has bookings
        try {
          const detailRes = await showService.getShowById(show._id);
          if (isMounted) {
            setBookingsCount(detailRes.data?.bookingsCount || 0);
          }
        } catch (e) {
          // ignore error
        }

        // Load screens for the current theatre
        if (initialTheatreId) {
          const scRes = await screenService.getScreensByTheatre(initialTheatreId, { activeOnly: 'false' });
          if (isMounted) {
            const scList = scRes.data.screens || [];
            setScreens(scList);
            setScreenId(initialScreenId || (scList.length > 0 ? scList[0]._id : ''));
          }
        }
      } catch (err) {
        console.error('Failed to load edit show modal data:', err);
        toast.error('Failed to load movies or theatres for editing');
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    loadMeta();

    return () => {
      isMounted = false;
    };
  }, [isOpen, show]);

  // Handle theatre change to dynamically reload its screens
  const handleTheatreChange = async (newTheatreId) => {
    setTheatreId(newTheatreId);
    if (!newTheatreId) {
      setScreens([]);
      setScreenId('');
      return;
    }

    try {
      const res = await screenService.getScreensByTheatre(newTheatreId, { activeOnly: 'false' });
      const scList = res.data.screens || [];
      setScreens(scList);
      if (scList.length > 0) {
        setScreenId(scList[0]._id);
      } else {
        setScreenId('');
      }
    } catch (err) {
      toast.error('Failed to load screens for the selected theatre');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!movieId || !theatreId || !screenId || !showDate || !startTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (balconyPrice < 0 || middlePrice < 0 || lowerPrice < 0) {
      toast.error('Pricing cannot be negative');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        movieId,
        theatreId,
        screenId,
        showDate,
        startTime,
        status,
        seatPricing: {
          Balcony: Number(balconyPrice),
          Middle: Number(middlePrice),
          Lower: Number(lowerPrice),
          Recliner: Number(balconyPrice) * 1.5,
          'Premium Plus': Number(middlePrice),
          'Premium XL': Number(middlePrice),
          Premium: Number(middlePrice),
          Executive: Number(middlePrice),
          Normal: Number(lowerPrice),
        },
        confirmReschedule,
      };

      const res = await showService.updateShow(show._id, payload);
      const updated = res.data?.show || res.show;

      toast.success('Show updated successfully!');
      if (onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update show:', err);
      toast.error(err.message || 'Failed to update show schedule');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !show) return null;

  const hasBookings = bookingsCount > 0;

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
          maxWidth: '680px',
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
            <FiFilm className="text-danger" /> Edit <span className="text-danger">Show</span>
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

        {/* Existing Bookings Warning Alert if applicable */}
        {hasBookings && (
          <div
            className="p-3 mb-3 rounded small d-flex flex-column gap-2"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
            }}
          >
            <div className="d-flex align-items-center gap-2 fw-bold text-danger">
              <FiAlertTriangle size={18} />
              <span>Active Customer Bookings Detected ({bookingsCount})</span>
            </div>
            <p className="mb-0 text-light">
              This show currently has <strong>{bookingsCount}</strong> confirmed customer booking(s).
              To preserve customers' booked seats, the movie, theatre, and screen are locked from modification.
            </p>
            <div className="form-check mt-1">
              <input
                className="form-check-input"
                type="checkbox"
                id="confirmRescheduleCheck"
                checked={confirmReschedule}
                onChange={(e) => setConfirmReschedule(e.target.checked)}
              />
              <label className="form-check-label text-warning small fw-medium" htmlFor="confirmRescheduleCheck">
                I understand this show has active bookings and confirm date/time reschedule.
              </label>
            </div>
          </div>
        )}

        {loadingInitial ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border spinner-border-sm text-danger me-2" role="status" />
            Loading show data & venues...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Movie Dropdown */}
              <div className="col-12 col-md-6 text-start">
                <label className="cinema-label d-flex align-items-center gap-1">
                  <FiFilm size={14} className="text-danger" /> Movie
                </label>
                <select
                  className="form-select cinema-select"
                  value={movieId}
                  onChange={(e) => setMovieId(e.target.value)}
                  disabled={hasBookings}
                  required
                >
                  <option value="">Select Movie</option>
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.language} - {m.runtimeMinutes}m)
                    </option>
                  ))}
                </select>
                {hasBookings && (
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '3px' }}>
                    Locked to protect existing tickets.
                  </div>
                )}
              </div>

              {/* Theatre Dropdown */}
              <div className="col-12 col-md-6 text-start">
                <label className="cinema-label d-flex align-items-center gap-1">
                  <FaTheaterMasks size={14} className="text-warning" /> Theatre / Venue
                </label>
                <select
                  className="form-select cinema-select"
                  value={theatreId}
                  onChange={(e) => handleTheatreChange(e.target.value)}
                  disabled={hasBookings}
                  required
                >
                  <option value="">Select Theatre</option>
                  {theatres.map((th) => (
                    <option key={th._id} value={th._id}>
                      {th.name} ({th.city})
                    </option>
                  ))}
                </select>
                {hasBookings && (
                  <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '3px' }}>
                    Locked to protect existing tickets.
                  </div>
                )}
              </div>

              {/* Screen Dropdown */}
              <div className="col-12 col-md-6 text-start">
                <label className="cinema-label">Screen Auditorium</label>
                <select
                  className="form-select cinema-select"
                  value={screenId}
                  onChange={(e) => setScreenId(e.target.value)}
                  disabled={hasBookings || screens.length === 0}
                  required
                >
                  <option value="">Select Screen</option>
                  {screens.map((sc) => (
                    <option key={sc._id} value={sc._id}>
                      {sc.name} ({sc.totalSeats || 120} seats)
                    </option>
                  ))}
                </select>
                {screens.length === 0 && !hasBookings && (
                  <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                    No screens found for this theatre.
                  </div>
                )}
              </div>

              {/* Status Dropdown */}
              <div className="col-12 col-md-6 text-start">
                <label className="cinema-label">Show Status</label>
                <select
                  className="form-select cinema-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="active">Active (Now Bookable)</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Show Date */}
              <div className="col-12 col-md-6 text-start">
                <label className="cinema-label d-flex align-items-center gap-1">
                  <FiCalendar size={14} /> Show Date
                </label>
                <input
                  type="date"
                  className="form-control cinema-input"
                  value={showDate}
                  onChange={(e) => setShowDate(e.target.value)}
                  required
                />
              </div>

              {/* Show Time */}
              <div className="col-12 col-md-6 text-start">
                <label className="cinema-label d-flex align-items-center gap-1">
                  <FiClock size={14} /> Show Start Time
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14:00 or 02:00 PM"
                  className="form-control cinema-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  24-hour (14:30) or 12-hour (02:30 PM)
                </span>
              </div>

              {/* Seat Pricing Section */}
              <div className="col-12 text-start pt-2 border-top" style={{ borderColor: 'var(--color-border)' }}>
                <h6 className="text-light fw-bold mb-3 d-flex align-items-center gap-1">
                  <FiDollarSign className="text-success" /> Seat Pricing (INR ₹)
                </h6>
                <div className="row g-2">
                  <div className="col-4">
                    <label className="cinema-label small text-muted">Balcony / Recliner</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control cinema-input"
                      value={balconyPrice}
                      onChange={(e) => setBalconyPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="cinema-label small text-muted">Middle / Premium</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control cinema-input"
                      value={middlePrice}
                      onChange={(e) => setMiddlePrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-4">
                    <label className="cinema-label small text-muted">Lower / Standard</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control cinema-input"
                      value={lowerPrice}
                      onChange={(e) => setLowerPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm px-3"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-cinema btn-sm px-4 d-flex align-items-center gap-1"
                disabled={submitting || (hasBookings && !confirmReschedule && (showDate !== show.showDate || startTime !== show.startTime))}
              >
                <FiCheck size={16} />
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditShowModal;
