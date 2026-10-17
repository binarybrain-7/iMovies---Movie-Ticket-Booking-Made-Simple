import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { useAuth } from '../context/AuthContext';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiFilm, FiCalendar, FiMapPin, FiArrowRight } from 'react-icons/fi';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await movieService.getMovies({ limit: 6 });
        setFeaturedMovies(res.data.movies || []);
      } catch (err) {
        console.error('Failed to load featured movies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  return (
    <div className="home-page pb-5">
      {/* HERO SECTION MATCHING SCREENSHOT 1 */}
      <section
        className="hero-section text-center py-5 px-3 d-flex flex-column justify-content-center align-items-center"
        style={{
          minHeight: '68vh',
          backgroundColor: '#08090D',
          position: 'relative',
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(229, 9, 20, 0.12) 0%, rgba(8, 9, 13, 0.95) 70%)',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
          <h1
            className="display-3 fw-bolder mb-3"
            style={{ letterSpacing: '-1px', color: '#FFFFFF' }}
          >
            Welcome to <span style={{ color: '#E50914' }}>iMovies</span>
          </h1>

          <p
            className="lead mb-4"
            style={{ color: '#9CA3AF', fontSize: '1.25rem', fontWeight: '400' }}
          >
            Your ultimate destination for the latest blockbusters and timeless classics
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-cinema btn-cinema-pill px-4 py-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-cinema-secondary btn-cinema-pill px-4 py-2">
                  Sign Up
                </Link>
              </>
            ) : (
              <Link to="/movies" className="btn btn-cinema btn-cinema-pill px-4 py-2">
                Browse Movies <FiArrowRight className="ms-1" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FEATURED / NOW SHOWING MOVIES SECTION */}
      <section className="container my-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h3 fw-bold mb-1" style={{ color: 'var(--color-text)' }}>
              Now <span style={{ color: 'var(--color-primary)' }}>Showing</span>
            </h2>
            <p className="text-muted small mb-0">Book tickets for today's hottest cinema releases</p>
          </div>
          <Link to="/movies" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
            View All <FiArrowRight />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching movies..." />
        ) : (
          <div className="row g-4">
            {featuredMovies.map((movie) => (
              <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-4">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CINEMA EXPERIENCE HIGHLIGHTS */}
      <section className="container my-5">
        <div className="cinema-card p-4 p-md-5">
          <div className="row g-4 text-center">
            <div className="col-12 col-md-4">
              <div
                className="rounded-circle d-inline-flex p-3 mb-3"
                style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
              >
                <FiFilm size={32} />
              </div>
              <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Blockbuster Releases
              </h5>
              <p className="small mb-0" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Discover the latest releases in Telugu, Hindi, English, and regional cinema with high-def trailers.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="rounded-circle d-inline-flex p-3 mb-3"
                style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
              >
                <FiMapPin size={32} />
              </div>
              <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Top Theatres
              </h5>
              <p className="small mb-0" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Book shows at Srinivasa, Gokul Cinema, PVR IMAX, and premium venues across Hyderabad and Bangalore.
              </p>
            </div>

            <div className="col-12 col-md-4">
              <div
                className="rounded-circle d-inline-flex p-3 mb-3"
                style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
              >
                <FiCalendar size={32} />
              </div>
              <h5 className="fw-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Instant QR E-Tickets
              </h5>
              <p className="small mb-0" style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Live interactive seat locking, instant booking confirmation, and digital tickets with QR verification.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
