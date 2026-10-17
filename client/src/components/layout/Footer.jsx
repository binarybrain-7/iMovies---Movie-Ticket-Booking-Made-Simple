import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer
      className="mt-auto py-4 px-3"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div className="container text-center">
        <div className="mb-2">
          <Link to="/" className="brand-logo text-decoration-none">
            <span className="brand-i">i</span>
            <span className="brand-movies">Movies</span>
          </Link>
        </div>
        <p
          className="small mb-3"
          style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}
        >
          Movie Ticket Booking Made Simple. Explore the latest blockbusters, find convenient showtimes, and book your cinema seats seamlessly.
        </p>
        <div className="d-flex justify-content-center gap-3 mb-3 small flex-wrap">
          <Link to="/" className="text-decoration-none hover-primary" style={{ color: 'var(--color-text-secondary)' }}>
            Home
          </Link>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <Link to="/movies" className="text-decoration-none hover-primary" style={{ color: 'var(--color-text-secondary)' }}>
            Movies
          </Link>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <Link to="/my-bookings" className="text-decoration-none hover-primary" style={{ color: 'var(--color-text-secondary)' }}>
            My Bookings
          </Link>
          <span style={{ color: 'var(--color-border)' }}>•</span>
          <Link to="/admin" className="text-decoration-none hover-primary" style={{ color: 'var(--color-text-secondary)' }}>
            Admin Portal
          </Link>
        </div>
        <div className="small" style={{ color: 'var(--color-text-muted)' }}>
          &copy; {new Date().getFullYear()} IMovies. Designed & Developed by <strong style={{ color: 'var(--color-text)' }}>Aditya Vishwakarma</strong>.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
