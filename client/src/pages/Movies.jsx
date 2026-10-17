import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieService } from '../services/movieService';
import MovieCard from '../components/movies/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiSearch, FiFilter } from 'react-icons/fi';

const GENRES = ['All', 'Action', 'Drama', 'Comedy', 'Thriller', 'Horror', 'Fantasy', 'Sci-Fi', 'Historical'];
const LANGUAGES = ['All', 'Telugu', 'Hindi', 'English', 'Kannada', 'Tamil'];

const Movies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [status, setStatus] = useState('all');

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (genre !== 'All') params.genre = genre;
      if (language !== 'All') params.language = language;
      if (status !== 'all') params.status = status;

      const res = await movieService.getMovies(params);
      setMovies(res.data.movies || []);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [genre, language, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
    fetchMovies();
  };

  const handleClearFilters = () => {
    setSearch('');
    setGenre('All');
    setLanguage('All');
    setStatus('all');
    setSearchParams({});
  };

  return (
    <div className="movies-catalogue-page container py-4">
      {/* Red Banner Header matching Screenshot 4 */}
      <div className="cinema-red-banner shadow">
        Available Movies
      </div>

      {/* Filter and Search Bar */}
      <div className="cinema-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text cinema-input" style={{ borderColor: 'var(--color-border)' }}>
                <FiSearch />
              </span>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="Search by title, cast, or director..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-cinema px-3">
                Search
              </button>
            </div>
          </div>

          {/* Genre Dropdown */}
          <div className="col-6 col-md-2">
            <select
              className="form-select cinema-select"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g === 'All' ? 'All Genres' : g}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="col-6 col-md-2">
            <select
              className="form-select cinema-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l === 'All' ? 'All Languages' : l}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs */}
          <div className="col-12 col-md-3 d-flex gap-1 justify-content-md-end">
            <button
              type="button"
              className={`btn btn-sm ${status === 'all' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'now_showing' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('now_showing')}
            >
              Now Showing
            </button>
            <button
              type="button"
              className={`btn btn-sm ${status === 'upcoming' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setStatus('upcoming')}
            >
              Upcoming
            </button>
          </div>
        </form>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <LoadingSpinner message="Loading movie catalogue..." />
      ) : movies.length === 0 ? (
        <div className="cinema-card text-center py-5 my-4">
          <h4 className="fw-bold mb-2">No movies match your criteria</h4>
          <p className="text-muted small mb-4">
            Try adjusting your search terms, changing genre filters, or clearing all filters.
          </p>
          <button onClick={handleClearFilters} className="btn btn-cinema-secondary btn-sm">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {movies.map((movie) => (
            <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Movies;
