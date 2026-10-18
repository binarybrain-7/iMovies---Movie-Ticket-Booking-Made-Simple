import React, { useEffect, useState } from 'react';
import { movieService } from '../../services/movieService';
import { FiX, FiFilm, FiCalendar, FiClock, FiStar, FiUser, FiEdit2, FiExternalLink } from 'react-icons/fi';

const MovieDetailsModal = ({ isOpen, movie, onClose, onOpenEdit }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !movie) return;

    let isMounted = true;
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const res = await movieService.getMovieById(movie._id);
        if (isMounted) {
          setDetails(res.data);
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovieData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, movie]);

  if (!isOpen || !movie) return null;

  const m = details?.movie || movie;
  const hasActiveShows = details?.hasActiveShows;

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
            <FiFilm className="text-danger" /> Movie <span className="text-danger">Details</span>
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
          {/* Poster & status */}
          <div className="col-12 col-sm-4 text-center">
            <div
              className="rounded overflow-hidden shadow-sm mx-auto mb-2"
              style={{
                width: '140px',
                height: '210px',
                backgroundColor: '#08090D',
                border: '2px solid rgba(229, 9, 20, 0.5)',
              }}
            >
              {m.posterUrl ? (
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                  <FiFilm size={32} />
                </div>
              )}
            </div>

            <span
              className={`badge mb-2 ${
                m.status === 'now_showing'
                  ? 'bg-success'
                  : m.status === 'upcoming'
                  ? 'bg-warning text-dark'
                  : 'bg-secondary'
              }`}
            >
              {m.status === 'now_showing'
                ? 'Now Showing'
                : m.status === 'upcoming'
                ? 'Upcoming'
                : 'Archived'}
            </span>

            {hasActiveShows !== undefined && (
              <div className="small text-muted">
                {hasActiveShows ? '🟢 Active shows scheduled' : '⚪ No active shows'}
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="col-12 col-sm-8 text-start">
            <h3 className="text-white fw-bold mb-1">{m.title}</h3>

            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span className="badge bg-danger">{m.certification || 'UA'}</span>
              <span className="badge bg-dark border text-light">{m.language || 'Hindi'}</span>
              <span className="small text-muted d-flex align-items-center gap-1">
                <FiClock size={13} /> {m.runtimeMinutes || 120} min
              </span>
              {m.averageRating > 0 && (
                <span className="small text-warning d-flex align-items-center gap-1 fw-bold">
                  <FiStar fill="#F59E0B" size={13} /> {m.averageRating.toFixed(1)} ({m.reviewCount || 0})
                </span>
              )}
            </div>

            <div className="mb-3">
              <span className="text-muted small">Release Date: </span>
              <strong className="text-light small">
                {m.releaseDate ? new Date(m.releaseDate).toLocaleDateString() : 'N/A'}
              </strong>
            </div>

            {/* Genres */}
            <div className="mb-3">
              <div className="text-muted small mb-1">Genres:</div>
              <div className="d-flex flex-wrap gap-1">
                {(Array.isArray(m.genres) ? m.genres : [m.genres]).map((g, idx) => (
                  <span key={idx} className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Director */}
            {m.director && (
              <div className="mb-2 small">
                <span className="text-muted">Director: </span>
                <strong className="text-light">{m.director}</strong>
              </div>
            )}

            {/* Cast */}
            {m.cast && m.cast.length > 0 && (
              <div className="mb-3 small">
                <span className="text-muted">Cast: </span>
                <span className="text-light">
                  {Array.isArray(m.cast) ? m.cast.join(', ') : m.cast}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        <div className="pt-3 border-top text-start" style={{ borderColor: 'var(--color-border)' }}>
          <h6 className="text-light small fw-bold mb-2">Synopsis</h6>
          <p className="text-muted small mb-3" style={{ lineHeight: '1.6' }}>
            {m.description}
          </p>

          {m.trailerUrl && (
            <div className="mt-2">
              <a
                href={m.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-cinema-secondary btn-sm d-inline-flex align-items-center gap-1"
                style={{ fontSize: '0.8rem' }}
              >
                <FiExternalLink /> Watch Official Trailer
              </a>
            </div>
          )}
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
                onOpenEdit(m);
              }}
            >
              <FiEdit2 size={15} /> Edit This Movie
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsModal;
