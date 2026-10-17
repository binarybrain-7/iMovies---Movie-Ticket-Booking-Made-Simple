import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favoriteService } from '../services/favoriteService';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiHeart, FiFilm } from 'react-icons/fi';

const Favorites = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await favoriteService.getFavorites();
      setMovies(res.data.movies || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
      toast.error('Failed to load your favorite movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (movieId) => {
    try {
      await favoriteService.removeFavorite(movieId);
      setMovies((prev) => prev.filter((m) => m._id !== movieId));
      toast.info('Removed from Favorites');
    } catch (err) {
      toast.error(err.message || 'Failed to remove favorite');
    }
  };

  return (
    <div className="favorites-page container py-4">
      <h1 className="section-title mb-4">
        Your <span className="text-accent">Favorites</span>
      </h1>

      {loading ? (
        <LoadingSpinner message="Loading your watchlist..." />
      ) : movies.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <FiHeart size={44} className="text-muted mb-3" />
          <h4 className="fw-bold mb-2">No favorite movies saved yet</h4>
          <p className="text-muted small mb-4">
            Click the heart icon on any movie page to keep track of movies you love.
          </p>
          <Link to="/movies" className="btn btn-cinema">
            Discover Movies
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {movies.map((movie) => (
            <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="position-relative">
                <MovieCard movie={movie} />
                <button
                  onClick={() => handleRemoveFavorite(movie._id)}
                  className="btn btn-cinema-danger btn-sm w-100 mt-2"
                  title="Remove from favorites"
                >
                  Remove Favorite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
