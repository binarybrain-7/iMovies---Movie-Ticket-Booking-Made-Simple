import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { showService } from '../services/showService';
import { movieService } from '../services/movieService';
import { theatreService } from '../services/theatreService';
import { useBooking } from '../context/BookingContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiCalendar, FiMapPin, FiClock, FiFilm, FiArrowLeft } from 'react-icons/fi';

const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SelectShow = () => {
  const [searchParams] = useSearchParams();
  const movieId = searchParams.get('movieId');
  const navigate = useNavigate();
  const { setSelectedShow, setSelectedMovie } = useBooking();

  const [movie, setMovie] = useState(null);
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate date tabs for next 6 days using local calendar dates
  const dateTabs = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = formatLocalDate(d);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dateStr, dayName, formatted };
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        if (movieId) {
          const movieRes = await movieService.getMovieById(movieId);
          setMovie(movieRes.data.movie);
          setSelectedMovie(movieRes.data.movie);
        }

        const theatreRes = await theatreService.getTheatres();
        setTheatres(theatreRes.data.theatres || []);
        setCities(theatreRes.data.cities || []);
      } catch (err) {
        console.error('Error loading show selection data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [movieId]);

  // Fetch shows when filters change
  useEffect(() => {
    const fetchShows = async () => {
      try {
        setLoading(true);
        const params = { showDate: selectedDate };
        if (movieId) params.movieId = movieId;
        if (selectedCity !== 'all') params.city = selectedCity;

        const res = await showService.getShows(params);
        setShows(res.data.shows || []);
      } catch (err) {
        console.error('Error fetching shows:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShows();
  }, [movieId, selectedDate, selectedCity]);

  // Group shows by Theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const thId = show.theatreId?._id || 'unknown';
    if (!acc[thId]) {
      acc[thId] = {
        theatre: show.theatreId,
        shows: [],
      };
    }
    acc[thId].shows.push(show);
    return acc;
  }, {});

  const handleSelectShowtime = (show) => {
    setSelectedShow(show);
    navigate(`/seat-selection?showId=${show._id}`);
  };

  return (
    <div className="select-show-page container py-4">
      {/* Top Breadcrumb & Movie Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back
        </button>
        {movie && (
          <div className="d-flex align-items-center gap-3">
            {movie.posterUrl && (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                style={{
                  width: '54px',
                  height: '75px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
              />
            )}
            <div>
              <h2 className="h4 fw-bold mb-1" style={{ color: 'var(--color-text)' }}>
                {movie.title}
              </h2>
              <div className="small text-muted d-flex flex-wrap align-items-center gap-2">
                <span className="badge bg-secondary">{movie.certification || 'UA'}</span>
                <span>{movie.language}</span>
                <span>•</span>
                <span>{movie.runtimeMinutes} min</span>
                {movie.genres && (
                  <>
                    <span>•</span>
                    <span>{Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Selection Bar */}
      <div className="cinema-card p-3 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          {/* Date Tabs */}
          <div className="d-flex gap-2 overflow-auto py-1">
            {dateTabs.map((tab) => {
              const active = selectedDate === tab.dateStr;
              return (
                <button
                  key={tab.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(tab.dateStr)}
                  className={`btn text-center px-3 py-2 ${
                    active ? 'btn-cinema' : 'btn-cinema-secondary'
                  }`}
                  style={{ minWidth: '85px', borderRadius: 'var(--radius-sm)' }}
                >
                  <div className="small fw-bold">{tab.dayName}</div>
                  <div style={{ fontSize: '0.8rem', opacity: active ? 1 : 0.8 }}>{tab.formatted}</div>
                </button>
              );
            })}
          </div>

          {/* City Location Filter */}
          <div className="d-flex align-items-center gap-2">
            <FiMapPin className="text-danger" />
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="all">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Showtimes by Theatre */}
      {loading ? (
        <LoadingSpinner message="Checking available showtimes..." />
      ) : Object.keys(showsByTheatre).length === 0 ? (
        <div className="cinema-card text-center py-5 my-4">
          <h4 className="fw-bold mb-2">No shows scheduled for this date</h4>
          <p className="text-muted small mb-3">
            Please choose another date or city to see available cinema schedules.
          </p>
          <button
            onClick={() => setSelectedDate(formatLocalDate(new Date()))}
            className="btn btn-cinema-secondary btn-sm"
          >
            Check Today's Shows
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {Object.values(showsByTheatre).map(({ theatre, shows: theatreShows }) => (
            <div key={theatre?._id} className="cinema-card p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start border-bottom pb-3 mb-3" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <h4 className="h5 fw-bold mb-1" style={{ color: 'var(--color-text)' }}>
                    {theatre?.name}
                  </h4>
                  <div className="small text-muted d-flex align-items-center gap-1">
                    <FiMapPin size={12} /> {theatre?.location} ({theatre?.city})
                  </div>
                </div>

                <div className="small text-muted mt-2 mt-sm-0">
                  <span>Price: ₹{theatreShows[0]?.seatPricing?.Lower || 120} - ₹{theatreShows[0]?.seatPricing?.Balcony || 250}</span>
                </div>
              </div>

              {/* Showtimes Pills */}
              <div className="d-flex flex-wrap gap-3">
                {theatreShows.map((show) => (
                  <button
                    key={show._id}
                    onClick={() => handleSelectShowtime(show)}
                    className="btn btn-cinema-secondary px-3 py-2 text-center"
                    style={{ minWidth: '105px' }}
                  >
                    <div className="fw-bold fs-6" style={{ color: 'var(--color-primary)' }}>
                      {show.startTime}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {show.screenId?.name || 'Screen 1'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectShow;
