import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import MovieCard from '../../components/movies/MovieCard';
import EditMovieModal from '../../components/admin/EditMovieModal';
import MovieDetailsModal from '../../components/admin/MovieDetailsModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  FiPlus,
  FiArrowLeft,
  FiImage,
  FiUploadCloud,
  FiCheckCircle,
  FiX,
  FiFolder,
  FiLink,
  FiSearch,
  FiGrid,
  FiList,
  FiEdit2,
  FiTrash2,
  FiInfo,
} from 'react-icons/fi';

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick Poster Update Modal State
  const [posterModalMovie, setPosterModalMovie] = useState(null);
  const [modalUploadMode, setModalUploadMode] = useState('file'); // 'file' or 'url'
  const [modalPosterFile, setModalPosterFile] = useState(null);
  const [modalPosterUrl, setModalPosterUrl] = useState('');
  const [modalPreviewUrl, setModalPreviewUrl] = useState('');
  const [savingPoster, setSavingPoster] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const modalFileInputRef = useRef(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = { limit: 100, sort: sortBy };
      if (search.trim()) params.search = search.trim();
      if (selectedGenre !== 'all') params.genre = selectedGenre;
      if (selectedLanguage !== 'all') params.language = selectedLanguage;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const res = await movieService.getMovies(params);
      setMovies(res.data.movies || []);
    } catch (err) {
      console.error('Failed to load movies:', err);
      toast.error('Failed to load movie catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre, selectedLanguage, selectedStatus, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  // Movie Edit & Details handlers
  const handleOpenEdit = (movie) => {
    setSelectedMovie(movie);
    setEditModalOpen(true);
  };

  const handleOpenDetails = (movie) => {
    setSelectedMovie(movie);
    setDetailsModalOpen(true);
  };

  const handleOpenDelete = (movie) => {
    setSelectedMovie(movie);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMovie) return;

    try {
      setDeleting(true);
      const res = await movieService.deleteMovie(selectedMovie._id);

      if (res.data?.archived) {
        toast.info(res.message || `Movie "${selectedMovie.title}" archived because historical shows or customer bookings exist.`);
        setMovies((prev) =>
          prev.map((m) => (m._id === selectedMovie._id ? { ...m, status: 'archived' } : m))
        );
      } else {
        toast.success(`Movie "${selectedMovie.title}" deleted successfully`);
        setMovies((prev) => prev.filter((m) => m._id !== selectedMovie._id));
      }
      setConfirmDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete movie:', err);
      toast.error(err.message || 'Failed to remove movie');
    } finally {
      setDeleting(false);
    }
  };

  const handleMovieSaved = (savedMovie) => {
    setMovies((prev) =>
      prev.map((m) => (m._id === savedMovie._id ? savedMovie : m))
    );
  };

  // Quick Poster Modal handlers
  const handleOpenEditPoster = (movie) => {
    setPosterModalMovie(movie);
    setModalUploadMode('file');
    setModalPosterFile(null);
    setModalPosterUrl(movie.posterUrl || '');
    setModalPreviewUrl(movie.posterUrl || '');
  };

  const handleClosePosterModal = () => {
    if (modalPreviewUrl && modalPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(modalPreviewUrl);
    }
    setPosterModalMovie(null);
    setModalPosterFile(null);
    setModalPosterUrl('');
    setModalPreviewUrl('');
    setSavingPoster(false);
  };

  const handleModalFileSelect = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP, or GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    if (modalPreviewUrl && modalPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(modalPreviewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setModalPosterFile(file);
    setModalPreviewUrl(objectUrl);
  };

  const handleSavePoster = async (e) => {
    e.preventDefault();
    if (!posterModalMovie) return;

    let finalPosterUrl = '';

    try {
      setSavingPoster(true);

      if (modalUploadMode === 'file' && modalPosterFile) {
        toast.info('Uploading new poster from your device...');
        const uploadRes = await movieService.uploadPoster(modalPosterFile);
        finalPosterUrl = uploadRes.data?.url || uploadRes.url;
      } else if (modalPosterUrl.trim()) {
        finalPosterUrl = modalPosterUrl.trim();
      } else {
        toast.error('Please select an image file or provide an image URL');
        setSavingPoster(false);
        return;
      }

      await movieService.updateMovie(posterModalMovie._id, { posterUrl: finalPosterUrl });

      // Update local state immediately
      setMovies((prev) =>
        prev.map((m) =>
          m._id === posterModalMovie._id ? { ...m, posterUrl: finalPosterUrl } : m
        )
      );

      toast.success(`Poster updated for "${posterModalMovie.title}"!`);
      handleClosePosterModal();
    } catch (err) {
      console.error('Failed to update poster:', err);
      toast.error(err.message || 'Failed to update poster');
    } finally {
      setSavingPoster(false);
    }
  };

  return (
    <div className="admin-manage-movies container py-4 position-relative">
      {/* Top Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <Link to="/admin/add-movie" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add New Movie
        </Link>
      </div>

      {/* Red Banner Header matching original visual aesthetic */}
      <div className="cinema-red-banner shadow mb-4">
        Available Movies Management
      </div>

      {/* Filter and Search Bar */}
      <div className="cinema-card p-3 mb-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="row g-2 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-4">
            <form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <input
                type="text"
                placeholder="Search movies by title, cast, genre..."
                className="form-control cinema-input form-control-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-cinema btn-sm px-3">
                <FiSearch />
              </button>
            </form>
          </div>

          {/* Genre Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="all">All Genres</option>
              <option value="Action">Action</option>
              <option value="Thriller">Thriller</option>
              <option value="Drama">Drama</option>
              <option value="Comedy">Comedy</option>
              <option value="Crime">Crime</option>
              <option value="Historical">Historical</option>
            </select>
          </div>

          {/* Language Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">All Languages</option>
              <option value="Hindi">Hindi</option>
              <option value="Telugu">Telugu</option>
              <option value="Tamil">Tamil</option>
              <option value="English">English</option>
              <option value="Kannada">Kannada</option>
              <option value="Malayalam">Malayalam</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select cinema-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="now_showing">Now Showing</option>
              <option value="upcoming">Upcoming</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="col-6 col-md-2 d-flex justify-content-end gap-1">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <FiGrid />
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching movies catalogue..." />
      ) : movies.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No movies in database matching your query.</p>
          <Link to="/admin/add-movie" className="btn btn-cinema btn-sm">
            Add Your First Movie
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="row g-4">
          {movies.map((movie) => (
            <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <MovieCard
                movie={movie}
                isAdmin={true}
                onDelete={handleOpenDelete}
                onEdit={handleOpenEdit}
                onViewDetails={handleOpenDetails}
                onEditPoster={handleOpenEditPoster}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="cinema-card p-0 overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                  <th scope="col" style={{ width: '60px' }}>Poster</th>
                  <th scope="col">Title</th>
                  <th scope="col">Genres</th>
                  <th scope="col">Language</th>
                  <th scope="col">Runtime</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m._id} className="border-bottom" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                    <td>
                      <div
                        className="rounded overflow-hidden"
                        style={{ width: '40px', height: '58px', backgroundColor: '#0B0F17' }}
                      >
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>
                    <td>
                      <strong className="text-white d-block">{m.title}</strong>
                      <span className="small text-muted">{m.certification || 'UA'}</span>
                    </td>
                    <td>
                      <span className="small text-muted">
                        {Array.isArray(m.genres) ? m.genres.join(', ') : m.genres}
                      </span>
                    </td>
                    <td><span className="badge bg-dark border text-light">{m.language}</span></td>
                    <td><span className="small text-muted">{m.runtimeMinutes} min</span></td>
                    <td>
                      <span
                        className={`badge small ${
                          m.status === 'now_showing'
                            ? 'bg-success'
                            : m.status === 'upcoming'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(m)}
                          className="btn btn-cinema-secondary btn-sm p-1 px-2"
                          title="View Details"
                        >
                          <FiInfo size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(m)}
                          className="btn btn-cinema-secondary btn-sm p-1 px-2 text-info"
                          title="Edit Movie"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditPoster(m)}
                          className="btn btn-cinema-secondary btn-sm p-1 px-2 text-warning"
                          title="Change Poster"
                        >
                          <FiImage size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(m)}
                          className="btn btn-cinema-danger btn-sm p-1 px-2"
                          title="Delete Movie"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Movie Modal */}
      <EditMovieModal
        isOpen={editModalOpen}
        movie={selectedMovie}
        onClose={() => setEditModalOpen(false)}
        onSaved={handleMovieSaved}
      />

      {/* Movie Details Modal */}
      <MovieDetailsModal
        isOpen={detailsModalOpen}
        movie={selectedMovie}
        onClose={() => setDetailsModalOpen(false)}
        onOpenEdit={(m) => {
          setSelectedMovie(m);
          setEditModalOpen(true);
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Delete / Archive Movie"
        message="Are you sure you want to delete this movie from the catalogue?"
        itemName={selectedMovie ? `"${selectedMovie.title}" (${selectedMovie.language})` : ''}
        warningText="If this movie has existing scheduled shows or customer booking records, it will be safely archived rather than hard deleted to preserve ticket history."
        confirmButtonText="Confirm Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />

      {/* Quick Poster Update Modal */}
      {posterModalMovie && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1055,
            backdropFilter: 'blur(4px)',
          }}
          onClick={handleClosePosterModal}
        >
          <div
            className="cinema-card p-4 mx-3"
            style={{
              maxWidth: '540px',
              width: '100%',
              backgroundColor: '#111827',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="modal-title mb-0 text-light fw-bold">
                Update Poster: <span className="text-danger">{posterModalMovie.title}</span>
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1 rounded-circle"
                style={{ width: '28px', height: '28px' }}
                onClick={handleClosePosterModal}
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Poster Preview */}
            <div className="text-center my-3">
              <div
                className="d-inline-flex flex-column align-items-center justify-content-center rounded overflow-hidden shadow-sm"
                style={{
                  width: '150px',
                  height: '210px',
                  border: '2px solid #E50914',
                  backgroundColor: '#08090D',
                }}
              >
                {modalPreviewUrl ? (
                  <img
                    src={modalPreviewUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="text-muted small text-center p-2">
                    <FiImage size={28} className="text-danger mb-1" />
                    <div>No Image</div>
                  </div>
                )}
              </div>
            </div>

            {/* Source Mode Selector */}
            <div className="d-flex justify-content-center gap-2 mb-3">
              <button
                type="button"
                className={`btn btn-sm ${
                  modalUploadMode === 'file' ? 'btn-cinema' : 'btn-cinema-secondary'
                }`}
                onClick={() => setModalUploadMode('file')}
              >
                <FiFolder className="me-1" /> From Device
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  modalUploadMode === 'url' ? 'btn-cinema' : 'btn-cinema-secondary'
                }`}
                onClick={() => {
                  setModalUploadMode('url');
                  if (modalPosterUrl) setModalPreviewUrl(modalPosterUrl);
                }}
              >
                <FiLink className="me-1" /> Web URL
              </button>
            </div>

            {modalUploadMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={modalFileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
                  className="d-none"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleModalFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleModalFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => modalFileInputRef.current && modalFileInputRef.current.click()}
                  className="p-3 rounded text-center cursor-pointer mb-3"
                  style={{
                    border: isDragging ? '2px dashed #E50914' : '2px dashed #374151',
                    backgroundColor: isDragging ? 'rgba(229, 9, 20, 0.08)' : '#0B0F17',
                    cursor: 'pointer',
                  }}
                >
                  <FiUploadCloud size={28} className="text-danger mb-1" />
                  <div style={{ color: '#F3F4F6', fontSize: '0.88rem', fontWeight: '600' }}>
                    Click to browse or drop poster image
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    JPG, PNG, WEBP, AVIF up to 10MB
                  </div>
                </div>

                {modalPosterFile && (
                  <div
                    className="d-flex align-items-center justify-content-between p-2 mb-3 rounded"
                    style={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  >
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                      <FiCheckCircle className="text-success flex-shrink-0" size={16} />
                      <span className="text-truncate text-light small fw-medium">
                        {modalPosterFile.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-3">
                <label className="cinema-label">Poster Image URL</label>
                <input
                  type="url"
                  className="form-control cinema-input"
                  placeholder="https://..."
                  value={modalPosterUrl}
                  onChange={(e) => {
                    setModalPosterUrl(e.target.value);
                    setModalPreviewUrl(e.target.value);
                  }}
                />
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClosePosterModal}
                disabled={savingPoster}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-cinema btn-sm px-4"
                onClick={handleSavePoster}
                disabled={savingPoster}
              >
                {savingPoster ? 'Saving...' : 'Save New Poster'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMovies;
