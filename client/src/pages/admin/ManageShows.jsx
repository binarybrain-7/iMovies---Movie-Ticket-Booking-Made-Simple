import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { showService } from '../../services/showService';
import { theatreService } from '../../services/theatreService';
import { movieService } from '../../services/movieService';
import AdminShowCard from '../../components/admin/AdminShowCard';
import EditShowModal from '../../components/admin/EditShowModal';
import ShowDetailsModal from '../../components/admin/ShowDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FiPlus, FiArrowLeft, FiFilter, FiCalendar, FiSearch } from 'react-icons/fi';
import { FaTheaterMasks } from 'react-icons/fa';

const ManageShows = () => {
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [movies, setMovies] = useState([]);

  // Filters
  const [selectedTheatre, setSelectedTheatre] = useState('all');
  const [selectedMovie, setSelectedMovie] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [loading, setLoading] = useState(true);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFilters = async () => {
    try {
      const [thRes, mvRes] = await Promise.all([
        theatreService.getTheatres({ activeOnly: 'false' }),
        movieService.getMovies({ limit: 100 }),
      ]);
      setTheatres(thRes.data.theatres || []);
      setMovies(mvRes.data.movies || []);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const fetchShows = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedTheatre !== 'all') params.theatreId = selectedTheatre;
      if (selectedMovie !== 'all') params.movieId = selectedMovie;
      if (selectedDate) params.showDate = selectedDate;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await showService.getShows(params);
      setShows(res.data.shows || []);
    } catch (err) {
      console.error('Failed to load shows:', err);
      toast.error('Failed to load shows schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [selectedTheatre, selectedMovie, selectedDate, selectedStatus]);

  const handleOpenEdit = (show) => {
    setSelectedShow(show);
    setEditModalOpen(true);
  };

  const handleOpenDetails = (show) => {
    setSelectedShow(show);
    setDetailsModalOpen(true);
  };

  const handleOpenDelete = (show) => {
    setSelectedShow(show);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedShow) return;

    try {
      setDeleting(true);
      const res = await showService.deleteShow(selectedShow._id);

      if (res.data?.cancelled) {
        toast.info(res.message || 'Show cancelled. Customer booking records were preserved.');
        setShows((prev) =>
          prev.map((s) => (s._id === selectedShow._id ? { ...s, status: 'cancelled' } : s))
        );
      } else {
        toast.success('Show deleted successfully');
        setShows((prev) => prev.filter((s) => s._id !== selectedShow._id));
      }
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete show:', err);
      toast.error(err.message || 'Failed to cancel show');
    } finally {
      setDeleting(false);
    }
  };

  const handleShowSaved = (updatedShow) => {
    setShows((prev) =>
      prev.map((s) => (s._id === updatedShow._id ? updatedShow : s))
    );
  };

  const deleteItemName = selectedShow
    ? `Show for "${selectedShow.movieId?.title || 'Movie'}" at ${selectedShow.theatreId?.name || 'Theatre'} on ${selectedShow.showDate} at ${selectedShow.startTime}`
    : '';

  return (
    <div className="admin-manage-shows container py-4">
      {/* Top action bar */}
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

      {/* Filter Toolbar */}
      <div
        className="cinema-card p-3 mb-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="row g-2 align-items-center">
          <div className="col-12 col-sm-6 col-md-3">
            <label className="cinema-label small mb-1">Filter by Theatre</label>
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedTheatre}
              onChange={(e) => setSelectedTheatre(e.target.value)}
            >
              <option value="all">All Theatres</option>
              {theatres.map((th) => (
                <option key={th._id} value={th._id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-3">
            <label className="cinema-label small mb-1">Filter by Movie</label>
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
            >
              <option value="all">All Movies</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="cinema-label small mb-1">Show Date</label>
            <input
              type="date"
              className="form-control cinema-input form-control-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="col-6 col-md-3">
            <label className="cinema-label small mb-1">Status</label>
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {(selectedTheatre !== 'all' || selectedMovie !== 'all' || selectedDate || selectedStatus !== 'all') && (
          <div className="mt-2 text-end">
            <button
              type="button"
              className="btn btn-link btn-sm text-danger text-decoration-none p-0 small"
              onClick={() => {
                setSelectedTheatre('all');
                setSelectedMovie('all');
                setSelectedDate('');
                setSelectedStatus('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching cinema schedules..." />
      ) : shows.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No show schedules found matching your filters.</p>
          <Link to="/admin/add-show" className="btn btn-cinema btn-sm">
            Schedule a Show
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          {shows.map((show) => (
            <div key={show._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <AdminShowCard
                show={show}
                onViewDetails={handleOpenDetails}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Show Modal */}
      <EditShowModal
        isOpen={editModalOpen}
        show={selectedShow}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleShowSaved}
      />

      {/* Show Details Modal */}
      <ShowDetailsModal
        isOpen={detailsModalOpen}
        show={selectedShow}
        onClose={() => setDetailsModalOpen(false)}
        onOpenEdit={(s) => {
          setSelectedShow(s);
          setEditModalOpen(true);
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
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
};

export default ManageShows;
