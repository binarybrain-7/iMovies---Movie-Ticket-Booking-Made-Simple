import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { reviewService } from '../services/reviewService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiClock,
  FiCalendar,
  FiStar,
  FiHeart,
  FiPlay,
  FiCheck,
  FiShare2,
  FiArrowLeft,
  FiUser,
  FiTrash2,
  FiFilm,
} from 'react-icons/fi';

const MovieDetails = () => {
  const { movieId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [hasActiveShows, setHasActiveShows] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const [movieRes, reviewsRes] = await Promise.all([
          movieService.getMovieById(movieId),
          reviewService.getReviews(movieId),
        ]);

        setMovie(movieRes.data.movie);
        setHasActiveShows(movieRes.data.hasActiveShows);
        setReviews(reviewsRes.data.reviews || []);

        if (isAuthenticated) {
          const favRes = await favoriteService.getFavorites();
          const isFav = (favRes.data.movies || []).some((m) => m._id === movieId);
          setIsFavorite(isFav);
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        toast.error('Movie details could not be loaded');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/movies/${movieId}` } });
      return;
    }

    try {
      if (isFavorite) {
        await favoriteService.removeFavorite(movieId);
        setIsFavorite(false);
        toast.info('Removed from Favorites');
      } else {
        await favoriteService.addFavorite(movieId);
        setIsFavorite(true);
        toast.success('Added to Favorites');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update favorites');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/movies/${movieId}` } });
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.submitReview(movieId, { rating, comment });
      toast.success('Review submitted successfully!');
      setComment('');
      // Refresh reviews
      const updated = await reviewService.getReviews(movieId);
      setReviews(updated.data.reviews || []);
      // Refresh movie rating
      const updatedMovie = await movieService.getMovieById(movieId);
      setMovie(updatedMovie.data.movie);
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewService.deleteReview(reviewId);
      toast.success('Review deleted');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading movie details..." />;
  }

  if (!movie) {
    return (
      <div className="container py-5 text-center">
        <h2>Movie not found</h2>
        <Link to="/movies" className="btn btn-cinema mt-3">
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const releaseFormatted = movie.releaseDate
    ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Coming Soon';

  return (
    <div className="movie-details-page pb-5">
      {/* Backdrop Header */}
      <div
        className="backdrop-header position-relative"
        style={{
          minHeight: '360px',
          backgroundImage: movie.backdropUrl
            ? `linear-gradient(to bottom, rgba(8, 9, 13, 0.4) 0%, rgba(8, 9, 13, 0.95) 100%), url(${movie.backdropUrl})`
            : 'linear-gradient(to bottom, #111827 0%, #08090D 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div className="container">
          <Link to="/movies" className="btn btn-cinema-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
            <FiArrowLeft /> Back to Movies
          </Link>
        </div>
      </div>

      {/* Main Info Section */}
      <div className="container" style={{ marginTop: '-120px', position: 'relative', zIndex: 10 }}>
        <div className="row g-4">
          {/* Poster Column */}
          <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="img-fluid rounded shadow-lg border"
              style={{
                borderColor: 'var(--color-border)',
                maxHeight: '420px',
                width: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Favorite & Trailer buttons */}
            <div className="d-flex gap-2 mt-3 justify-content-center justify-content-md-start">
              <button
                onClick={toggleFavorite}
                className={`btn ${isFavorite ? 'btn-danger' : 'btn-cinema-secondary'} flex-grow-1 d-flex align-items-center justify-content-center gap-2`}
              >
                <FiHeart fill={isFavorite ? '#fff' : 'none'} />
                {isFavorite ? 'Favorited' : 'Add to Favorites'}
              </button>

              {movie.trailerUrl && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="btn btn-cinema-secondary d-flex align-items-center justify-content-center gap-1"
                  title="Watch Trailer"
                >
                  <FiPlay /> Trailer
                </button>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="col-12 col-md-8 col-lg-9">
            <div className="cinema-card p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <h1 className="h2 fw-bold mb-1" style={{ color: 'var(--color-text)' }}>
                    {movie.title}
                  </h1>
                  <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
                    <span className="badge bg-secondary">{movie.certification || 'UA'}</span>
                    <span>{movie.language}</span>
                    <span className="d-flex align-items-center gap-1">
                      <FiClock /> {movie.runtimeMinutes} min
                    </span>
                    <span className="d-flex align-items-center gap-1">
                      <FiCalendar /> {releaseFormatted}
                    </span>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="text-center p-2 rounded" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                  <div className="d-flex align-items-center justify-content-center gap-1 text-warning fw-bold fs-5">
                    <FiStar fill="#F59E0B" /> {movie.averageRating ? movie.averageRating.toFixed(1) : 'NR'}
                  </div>
                  <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                    {movie.reviewCount} {movie.reviewCount === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>

              {/* Genres */}
              <div className="d-flex flex-wrap gap-2 mb-4">
                {(movie.genres || []).map((genre) => (
                  <span key={genre} className="movie-genre-badge">
                    {genre}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="mb-4">
                <h5 className="fw-bold mb-2">Synopsis</h5>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
                  {movie.description}
                </p>
              </div>

              {/* Cast & Crew */}
              <div className="row g-3 mb-4">
                {movie.director && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small d-block">Director</span>
                    <strong>{movie.director}</strong>
                  </div>
                )}
                {movie.cast && movie.cast.length > 0 && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted small d-block">Cast</span>
                    <strong>{movie.cast.join(', ')}</strong>
                  </div>
                )}
              </div>

              {/* Primary Action Button: Select Show & Book */}
              <div className="border-top pt-3 mt-3 d-flex flex-wrap align-items-center justify-content-between gap-3" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <span className="text-muted small d-block">Status:</span>
                  <span className="text-capitalize fw-bold" style={{ color: 'var(--color-primary)' }}>
                    {movie.status === 'now_showing' ? 'Currently In Theatres' : 'Upcoming Release'}
                  </span>
                </div>

                <Link
                  to={`/select-show?movieId=${movie._id}`}
                  className="btn btn-cinema btn-lg px-4 d-flex align-items-center gap-2"
                >
                  <FiFilm /> Select Show & Book Tickets
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <section className="mt-5">
          <div className="cinema-card p-4">
            <h3 className="h4 fw-bold mb-4">
              Audience <span style={{ color: 'var(--color-primary)' }}>Reviews</span> ({reviews.length})
            </h3>

            {/* Submit Review Form */}
            <div className="p-3 mb-4 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              <h5 className="fw-bold mb-3 small text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Rate & Review "{movie.title}"
              </h5>

              <form onSubmit={handleReviewSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-sm-3">
                    <label className="cinema-label">Your Rating (1 to 5 Stars)</label>
                    <select
                      className="form-select cinema-select"
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 - Masterpiece)</option>
                      <option value="4">⭐⭐⭐⭐ (4 - Very Good)</option>
                      <option value="3">⭐⭐⭐ (3 - Average)</option>
                      <option value="2">⭐⭐ (2 - Below Average)</option>
                      <option value="1">⭐ (1 - Poor)</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-9">
                    <label className="cinema-label">Your Comments</label>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control cinema-input flex-grow-1"
                        placeholder="What did you think of the direction, action, and acting?"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={1000}
                        required
                      />
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="btn btn-cinema px-4"
                      >
                        {submittingReview ? 'Posting...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p className="text-muted small text-center py-4 mb-0">
                No audience reviews yet. Be the first to share your thoughts!
              </p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    className="p-3 rounded border"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-secondary"
                          style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                        >
                          <FiUser />
                        </div>
                        <strong className="small">{rev.userId?.username || 'Verified Moviegoer'}</strong>
                        <span className="badge bg-warning text-dark small d-flex align-items-center gap-1">
                          <FiStar fill="#000" size={10} /> {rev.rating}/5
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <span className="small text-muted">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                        {(user?._id === rev.userId?._id || user?.role === 'ADMIN') && (
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            className="btn btn-link text-danger p-0"
                            title="Delete Review"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="small mb-0" style={{ color: 'var(--color-text-secondary)' }}>
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setShowTrailerModal(false)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content cinema-card p-2 border-danger">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">{movie.title} - Official Trailer</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowTrailerModal(false)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body p-3">
                <div className="ratio ratio-16x9">
                  <iframe
                    src={
                      movie.trailerUrl?.includes('watch?v=')
                        ? movie.trailerUrl.replace('watch?v=', 'embed/')
                        : movie.trailerUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                    }
                    title={movie.title}
                    allowFullScreen
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
