import React, { useState, useEffect, useRef } from 'react';
import { movieService } from '../../services/movieService';
import { toast } from 'react-toastify';
import {
  FiX,
  FiFilm,
  FiImage,
  FiUploadCloud,
  FiCheckCircle,
  FiLink,
  FiFolder,
  FiCheck,
} from 'react-icons/fi';

const EditMovieModal = ({ isOpen, movie, onClose, onSaved }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [runtimeMinutes, setRuntimeMinutes] = useState(120);
  const [releaseDate, setReleaseDate] = useState('');
  const [certification, setCertification] = useState('UA');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [status, setStatus] = useState('now_showing');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');

  // Poster handling
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [posterUrl, setPosterUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !movie) return;

    setTitle(movie.title || '');
    setDescription(movie.description || '');
    setGenres(Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres || '');
    setLanguage(movie.language || 'Hindi');
    setRuntimeMinutes(movie.runtimeMinutes || 120);
    setReleaseDate(
      movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : ''
    );
    setCertification(movie.certification || 'UA');
    setDirector(movie.director || '');
    setCast(Array.isArray(movie.cast) ? movie.cast.join(', ') : movie.cast || '');
    setStatus(movie.status || 'now_showing');
    setBackdropUrl(movie.backdropUrl || '');
    setTrailerUrl(movie.trailerUrl || '');

    setPosterUrl(movie.posterUrl || '');
    setPreviewUrl(movie.posterUrl || '');
    setPosterFile(null);
    setUploadMode('url');
  }, [isOpen, movie]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file) => {
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

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPosterFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Movie title and description are required');
      return;
    }

    let finalPosterUrl = posterUrl.trim();

    try {
      setSubmitting(true);

      // If user uploaded a new file from device
      if (uploadMode === 'file' && posterFile) {
        toast.info('Uploading movie poster...');
        const uploadRes = await movieService.uploadPoster(posterFile);
        finalPosterUrl = uploadRes.data?.url || uploadRes.url;
      }

      if (!finalPosterUrl) {
        toast.error('Poster URL or file is required');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        genres: genres.split(',').map((g) => g.trim()).filter(Boolean),
        language: language.trim(),
        runtimeMinutes: Number(runtimeMinutes) || 120,
        releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
        certification: certification.trim() || 'UA',
        director: director.trim(),
        cast: cast.split(',').map((c) => c.trim()).filter(Boolean),
        status,
        posterUrl: finalPosterUrl,
        backdropUrl: backdropUrl.trim(),
        trailerUrl: trailerUrl.trim(),
      };

      const res = await movieService.updateMovie(movie._id, payload);
      const updatedMovie = res.data?.movie || res.movie;

      toast.success(`Movie "${title}" updated successfully!`);
      if (onSaved) {
        onSaved(updatedMovie);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update movie:', err);
      toast.error(err.message || 'Failed to save movie changes');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !movie) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1055,
        backdropFilter: 'blur(5px)',
      }}
      onClick={onClose}
    >
      <div
        className="cinema-card p-4 mx-3 shadow-2xl"
        style={{
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#111827',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--color-border)' }}>
          <h4 className="modal-title mb-0 text-light fw-bold d-flex align-items-center gap-2">
            <FiFilm className="text-danger" /> Edit <span className="text-danger">Movie</span>
          </h4>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '28px', height: '28px' }}
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Title */}
            <div className="col-12 col-md-8 text-start">
              <label className="cinema-label">Movie Title *</label>
              <input
                type="text"
                className="form-control cinema-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div className="col-12 col-md-4 text-start">
              <label className="cinema-label">Status</label>
              <select
                className="form-select cinema-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="now_showing">Now Showing</option>
                <option value="upcoming">Upcoming</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Description */}
            <div className="col-12 text-start">
              <label className="cinema-label">Description / Synopsis *</label>
              <textarea
                rows="3"
                className="form-control cinema-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Poster Upload/URL & Preview */}
            <div className="col-12 text-start p-3 rounded" style={{ backgroundColor: '#0B0F17', border: '1px solid #1F2937' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="cinema-label mb-0">Movie Poster *</label>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${uploadMode === 'url' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setUploadMode('url')}
                  >
                    <FiLink className="me-1" /> Web URL
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${uploadMode === 'file' ? 'btn-cinema' : 'btn-cinema-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setUploadMode('file')}
                  >
                    <FiFolder className="me-1" /> From Device
                  </button>
                </div>
              </div>

              <div className="d-flex gap-3 align-items-center">
                {/* Poster Preview thumbnail */}
                <div
                  className="rounded overflow-hidden flex-shrink-0"
                  style={{
                    width: '75px',
                    height: '110px',
                    backgroundColor: '#08090D',
                    border: '1px solid #E50914',
                  }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                      <FiImage />
                    </div>
                  )}
                </div>

                <div className="flex-grow-1">
                  {uploadMode === 'url' ? (
                    <input
                      type="url"
                      placeholder="https://... or /posters/..."
                      className="form-control cinema-input"
                      value={posterUrl}
                      onChange={(e) => {
                        setPosterUrl(e.target.value);
                        setPreviewUrl(e.target.value);
                      }}
                    />
                  ) : (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="d-none"
                        onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                      />
                      <div
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        className="p-2 rounded text-center cursor-pointer"
                        style={{
                          border: isDragging ? '2px dashed #E50914' : '1px dashed #374151',
                          backgroundColor: '#111827',
                          cursor: 'pointer',
                        }}
                      >
                        <FiUploadCloud size={20} className="text-danger mb-1" />
                        <div className="small text-light">Click to select new poster file</div>
                      </div>
                      {posterFile && (
                        <div className="small text-success mt-1 d-flex align-items-center gap-1">
                          <FiCheckCircle /> Selected: {posterFile.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Genres */}
            <div className="col-12 col-md-6 text-start">
              <label className="cinema-label">Genres (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Action, Thriller, Drama"
                className="form-control cinema-input"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                required
              />
            </div>

            {/* Language */}
            <div className="col-6 col-md-3 text-start">
              <label className="cinema-label">Language</label>
              <input
                type="text"
                placeholder="e.g. Hindi, Telugu, English"
                className="form-control cinema-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              />
            </div>

            {/* Certification */}
            <div className="col-6 col-md-3 text-start">
              <label className="cinema-label">Certification</label>
              <select
                className="form-select cinema-select"
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
              >
                <option value="U">U (Universal)</option>
                <option value="UA">UA (Parental Guidance)</option>
                <option value="A">A (Adults 18+)</option>
                <option value="S">S (Specialized)</option>
              </select>
            </div>

            {/* Runtime */}
            <div className="col-6 col-md-4 text-start">
              <label className="cinema-label">Runtime (minutes)</label>
              <input
                type="number"
                min="1"
                className="form-control cinema-input"
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(e.target.value)}
                required
              />
            </div>

            {/* Release Date */}
            <div className="col-6 col-md-4 text-start">
              <label className="cinema-label">Release Date</label>
              <input
                type="date"
                className="form-control cinema-input"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
              />
            </div>

            {/* Director */}
            <div className="col-12 col-md-4 text-start">
              <label className="cinema-label">Director</label>
              <input
                type="text"
                placeholder="e.g. Abhishek Pathak"
                className="form-control cinema-input"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
              />
            </div>

            {/* Cast */}
            <div className="col-12 text-start">
              <label className="cinema-label">Cast Members (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Ajay Devgn, Tabu, Akshaye Khanna"
                className="form-control cinema-input"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
              />
            </div>

            {/* Backdrop URL */}
            <div className="col-12 col-md-6 text-start">
              <label className="cinema-label">Backdrop / Banner Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                className="form-control cinema-input"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
              />
            </div>

            {/* Trailer URL */}
            <div className="col-12 col-md-6 text-start">
              <label className="cinema-label">YouTube Trailer URL</label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="form-control cinema-input"
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm px-3"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-cinema btn-sm px-4 d-flex align-items-center gap-1"
              disabled={submitting}
            >
              <FiCheck size={16} />
              {submitting ? 'Saving...' : 'Save Movie Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMovieModal;
