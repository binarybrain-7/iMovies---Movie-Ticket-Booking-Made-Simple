import React from 'react';
import { FiFilm, FiTrash2, FiEdit2, FiInfo, FiMonitor } from 'react-icons/fi';

const AdminShowCard = ({ show, onEdit, onDelete, onViewDetails }) => {
  const movieTitle = show.movieId?.title || 'Unknown Movie';
  const theatreName = show.theatreId?.name || 'Unknown Theatre';
  const screenName = show.screenId?.name || 'Screen 1';
  const showDate = show.showDate || 'N/A';
  const startTime = show.startTime || 'N/A';
  const status = show.status || 'active';

  return (
    <div
      className="cinema-card p-3 d-flex flex-column h-100"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Header with Movie title & Status */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
          <FiFilm className="text-danger flex-shrink-0" size={18} />
          <span className="small text-muted">Movie: </span>
          <strong className="text-truncate text-white" title={movieTitle}>
            {movieTitle}
          </strong>
        </div>
        <span
          className={`badge small ${
            status === 'active'
              ? 'bg-success'
              : status === 'cancelled'
              ? 'bg-danger'
              : 'bg-secondary'
          }`}
          style={{ fontSize: '0.7rem' }}
        >
          {status}
        </span>
      </div>

      {/* Theatre name */}
      <div className="small text-muted mb-1 ps-4">
        Theatre: <span style={{ color: 'var(--color-text)' }}>{theatreName}</span>
      </div>

      {/* Screen name */}
      <div className="small text-muted mb-1 ps-4 d-flex align-items-center gap-1">
        <FiMonitor size={12} className="text-muted" />
        Screen: <span style={{ color: 'var(--color-text)' }}>{screenName}</span>
      </div>

      {/* Show date */}
      <div className="small text-muted mb-1 ps-4">
        Showdate: <span style={{ color: 'var(--color-text)' }}>{showDate}</span>
      </div>

      {/* Show time */}
      <div className="small text-muted mb-3 ps-4">
        Showtime: <span style={{ color: 'var(--color-text)' }}>{startTime}</span>
      </div>

      {/* Action buttons (View Details, Edit Show, Delete Show) */}
      <div className="mt-auto pt-2 border-top d-flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(show)}
            className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
            title="View Show Details"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
          >
            <FiInfo size={14} /> Details
          </button>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(show)}
            className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 text-info"
            title="Edit Show"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
          >
            <FiEdit2 size={14} /> Edit
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(show)}
            className="btn btn-cinema-danger btn-sm p-1 px-2 d-flex align-items-center justify-content-center"
            title="Delete Show"
            aria-label="Delete Show"
            style={{ minWidth: '36px' }}
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminShowCard;
