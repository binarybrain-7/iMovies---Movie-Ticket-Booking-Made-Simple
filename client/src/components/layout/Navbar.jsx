import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  FiSun,
  FiMoon,
  FiHome,
  FiHeart,
  FiUser,
  FiLogOut,
  FiFilm,
  FiPlusCircle,
  FiClock,
  FiSearch,
} from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/movies');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="navbar navbar-expand px-3 px-md-4 py-2"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        {/* Brand Logo matching reference: red 'i', white 'Movies' */}
        <Link to="/" className="brand-logo text-decoration-none">
          <span className="brand-i">i</span>
          <span className="brand-movies">Movies</span>
        </Link>

        {/* User Search Bar (Only shown on non-admin screens or large displays) */}
        {!isAdmin && (
          <form
            onSubmit={handleSearch}
            className="d-none d-md-flex align-items-center mx-4"
            style={{ maxWidth: '420px', flex: '1 1 auto' }}
          >
            <div className="input-group">
              <input
                type="text"
                className="form-control cinema-input py-1 px-3"
                placeholder="Search movies, genres, actors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              />
              <button
                type="submit"
                className="btn btn-cinema py-1 px-3"
                title="Search"
                aria-label="Search"
              >
                <FiSearch />
              </button>
            </div>
          </form>
        )}

        {/* Right Navigation Icons */}
        <div className="d-flex align-items-center gap-3">
          {/* Theme Toggle Icon Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-link p-1 text-decoration-none"
            style={{ color: 'var(--color-text)', fontSize: '1.25rem' }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>

          {/* Home Icon */}
          <Link
            to="/"
            className="btn btn-link p-1 text-decoration-none"
            style={{
              color: location.pathname === '/' ? 'var(--color-primary)' : 'var(--color-text)',
              fontSize: '1.25rem',
            }}
            title="Home"
            aria-label="Home"
          >
            <FiHome />
          </Link>

          {/* ADMIN VIEW ICONS (Screenshots 2, 3, 4) */}
          {isAdmin ? (
            <>
              {/* Admin Shows */}
              <Link
                to="/admin/shows"
                className="btn btn-link p-1 text-decoration-none"
                style={{
                  color:
                    location.pathname.startsWith('/admin/shows') || location.pathname === '/admin'
                      ? 'var(--color-primary)'
                      : 'var(--color-text)',
                  fontSize: '1.25rem',
                }}
                title="Admin Shows"
                aria-label="Admin Shows"
              >
                <FiFilm />
              </Link>

              {/* Add Shortcuts Dropdown / Link */}
              <div className="position-relative">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="btn btn-link p-1 text-decoration-none"
                  style={{
                    color: adminMenuOpen ? 'var(--color-primary)' : 'var(--color-text)',
                    fontSize: '1.25rem',
                  }}
                  title="Add Resource"
                  aria-label="Add Resource"
                >
                  <FiPlusCircle />
                </button>

                {adminMenuOpen && (
                  <div
                    className="cinema-card position-absolute end-0 mt-2 py-2 shadow-lg"
                    style={{
                      width: '180px',
                      zIndex: 1050,
                      backgroundColor: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <Link
                      to="/admin/add-movie"
                      className="dropdown-item px-3 py-2 text-decoration-none d-block"
                      style={{ color: 'var(--color-text)', fontSize: '0.875rem' }}
                    >
                      + Add Movie
                    </Link>
                    <Link
                      to="/admin/add-theatre"
                      className="dropdown-item px-3 py-2 text-decoration-none d-block"
                      style={{ color: 'var(--color-text)', fontSize: '0.875rem' }}
                    >
                      + Add Theatre
                    </Link>
                    <Link
                      to="/admin/add-show"
                      className="dropdown-item px-3 py-2 text-decoration-none d-block"
                      style={{ color: 'var(--color-text)', fontSize: '0.875rem' }}
                    >
                      + Add Show
                    </Link>
                    <div className="dropdown-divider my-1" style={{ borderColor: 'var(--color-border)' }} />
                    <Link
                      to="/admin/revenue"
                      className="dropdown-item px-3 py-2 text-decoration-none d-block"
                      style={{ color: 'var(--color-text)', fontSize: '0.875rem' }}
                    >
                      Revenue Reports
                    </Link>
                  </div>
                )}
              </div>

              {/* Manage Theatres */}
              <Link
                to="/admin/theatres"
                className="btn btn-link p-1 text-decoration-none"
                style={{
                  color: location.pathname.startsWith('/admin/theatres')
                    ? 'var(--color-primary)'
                    : 'var(--color-text)',
                  fontSize: '1.25rem',
                }}
                title="Manage Theatres"
                aria-label="Manage Theatres"
              >
                <FaTheaterMasks />
              </Link>

              {/* Manage Bookings */}
              <Link
                to="/admin/bookings"
                className="btn btn-link p-1 text-decoration-none"
                style={{
                  color: location.pathname.startsWith('/admin/bookings')
                    ? 'var(--color-primary)'
                    : 'var(--color-text)',
                  fontSize: '1.25rem',
                }}
                title="All Bookings"
                aria-label="All Bookings"
              >
                <FiClock />
              </Link>

              {/* Admin Logout */}
              <button
                onClick={handleLogout}
                className="btn btn-link p-1 text-decoration-none"
                style={{ color: 'var(--color-text)', fontSize: '1.25rem' }}
                title="Logout"
                aria-label="Logout"
              >
                <FiLogOut />
              </button>
            </>
          ) : (
            /* USER VIEW ICONS (Screenshots 1, 4, 5) */
            <>
              {/* Movies Catalogue */}
              <Link
                to="/movies"
                className="btn btn-link p-1 text-decoration-none"
                style={{
                  color: location.pathname === '/movies' ? 'var(--color-primary)' : 'var(--color-text)',
                  fontSize: '1.25rem',
                }}
                title="Movies"
                aria-label="Movies"
              >
                <FiFilm />
              </Link>

              {/* Favorites (Heart) */}
              <Link
                to={isAuthenticated ? '/favorites' : '/login'}
                className="btn btn-link p-1 text-decoration-none"
                style={{
                  color: location.pathname === '/favorites' ? 'var(--color-primary)' : 'var(--color-text)',
                  fontSize: '1.25rem',
                }}
                title="Favorites"
                aria-label="Favorites"
              >
                <FiHeart />
              </Link>

              {/* User Account / Profile */}
              {isAuthenticated ? (
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to="/my-bookings"
                    className="btn btn-link p-1 text-decoration-none"
                    style={{
                      color: location.pathname === '/my-bookings' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '1.25rem',
                    }}
                    title="Your Bookings"
                    aria-label="Your Bookings"
                  >
                    <FiClock />
                  </Link>

                  <Link
                    to="/profile"
                    className="btn btn-link p-1 text-decoration-none"
                    style={{
                      color: location.pathname === '/profile' ? 'var(--color-primary)' : 'var(--color-text)',
                      fontSize: '1.25rem',
                    }}
                    title={user?.username || 'Profile'}
                    aria-label="Profile"
                  >
                    <FiUser />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="btn btn-link p-1 text-decoration-none"
                    style={{ color: 'var(--color-text)', fontSize: '1.25rem' }}
                    title="Logout"
                    aria-label="Logout"
                  >
                    <FiLogOut />
                  </button>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 ms-2">
                  <Link to="/login" className="btn btn-cinema-secondary py-1 px-3 btn-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-cinema py-1 px-3 btn-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
