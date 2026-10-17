import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiFilm } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="not-found-page container py-5 text-center" style={{ minHeight: '60vh' }}>
      <div className="py-5" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 className="display-1 fw-bold text-danger mb-2">404</h1>
        <h2 className="h4 fw-bold mb-3">Cinema Reel Not Found</h2>
        <p className="text-muted small mb-4">
          The movie page, showtime, or booking link you are looking for doesn't exist or has moved.
        </p>

        <div className="d-flex justify-content-center gap-3">
          <Link to="/" className="btn btn-cinema d-flex align-items-center gap-2">
            <FiHome /> Back to Home
          </Link>
          <Link to="/movies" className="btn btn-cinema-secondary d-flex align-items-center gap-2">
            <FiFilm /> Browse Movies
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
