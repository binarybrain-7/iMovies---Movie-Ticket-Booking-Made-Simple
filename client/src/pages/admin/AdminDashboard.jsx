import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { showService } from '../../services/showService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiFilm,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiPlus,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentShows, setRecentShows] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingShowId, setDeletingShowId] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await adminService.getDashboard();
      setStats(res.data.stats);
      setRecentShows(res.data.recentShows || []);
      setRecentBookings(res.data.recentBookings || []);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
      toast.error('Error fetching admin statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteShow = async (showId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to cancel the show for "${movieTitle}"?`)) return;

    try {
      setDeletingShowId(showId);
      await showService.deleteShow(showId);
      toast.success('Show cancelled successfully');
      setRecentShows((prev) => prev.filter((s) => s._id !== showId));
    } catch (err) {
      toast.error(err.message || 'Failed to cancel show');
    } finally {
      setDeletingShowId('');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading administration telemetry..." />;
  }

  return (
    <div className="admin-dashboard-page container py-4">
      {/* KPI Stats Overview Cards */}
      <div className="row g-3 mb-5">
        <div className="col-6 col-md-3">
          <div className="cinema-card p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Total Users</span>
              <FiUsers className="text-primary" size={20} />
            </div>
            <h3 className="fw-bold mb-0">{stats?.totalUsers || 0}</h3>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="cinema-card p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Active Movies</span>
              <FiFilm className="text-danger" size={20} />
            </div>
            <h3 className="fw-bold mb-0">{stats?.totalMovies || 0}</h3>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="cinema-card p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Venues</span>
              <FaTheaterMasks className="text-warning" size={20} />
            </div>
            <h3 className="fw-bold mb-0">{stats?.activeTheatres || 0}</h3>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="cinema-card p-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="small text-muted">Net Revenue</span>
              <FiTrendingUp className="text-success" size={20} />
            </div>
            <h3 className="fw-bold mb-0 text-success">₹{stats?.netRevenue || 0}</h3>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="d-flex flex-wrap gap-2 mb-4 justify-content-end">
        <Link to="/admin/add-movie" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add Movie
        </Link>
        <Link to="/admin/add-theatre" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add Theatre
        </Link>
        <Link to="/admin/add-show" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add Show
        </Link>
        <Link to="/admin/revenue" className="btn btn-cinema-secondary btn-sm">
          Revenue Reports
        </Link>
      </div>

      {/* ADMIN SHOWS SECTION (SCREENSHOT 2) */}
      <section className="mb-5">
        <h2 className="section-title text-start mb-4">
          Admin <span className="text-accent">Shows</span>
        </h2>

        {recentShows.length === 0 ? (
          <div className="cinema-card text-center py-4">
            <p className="text-muted small mb-3">No active show schedules found.</p>
            <Link to="/admin/add-show" className="btn btn-cinema btn-sm">
              Schedule First Show
            </Link>
          </div>
        ) : (
          <div className="row g-3">
            {recentShows.map((show) => (
              <div key={show._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                {/* Show card matching Screenshot 2:
                    Movie: Og
                    Theatre: Srinivasa
                    Showdate: Sep 25, 2025
                    Showtime: 2:00 PM
                    Delete button with red outline and trash icon
                */}
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
                      disabled={deletingShowId === show._id}
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
      </section>

      {/* ALL BOOKINGS SECTION (SCREENSHOT 2) */}
      <section>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title text-start mb-0">
            All <span className="text-accent">Bookings</span>
          </h2>
          <Link to="/admin/bookings" className="btn btn-cinema-secondary btn-sm">
            View All ({stats?.totalBookings || 0})
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="cinema-card text-center py-4">
            <p className="text-muted small mb-0">No booking transactions recorded yet.</p>
          </div>
        ) : (
          <div className="row g-3">
            {recentBookings.map((b) => (
              <div key={b._id} className="col-12 col-md-6">
                <div
                  className="cinema-card p-3 d-flex flex-column"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="small">
                      <FiUsers className="text-muted me-1" />
                      <strong>User: </strong>
                      <span className="text-info">{b.userId?.email || 'Customer'}</span>
                    </div>
                    <span
                      className={`badge small ${
                        b.status === 'CONFIRMED'
                          ? 'bg-success'
                          : b.status === 'CANCELLED'
                          ? 'bg-danger'
                          : 'bg-warning text-dark'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="small text-muted mb-1">
                    Movie: <strong className="text-white">{b.showId?.movieId?.title}</strong> ({b.showId?.theatreId?.name})
                  </div>

                  <div className="d-flex justify-content-between small text-muted">
                    <span>Seats: {b.seats?.map((s) => s.seatNumber).join(', ')}</span>
                    <strong className="text-white">₹{b.totalAmount}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
