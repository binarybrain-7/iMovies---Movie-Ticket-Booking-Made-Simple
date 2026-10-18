import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { screenService } from '../../services/screenService';
import { theatreService } from '../../services/theatreService';
import EditScreenModal from '../../components/admin/EditScreenModal';
import ScreenDetailsModal from '../../components/admin/ScreenDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiArrowLeft,
  FiMonitor,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const ManageScreens = () => {
  const [screens, setScreens] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatre, setSelectedTheatre] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTheatres = async () => {
    try {
      const res = await theatreService.getTheatres({ activeOnly: 'false' });
      setTheatres(res.data.theatres || []);
    } catch (err) {
      console.error('Failed to load theatres for screens filter:', err);
    }
  };

  const fetchScreens = async () => {
    try {
      setLoading(true);
      const params = { activeOnly: 'false' };
      if (selectedTheatre !== 'all') params.theatreId = selectedTheatre;
      if (search.trim()) params.search = search.trim();

      const res = await screenService.getScreens(params);
      setScreens(res.data.screens || []);
    } catch (err) {
      console.error('Failed to load screens:', err);
      toast.error('Failed to load screen auditoriums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, []);

  useEffect(() => {
    fetchScreens();
  }, [selectedTheatre]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchScreens();
  };

  const handleOpenAdd = () => {
    setSelectedScreen(null);
    setEditModalOpen(true);
  };

  const handleOpenEdit = (sc) => {
    setSelectedScreen(sc);
    setEditModalOpen(true);
  };

  const handleOpenDetails = (sc) => {
    setSelectedScreen(sc);
    setDetailsModalOpen(true);
  };

  const handleOpenDelete = (sc) => {
    setSelectedScreen(sc);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedScreen) return;

    try {
      setDeleting(true);
      const res = await screenService.deleteScreen(selectedScreen._id);

      if (res.data?.deactivated) {
        toast.info(res.message || 'Screen deactivated to preserve existing customer bookings.');
        setScreens((prev) =>
          prev.map((s) => (s._id === selectedScreen._id ? { ...s, isActive: false } : s))
        );
      } else {
        toast.success('Screen deleted successfully');
        setScreens((prev) => prev.filter((s) => s._id !== selectedScreen._id));
      }
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete screen:', err);
      toast.error(err.message || 'Failed to remove screen');
    } finally {
      setDeleting(false);
    }
  };

  const handleScreenSaved = (savedScreen) => {
    if (selectedScreen && selectedScreen._id) {
      // Updated existing screen
      setScreens((prev) =>
        prev.map((s) => (s._id === savedScreen._id ? savedScreen : s))
      );
    } else {
      // Added new screen
      setScreens((prev) => [savedScreen, ...prev]);
    }
  };

  return (
    <div className="admin-manage-screens container py-4">
      {/* Top Navigation */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <button
          onClick={handleOpenAdd}
          className="btn btn-cinema btn-sm d-flex align-items-center gap-1"
        >
          <FiPlus /> Add New Screen
        </button>
      </div>

      <h1 className="section-title text-start mb-4">
        Manage <span className="text-accent">Screens</span>
      </h1>

      {/* Filter and Search Bar */}
      <div className="cinema-card p-3 mb-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <input
                type="text"
                placeholder="Search screen name..."
                className="form-control cinema-input form-control-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-cinema btn-sm px-3">
                <FiSearch />
              </button>
            </form>
          </div>

          <div className="col-12 col-md-5">
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedTheatre}
              onChange={(e) => setSelectedTheatre(e.target.value)}
            >
              <option value="all">All Theatres / Venues</option>
              {theatres.map((th) => (
                <option key={th._id} value={th._id}>
                  {th.name} ({th.city})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-2 text-md-end text-muted small">
            Total: <strong>{screens.length}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching cinema auditoriums..." />
      ) : screens.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No screens found matching the selected filter.</p>
          <button onClick={handleOpenAdd} className="btn btn-cinema btn-sm">
            Add First Screen
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {screens.map((sc) => {
            const theatre = sc.theatreId || {};
            const cats = sc.seatCategories || {};
            return (
              <div key={sc._id} className="col-12 col-md-6 col-lg-4">
                <div className="cinema-card p-3 h-100 d-flex flex-column" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  {/* Card Header */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <FiMonitor className="text-info flex-shrink-0" size={18} />
                      <h5 className="fw-bold mb-0 text-white">{sc.name}</h5>
                    </div>
                    <span className={`badge ${sc.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                      {sc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Associated Theatre Name */}
                  <div className="small text-muted mb-2 d-flex align-items-center gap-1">
                    <FaTheaterMasks className="text-warning flex-shrink-0" size={13} />
                    <span className="text-truncate">
                      {theatre.name || 'Unassigned Venue'} {theatre.city ? `(${theatre.city})` : ''}
                    </span>
                  </div>

                  {/* Total Seats */}
                  <div className="small text-light mb-3 d-flex align-items-center gap-1">
                    <FiUsers className="text-danger flex-shrink-0" size={13} />
                    <span>Capacity: <strong>{sc.totalSeats || 120}</strong> seats</span>
                  </div>

                  {/* Categories Pills */}
                  <div className="p-2 rounded mb-3 small" style={{ backgroundColor: '#0B0F17' }}>
                    <div className="text-muted d-flex justify-content-between">
                      <span>Balcony: ₹{cats.balcony?.price || 250}</span>
                      <span>Middle: ₹{cats.middle?.price || 180}</span>
                      <span>Lower: ₹{cats.lower?.price || 120}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-auto pt-2 border-top d-flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(sc)}
                      className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <FiInfo size={14} /> Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sc)}
                      className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 text-info"
                      style={{ fontSize: '0.78rem' }}
                    >
                      <FiEdit2 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(sc)}
                      className="btn btn-cinema-danger btn-sm p-1 px-2 d-flex align-items-center justify-content-center"
                      title="Delete Screen"
                      aria-label="Delete Screen"
                      style={{ minWidth: '36px' }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Screen Modal */}
      <EditScreenModal
        isOpen={editModalOpen}
        screen={selectedScreen}
        defaultTheatreId={selectedTheatre !== 'all' ? selectedTheatre : ''}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleScreenSaved}
      />

      {/* Screen Details Modal */}
      <ScreenDetailsModal
        isOpen={detailsModalOpen}
        screen={selectedScreen}
        onClose={() => setDetailsModalOpen(false)}
        onOpenEdit={(sc) => {
          setSelectedScreen(sc);
          setEditModalOpen(true);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Delete Screen"
        message="Are you sure you want to delete this screen auditorium?"
        itemName={selectedScreen ? `${selectedScreen.name} (${selectedScreen.theatreId?.name || 'Venue'})` : ''}
        warningText="If active shows or customer bookings exist on this screen, it will be safely deactivated instead of permanently deleted to preserve ticket history."
        confirmButtonText="Confirm Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default ManageScreens;
