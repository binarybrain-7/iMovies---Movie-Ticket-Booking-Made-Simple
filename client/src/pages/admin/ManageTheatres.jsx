import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { theatreService } from '../../services/theatreService';
import EditTheatreModal from '../../components/admin/EditTheatreModal';
import TheatreDetailsModal from '../../components/admin/TheatreDetailsModal';
import EditScreenModal from '../../components/admin/EditScreenModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiArrowLeft,
  FiMapPin,
  FiTrash2,
  FiEdit2,
  FiInfo,
  FiMonitor,
  FiSearch,
  FiCalendar,
} from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const ManageTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addScreenModalOpen, setAddScreenModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTheatres = async () => {
    try {
      setLoading(true);
      const params = { activeOnly: 'false' };
      if (selectedCity !== 'all') params.city = selectedCity;
      if (search.trim()) params.search = search.trim();

      const res = await theatreService.getTheatres(params);
      setTheatres(res.data.theatres || []);
      if (res.data.cities) {
        setCities(res.data.cities);
      }
    } catch (err) {
      console.error('Error fetching theatres:', err);
      toast.error('Failed to load theatres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, [selectedCity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTheatres();
  };

  const handleOpenEdit = (th) => {
    setSelectedTheatre(th);
    setEditModalOpen(true);
  };

  const handleOpenDetails = (th) => {
    setSelectedTheatre(th);
    setDetailsModalOpen(true);
  };

  const handleOpenAddScreen = (th) => {
    setSelectedTheatre(th);
    setAddScreenModalOpen(true);
  };

  const handleOpenDelete = (th) => {
    setSelectedTheatre(th);
    setConfirmDeleteOpen(true);
  };

  const handleToggleStatus = async (th) => {
    try {
      const newStatus = !th.isActive;
      const res = await theatreService.updateTheatre(th._id, { isActive: newStatus });
      toast.success(`Theatre "${th.name}" ${newStatus ? 'activated' : 'deactivated'}`);
      setTheatres((prev) =>
        prev.map((t) => (t._id === th._id ? { ...t, isActive: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to toggle theatre status:', err);
      toast.error(err.message || 'Failed to update theatre status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTheatre) return;

    try {
      setDeleting(true);
      const res = await theatreService.deleteTheatre(selectedTheatre._id);

      if (res.data?.deactivated) {
        toast.info(res.message || 'Theatre deactivated to preserve customer booking history.');
        setTheatres((prev) =>
          prev.map((t) => (t._id === selectedTheatre._id ? { ...t, isActive: false } : t))
        );
      } else {
        toast.success('Theatre deleted successfully');
        setTheatres((prev) => prev.filter((t) => t._id !== selectedTheatre._id));
      }
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete theatre:', err);
      toast.error(err.message || 'Failed to delete theatre');
    } finally {
      setDeleting(false);
    }
  };

  const handleTheatreSaved = (savedTheatre) => {
    setTheatres((prev) =>
      prev.map((t) => (t._id === savedTheatre._id ? savedTheatre : t))
    );
  };

  return (
    <div className="admin-manage-theatres container py-4">
      {/* Top Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <Link to="/admin/add-theatre" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add Theatre
        </Link>
      </div>

      <h1 className="section-title text-start mb-4">
        Manage <span className="text-accent">Theatres & Venues</span>
      </h1>

      {/* Filter and Search Bar */}
      <div
        className="cinema-card p-3 mb-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <input
                type="text"
                placeholder="Search by theatre name, location..."
                className="form-control cinema-input form-control-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-cinema btn-sm px-3">
                <FiSearch />
              </button>
            </form>
          </div>

          <div className="col-12 col-md-4">
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3 text-md-end text-muted small">
            Total Venues: <strong>{theatres.length}</strong>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching cinema theatres..." />
      ) : theatres.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No theatres registered yet.</p>
          <Link to="/admin/add-theatre" className="btn btn-cinema btn-sm">
            Add Your First Theatre
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {theatres.map((th) => (
            <div key={th._id} className="col-12 col-md-6 col-lg-4">
              <div
                className="cinema-card p-3 h-100 d-flex flex-column"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
                    <FaTheaterMasks className="text-warning flex-shrink-0" size={20} />
                    <h5 className="fw-bold mb-0 text-white text-truncate" title={th.name}>
                      {th.name}
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(th)}
                    className={`badge border-0 ${th.isActive ? 'bg-success' : 'bg-secondary'}`}
                    style={{ cursor: 'pointer', fontSize: '0.72rem' }}
                    title="Click to toggle Active/Inactive"
                  >
                    {th.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Location */}
                <div className="small text-muted mb-1 d-flex align-items-center gap-1">
                  <FiMapPin size={13} className="text-danger flex-shrink-0" />
                  <span className="text-truncate">{th.location} ({th.city})</span>
                </div>

                {/* Address */}
                {th.address && (
                  <div className="small text-muted mb-2 text-truncate ps-3" title={th.address}>
                    {th.address}
                  </div>
                )}

                {/* Navigation Links */}
                <div className="d-flex gap-3 small mb-3 ps-3">
                  <Link to="/admin/add-show" className="text-danger text-decoration-none fw-semibold">
                    + Schedule Show
                  </Link>
                  <Link to={`/admin/screens?theatreId=${th._id}`} className="text-info text-decoration-none fw-semibold d-flex align-items-center gap-1">
                    <FiMonitor size={12} /> Screens
                  </Link>
                </div>

                {/* Card Action buttons */}
                <div
                  className="mt-auto pt-2 border-top d-flex gap-2"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(th)}
                    className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <FiInfo size={14} /> Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(th)}
                    className="btn btn-cinema-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 text-info"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(th)}
                    className="btn btn-cinema-danger btn-sm p-1 px-2 d-flex align-items-center justify-content-center"
                    title="Delete Theatre"
                    aria-label="Delete Theatre"
                    style={{ minWidth: '36px' }}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Theatre Modal */}
      <EditTheatreModal
        isOpen={editModalOpen}
        theatre={selectedTheatre}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleTheatreSaved}
      />

      {/* Theatre Details Modal */}
      <TheatreDetailsModal
        isOpen={detailsModalOpen}
        theatre={selectedTheatre}
        onClose={() => setDetailsModalOpen(false)}
        onOpenEdit={(th) => {
          setSelectedTheatre(th);
          setEditModalOpen(true);
        }}
        onAddScreen={(th) => {
          setSelectedTheatre(th);
          setAddScreenModalOpen(true);
        }}
      />

      {/* Add Screen directly for this theatre */}
      <EditScreenModal
        isOpen={addScreenModalOpen}
        screen={null}
        defaultTheatreId={selectedTheatre ? selectedTheatre._id : ''}
        onClose={() => setAddScreenModalOpen(false)}
        onSaved={() => {
          toast.success('Screen added to theatre successfully');
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Delete / Deactivate Theatre"
        message="Are you sure you want to delete this theatre?"
        itemName={selectedTheatre ? `"${selectedTheatre.name}" in ${selectedTheatre.city}` : ''}
        warningText="If this theatre has scheduled shows or existing customer bookings, it will be safely deactivated to protect ticket and payment history."
        confirmButtonText="Confirm Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default ManageTheatres;
