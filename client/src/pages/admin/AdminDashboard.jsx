import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { showService } from '../../services/showService';
import AdminShowCard from '../../components/admin/AdminShowCard';
import EditShowModal from '../../components/admin/EditShowModal';
import ShowDetailsModal from '../../components/admin/ShowDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
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
  FiMonitor,
} from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentShows, setRecentShows] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Show management modals
  const [editShowModalOpen, setEditShowModalOpen] = useState(false);
  const [detailsShowModalOpen, setDetailsShowModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleOpenEditShow = (show) => {
    setSelectedShow(show);
    setEditShowModalOpen(true);
  };

  const handleOpenDetailsShow = (show) => {
    setSelectedShow(show);
    setDetailsShowModalOpen(true);
  };

  const handleOpenDeleteShow = (show) => {
    setSelectedShow(show);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDeleteShow = async () => {
    if (!selectedShow) return;

    try {
      setDeleting(true);
      const res = await showService.deleteShow(selectedShow._id);

      if (res.data?.cancelled) {
        toast.info(res.message || 'Show cancelled. Existing customer booking records were preserved.');
        setRecentShows((prev) =>
          prev.map((s) => (s._id === selectedShow._id ? { ...s, status: 'cancelled' } : s))
        );
      } else {
        toast.success('Show deleted successfully');
        setRecentShows((prev) => prev.filter((s) => s._id !== selectedShow._id));
      }

      setConfirmDeleteOpen(false);
      // Soft refresh stats in background
      adminService.getDashboard().then((r) => setStats(r.data.stats)).catch(() => {});
    } catch (err) {
      console.error('Failed to delete/cancel show:', err);
      toast.error(err.message || 'Failed to cancel show');
    } finally {
      setDeleting(false);
    }
  };

  const handleShowSaved = (updatedShow) => {
    // Update local state immediately without full page reload
    setRecentShows((prev) =>
      prev.map((s) => (s._id === updatedShow._id ? updatedShow : s))
    );
    // Soft refresh stats in background
    adminService.getDashboard().then((r) => setStats(r.data.stats)).catch(() => {});
  };

  if (loading) {
    return <LoadingSpinner message="Loading administration telemetry..." />;
  }

  const deleteItemName = selectedShow
    ? `Show for "${selectedShow.movieId?.title || 'Movie'}" at ${selectedShow.theatreId?.name || 'Theatre'} on ${selectedShow.showDate} at ${selectedShow.startTime}`
    : '';

  return (
    <div className="admin-dashboard-page container py-4">
      {/* KPI Stats Overview Cards */}
      <div className="row g-3 mb-4">
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
        <Link to="/admin/manage-movies" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiFilm /> Manage Movies
        </Link>
        <Link to="/admin/theatres" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FaTheaterMasks /> Manage Theatres
        </Link>
        <Link to="/admin/screens" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiMonitor /> Manage Screens
        </Link>
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

      {/* ADMIN SHOWS SECTION */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title text-start mb-0">
            Admin <span className="text-accent">Shows</span>
          </h2>
          <Link to="/admin/shows" className="btn btn-cinema-secondary btn-sm">
            View All Shows
          </Link>
        </div>

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
                <AdminShowCard
                  show={show}
                  onViewDetails={handleOpenDetailsShow}
                  onEdit={handleOpenEditShow}
                  onDelete={handleOpenDeleteShow}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ALL BOOKINGS SECTION */}
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

      {/* Edit Show Modal */}
      <EditShowModal
        isOpen={editShowModalOpen}
        show={selectedShow}
        onClose={() => setEditShowModalOpen(false)}
        onSaved={handleShowSaved}
      />

      {/* Show Details Modal */}
      <ShowDetailsModal
        isOpen={detailsShowModalOpen}
        show={selectedShow}
        onClose={() => setDetailsShowModalOpen(false)}
        onOpenEdit={(s) => {
          setSelectedShow(s);
          setEditShowModalOpen(true);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Delete / Cancel Show"
        message="Are you sure you want to delete this show schedule?"
        itemName={deleteItemName}
        warningText="If this show has existing customer bookings, it will be safely cancelled without erasing customer tickets or financial transaction history."
        confirmButtonText="Confirm Delete"
        loading={deleting}
        onConfirm={handleConfirmDeleteShow}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
