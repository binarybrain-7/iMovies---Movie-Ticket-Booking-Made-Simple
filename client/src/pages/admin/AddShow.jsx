import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { showService } from '../../services/showService';
import { movieService } from '../../services/movieService';
import { theatreService } from '../../services/theatreService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';

const AddShow = () => {
  const navigate = useNavigate();

  const [theatres, setTheatres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedTheatre, setSelectedTheatre] = useState('');
  const [selectedMovie, setSelectedMovie] = useState('');
  const [showDate, setShowDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [thRes, mvRes] = await Promise.all([
          theatreService.getTheatres({ activeOnly: 'true' }),
          movieService.getMovies({ limit: 100 }),
        ]);

        const thList = thRes.data.theatres || [];
        const mvList = mvRes.data.movies || [];

        setTheatres(thList);
        setMovies(mvList);

        if (thList.length > 0) setSelectedTheatre(thList[0]._id);
        if (mvList.length > 0) setSelectedMovie(mvList[0]._id);
      } catch (err) {
        console.error('Error loading theatres or movies:', err);
        toast.error('Failed to load theatres or movies');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTheatre || !selectedMovie || !showDate || !startTime) {
      toast.error('All fields are required');
      return;
    }

    try {
      setSubmitting(true);
      await showService.createShow({
        theatreId: selectedTheatre,
        movieId: selectedMovie,
        showDate,
        startTime,
      });

      toast.success('Show scheduled successfully!');
      navigate('/admin/shows');
    } catch (err) {
      toast.error(err.message || 'Failed to schedule show');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading venues and movie titles..." />;
  }

  return (
    <div className="admin-add-show container py-4" style={{ maxWidth: '640px' }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      {/* Title matching Screenshot 3: "Add Show" (Show in red) */}
      <h1 className="section-title mb-4">
        Add <span className="text-accent">Show</span>
      </h1>

      <div
        className="cinema-card p-4 p-md-5 shadow-lg"
        style={{
          backgroundColor: '#111827',
          border: '1px solid var(--color-border)',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Theatres Dropdown matching Screenshot 3 */}
          <div className="mb-3 text-start">
            <label className="cinema-label">Theatres</label>
            <select
              className="form-select cinema-select"
              value={selectedTheatre}
              onChange={(e) => setSelectedTheatre(e.target.value)}
              required
            >
              <option value="">Select Theatre</option>
              {theatres.map((th) => (
                <option key={th._id} value={th._id}>
                  {th.name} ({th.city})
                </option>
              ))}
            </select>
          </div>

          {/* Movies Dropdown matching Screenshot 3 */}
          <div className="mb-3 text-start">
            <label className="cinema-label">Movies</label>
            <select
              className="form-select cinema-select"
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
              required
            >
              <option value="">Select Movie</option>
              {movies.map((mv) => (
                <option key={mv._id} value={mv._id}>
                  {mv.title} ({mv.language})
                </option>
              ))}
            </select>
          </div>

          {/* Show Date matching Screenshot 3 */}
          <div className="mb-3 text-start">
            <label className="cinema-label">Show Date</label>
            <input
              type="date"
              className="form-control cinema-input"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              required
            />
          </div>

          {/* Showtime matching Screenshot 3 */}
          <div className="mb-4 text-start">
            <label className="cinema-label">Showtime</label>
            <input
              type="time"
              className="form-control cinema-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          {/* Submit Button matching Screenshot 3 */}
          <div className="text-center">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-cinema px-5 py-2"
              style={{ fontWeight: '600' }}
            >
              {submitting ? 'Scheduling...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddShow;
