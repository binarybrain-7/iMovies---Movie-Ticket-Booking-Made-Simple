import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import MovieCard from '../../components/movies/MovieCard';
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
} from 'react-icons/fi';

const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Poster Update Modal State
  const [editingMovie, setEditingMovie] = useState(null);
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
      const res = await movieService.getMovies({ limit: 100 });
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
  }, []);

  const handleDeleteMovie = async (movieId, title) => {
    if (!window.confirm(`Are you sure you want to delete or archive "${title}"?`)) return;

    try {
      await movieService.deleteMovie(movieId);
      toast.success(`Movie "${title}" removed/archived successfully`);
      setMovies((prev) => prev.filter((m) => m._id !== movieId));
    } catch (err) {
      toast.error(err.message || 'Failed to remove movie');
    }
  };

  const handleOpenEditPoster = (movie) => {
    setEditingMovie(movie);
    setModalUploadMode('file');
    setModalPosterFile(null);
    setModalPosterUrl(movie.posterUrl || '');
    setModalPreviewUrl(movie.posterUrl || '');
  };

  const handleCloseModal = () => {
    if (modalPreviewUrl && modalPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(modalPreviewUrl);
    }
    setEditingMovie(null);
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
    if (!editingMovie) return;

    let finalPosterUrl = '';

    try {
      setSavingPoster(true);

      if (modalUploadMode === 'file' && modalPosterFile) {
        toast.info('Uploading new poster from your device...');
        const uploadRes = await movieService.uploadPoster(modalPosterFile);
        finalPosterUrl = uploadRes.data?.url || uploadRes.url;
      } else if (modalPosterUrl.trim()) {
        finalPosterUrl = modalPosterUrl.trim();
      } else if (modalPosterFile) {
        toast.info('Uploading new poster from your device...');
        const uploadRes = await movieService.uploadPoster(modalPosterFile);
        finalPosterUrl = uploadRes.data?.url || uploadRes.url;
      } else {
        toast.error('Please select an image file or provide an image URL');
        setSavingPoster(false);
        return;
      }

      await movieService.updateMovie(editingMovie._id, { posterUrl: finalPosterUrl });

      // Update local state immediately
      setMovies((prev) =>
        prev.map((m) =>
          m._id === editingMovie._id ? { ...m, posterUrl: finalPosterUrl } : m
        )
      );

      toast.success(`Poster updated for "${editingMovie.title}"!`);
      handleCloseModal();
    } catch (err) {
      console.error('Failed to update poster:', err);
      toast.error(err.message || 'Failed to update poster');
    } finally {
      setSavingPoster(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="admin-manage-movies container py-4 position-relative">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
        <Link to="/admin/add-movie" className="btn btn-cinema btn-sm d-flex align-items-center gap-1">
          <FiPlus /> Add New Movie
        </Link>
      </div>

      {/* Red Banner Header matching Screenshot 4 */}
      <div className="cinema-red-banner shadow">
        Available Movies
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching movies catalogue..." />
      ) : movies.length === 0 ? (
        <div className="cinema-card text-center py-5">
          <p className="text-muted">No movies in database.</p>
          <Link to="/admin/add-movie" className="btn btn-cinema btn-sm">
            Add Your First Movie
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {movies.map((movie) => (
            <div key={movie._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <MovieCard
                movie={movie}
                isAdmin={true}
                onDelete={handleDeleteMovie}
                onEditPoster={handleOpenEditPoster}
              />
            </div>
          ))}
        </div>
      )}

      {/* Update Poster Modal */}
      {editingMovie && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1050,
            backdropFilter: 'blur(4px)',
          }}
          onClick={handleCloseModal}
        >
          <div
            className="cinema-card p-4 mx-3"
            style={{
              maxWidth: '540px',
              width: '100%',
              backgroundColor: '#111827',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="modal-title mb-0 text-light fw-bold">
                Update Poster: <span className="text-danger">{editingMovie.title}</span>
              </h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1 rounded-circle"
                style={{ width: '28px', height: '28px' }}
                onClick={handleCloseModal}
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
                      <span className="badge bg-dark text-muted" style={{ fontSize: '0.7rem' }}>
                        {formatFileSize(modalPosterFile.size)}
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
                onClick={handleCloseModal}
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
