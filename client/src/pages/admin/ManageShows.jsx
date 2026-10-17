import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { showService } from '../../services/showService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiPlus, FiArrowLeft, FiFilm, FiTrash2, FiClock, FiCalendar } from 'react-icons/fi';

const ManageShows = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShows = async () => {
    try {
      setLoading(true);
      const res = await showService.getShows();
      setShows(res.data.shows || []);
    } catch (err) {
      console.error('Failed to load shows:', err);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  const handleDeleteShow = async (showId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to cancel the show for "${movieTitle}"?`)) return;

    try {
      await showService.deleteShow(showId);
      toast.success('Show cancelled successfully');
      setShows((prev) => prev.filter((s) => s._id !== showId));
    } catch (err) {
      toast.error(err.message || 'Failed to cancel show');
    }
  };

  return (
    <div className="admin-manage-shows container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <Link to="/admin/add-show" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Schedule New Show
        </Link>
      </div>

      <h1 className="section-title text-start mb-4">
        Admin <span className="text-accent">Shows</span>
      </h1>

      {loading ? (
        <LoadingSpinner message="Fetching cinema schedules..." />
      ) : shows.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No shows scheduled yet.</p>
          <Link to="/admin/add-show" className="btn btn-cinema btn-sm">
            Schedule a Show
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {shows.map((show) => (
            <div key={show._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div
                className="cinema-card p-3 d-flex flex-column h-100"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FiFilm className="text-danger flex-shrink-0" />
                  <span className="small text-muted">Movie: </span>
                  <strong className="text-truncate" title={show.movieId?.title}>
                    {show.movieId?.title || 'Unknown'}
                  </strong>
                </div>

                <div className="small text-muted mb-1 ps-4">
                  Theatre: <span style={{ color: 'var(--color-text)' }}>{show.theatreId?.name}</span>
                </div>

                <div className="small text-muted mb-1 ps-4">
                  Showdate: <span style={{ color: 'var(--color-text)' }}>{show.showDate}</span>
                </div>

                <div className="small text-muted mb-3 ps-4">
                  Showtime: <span style={{ color: 'var(--color-text)' }}>{show.startTime}</span>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => handleDeleteShow(show._id, show.movieId?.title)}
                    className="btn btn-cinema-danger w-100 d-flex align-items-center justify-content-center"
                    title="Cancel Show"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageShows;
