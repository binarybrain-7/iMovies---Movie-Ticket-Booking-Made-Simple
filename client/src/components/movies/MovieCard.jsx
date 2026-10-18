import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiStar, FiTrash2, FiImage, FiEdit2, FiInfo } from 'react-icons/fi';

const FALLBACK_POSTER =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22450%22%20viewBox%3D%220%200%20300%20450%22%3E%3Crect%20fill%3D%22%23111827%22%20width%3D%22300%22%20height%3D%22450%22%2F%3E%3Ctext%20fill%3D%22%23E50914%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2245%25%22%20text-anchor%3D%22middle%22%3EiMovies%3C%2Ftext%3E%3Ctext%20fill%3D%22%239CA3AF%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20x%3D%2250%25%22%20y%3D%2255%25%22%20text-anchor%3D%22middle%22%3ECinema%20Poster%3C%2Ftext%3E%3C%2Fsvg%3E';

const MovieCard = ({
  movie,
  isAdmin = false,
  onDelete,
  onEdit,
  onViewDetails,
  onEditPoster,
}) => {
  const [imgSrc, setImgSrc] = useState(movie.posterUrl || FALLBACK_POSTER);

  useEffect(() => {
    setImgSrc(movie.posterUrl || FALLBACK_POSTER);
  }, [movie.posterUrl]);

  const formattedDate = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Coming Soon';

  const genreText = Array.isArray(movie.genres)
    ? movie.genres.join(', ')
    : movie.genres || 'Action';

  return (
    <div className="movie-card position-relative">
      {/* Admin action overlays */}
      {isAdmin && (
        <div
          className="position-absolute top-0 end-0 m-2 d-flex gap-1"
          style={{ zIndex: 10 }}
        >
          {onEditPoster && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditPoster(movie);
              }}
              className="btn p-1 rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#1F2937',
                width: '32px',
                height: '32px',
                border: 'none',
              }}
              title="Change Movie Poster"
              aria-label="Change Movie Poster"
            >
              <FiImage size={15} />
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(movie);
              }}
              className="btn p-1 rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#2563EB',
                width: '32px',
                height: '32px',
                border: 'none',
              }}
              title="Edit Movie"
              aria-label="Edit Movie"
            >
              <FiEdit2 size={15} />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(movie);
              }}
              className="btn p-1 rounded-circle d-flex align-items-center justify-content-center shadow"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: 'var(--color-primary)',
                width: '32px',
                height: '32px',
                border: 'none',
              }}
              title="Delete Movie"
              aria-label="Delete Movie"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </div>
      )}

      {/* Poster image */}
      <Link to={`/movies/${movie._id}`} className="movie-card-img-wrap text-decoration-none">
        <img
          src={imgSrc}
          alt={movie.title}
          className="movie-card-img"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_POSTER)}
        />
        {movie.averageRating > 0 && (
          <div
            className="position-absolute bottom-0 start-0 m-2 px-2 py-1 rounded small d-flex align-items-center gap-1 shadow"
            style={{
              backgroundColor: 'rgba(17, 24, 39, 0.85)',
              color: '#F59E0B',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            <FiStar fill="#F59E0B" size={12} />
            <span>{movie.averageRating.toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Card Info */}
      <div className="movie-card-body">
        <Link to={`/movies/${movie._id}`} className="text-decoration-none">
          <h3 className="movie-card-title" title={movie.title}>
            {movie.title}
          </h3>
        </Link>

        <div className="movie-card-date">
          <FiCalendar size={13} />
          <span>{formattedDate}</span>
        </div>

        <div className="mb-3">
          <span className="movie-genre-badge">{genreText}</span>
        </div>

        <div className="mt-auto">
          {isAdmin ? (
            <div className="d-flex gap-2">
              {onViewDetails && (
                <button
                  type="button"
                  onClick={() => onViewDetails(movie)}
                  className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                >
                  <FiInfo size={14} /> Details
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(movie)}
                  className="btn btn-cinema btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                >
                  <FiEdit2 size={14} /> Edit
                </button>
              )}
            </div>
          ) : (
            <Link to={`/movies/${movie._id}`} className="btn btn-cinema btn-sm w-100">
              Book Tickets
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
