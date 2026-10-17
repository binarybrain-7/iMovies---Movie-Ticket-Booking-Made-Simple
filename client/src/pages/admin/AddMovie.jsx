import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { toast } from 'react-toastify';
import {
  FiArrowLeft,
  FiImage,
  FiUploadCloud,
  FiCheckCircle,
  FiX,
  FiLink,
  FiFolder,
} from 'react-icons/fi';

const AddMovie = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genres, setGenres] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [runtimeMinutes, setRuntimeMinutes] = useState('');
  const [certification, setCertification] = useState('UA');
  const [language, setLanguage] = useState('Telugu');
  const [trailerUrl, setTrailerUrl] = useState('');

  // Poster state: Support both Device Upload and Web URL
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [posterFile, setPosterFile] = useState(null);
  const [posterUrl, setPosterUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [backdropUrl, setBackdropUrl] = useState('');
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Clean up blob URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) {
      toast.error('Please select a valid image file (JPG, PNG, WEBP, or GIF)');
      return;
    }

    // Validate size (10MB max)
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

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPosterFile(null);
    setPreviewUrl(uploadMode === 'url' ? posterUrl : '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    let finalPosterUrl = '';

    try {
      setSubmitting(true);

      // If user uploaded a file from device, send it to the server upload endpoint first
      if (uploadMode === 'file' && posterFile) {
        setUploadStatusText('Uploading poster image from device...');
        const uploadRes = await movieService.uploadPoster(posterFile);
        finalPosterUrl = uploadRes.data?.url || uploadRes.url;
      } else if (posterUrl.trim()) {
        finalPosterUrl = posterUrl.trim();
      } else if (posterFile) {
        setUploadStatusText('Uploading poster image from device...');
        const uploadRes = await movieService.uploadPoster(posterFile);
        finalPosterUrl = uploadRes.data?.url || uploadRes.url;
      } else {
        toast.error('Please choose a poster image from your device or provide an image URL');
        setSubmitting(false);
        return;
      }

      setUploadStatusText('Creating movie in catalogue...');

      const payload = {
        title: title.trim(),
        description: description.trim(),
        genres: genres ? genres.split(',').map((g) => g.trim()) : ['Action'],
        releaseDate: releaseDate || new Date().toISOString().slice(0, 10),
        runtimeMinutes: Number(runtimeMinutes) || 120,
        certification: certification || 'UA',
        language: language || 'Telugu',
        trailerUrl: trailerUrl.trim(),
        posterUrl: finalPosterUrl,
        backdropUrl: backdropUrl.trim(),
        cast: cast ? cast.split(',').map((c) => c.trim()) : [],
        director: director.trim(),
      };

      await movieService.createMovie(payload);
      toast.success(`Movie "${title}" added successfully!`);
      navigate('/admin/manage-movies');
    } catch (err) {
      console.error('Failed to create movie:', err);
      toast.error(err.message || 'Failed to add movie');
    } finally {
      setSubmitting(false);
      setUploadStatusText('');
    }
  };

  const activePosterDisplay = uploadMode === 'file' ? previewUrl : (posterUrl || previewUrl);

  return (
    <div className="admin-add-movie container py-4" style={{ maxWidth: '820px' }}>
      <div className="d-flex align-items-center gap-2 mb-4">
        <Link to="/admin" className="btn btn-cinema-secondary btn-sm d-flex align-items-center gap-1">
          <FiArrowLeft /> Back to Dashboard
        </Link>
      </div>

      <div
        className="cinema-card p-4 p-md-5"
        style={{
          backgroundColor: '#111827',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Poster preview box with red border on top matching Screenshot 4 */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex flex-column align-items-center justify-content-center rounded overflow-hidden shadow-sm position-relative"
            style={{
              width: '180px',
              height: '140px',
              border: '2px solid #E50914',
              backgroundColor: '#08090D',
            }}
          >
            {activePosterDisplay ? (
              <img
                src={activePosterDisplay}
                alt="Poster Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-muted small text-center p-2">
                <FiImage size={30} className="text-danger mb-1" />
                <div style={{ fontSize: '0.78rem', fontWeight: '500' }}>Poster Preview</div>
                <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Choose image below</div>
              </div>
            )}
          </div>
        </div>

        {/* Title matching Screenshot 4: "Add Movie" (Movie in red) */}
        <h1 className="section-title mb-4">
          Add <span className="text-accent">Movie</span>
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Movie Title */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Movie Title</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="Enter movie name (e.g. Pushpa 2)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Description</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="Enter movie synopsis"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Genres */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Genres</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="Action, Thriller, Drama"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
              />
            </div>

            {/* Release Date */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Release Date</label>
              <input
                type="date"
                className="form-control cinema-input"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
              />
            </div>

            {/* Runtime */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Runtime (minutes)</label>
              <input
                type="number"
                className="form-control cinema-input"
                placeholder="e.g. 150"
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(e.target.value)}
                required
              />
            </div>

            {/* Certification */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Certification</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="UA, UA 16+, A, U, etc."
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                list="certification-list"
              />
              <datalist id="certification-list">
                <option value="UA" />
                <option value="UA 16+" />
                <option value="UA 13+" />
                <option value="UA 7+" />
                <option value="U" />
                <option value="A" />
                <option value="PG-13" />
                <option value="R" />
                <option value="PG" />
                <option value="G" />
              </datalist>
            </div>

            {/* Trailer URL */}
            <div className="col-12">
              <label className="cinema-label">Trailer URL (YouTube)</label>
              <input
                type="url"
                className="form-control cinema-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
              />
            </div>

            {/* POSTER SELECTION: DEVICE UPLOAD OR WEB URL */}
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="cinema-label mb-0">Movie Poster Image</label>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      uploadMode === 'file' ? 'btn-cinema' : 'btn-cinema-secondary'
                    }`}
                    style={{ fontSize: '0.78rem', padding: '3px 12px' }}
                    onClick={() => setUploadMode('file')}
                  >
                    <FiFolder className="me-1" /> From Device
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      uploadMode === 'url' ? 'btn-cinema' : 'btn-cinema-secondary'
                    }`}
                    style={{ fontSize: '0.78rem', padding: '3px 12px' }}
                    onClick={() => {
                      setUploadMode('url');
                      if (posterUrl) setPreviewUrl(posterUrl);
                    }}
                  >
                    <FiLink className="me-1" /> Web URL
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  {/* Hidden native file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/avif, image/gif"
                    className="d-none"
                    onChange={handleFileInputChange}
                  />

                  {/* Drag and drop / Click upload box */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="p-4 rounded text-center cursor-pointer position-relative"
                    style={{
                      border: isDragging ? '2px dashed #E50914' : '2px dashed #374151',
                      backgroundColor: isDragging ? 'rgba(229, 9, 20, 0.08)' : '#0B0F17',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <FiUploadCloud
                      size={36}
                      className={isDragging ? 'text-danger' : 'text-muted'}
                      style={{ marginBottom: '8px' }}
                    />
                    <div style={{ color: '#F3F4F6', fontWeight: '600', fontSize: '0.95rem' }}>
                      Click to browse or drag & drop poster image
                    </div>
                    <div className="text-muted small mt-1">
                      Supports JPG, PNG, WEBP, AVIF up to 10MB
                    </div>
                  </div>

                  {/* Selected File Details Bar */}
                  {posterFile && (
                    <div
                      className="d-flex align-items-center justify-content-between p-2 mt-2 rounded"
                      style={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <FiCheckCircle className="text-success flex-shrink-0" size={18} />
                        <span
                          className="text-truncate text-light small fw-medium"
                          title={posterFile.name}
                        >
                          {posterFile.name}
                        </span>
                        <span className="badge bg-dark text-muted" style={{ fontSize: '0.7rem' }}>
                          {formatFileSize(posterFile.size)}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm p-1 rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '26px', height: '26px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            clearSelectedFile();
                          }}
                          title="Remove file"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* URL Input Mode */
                <div>
                  <input
                    type="url"
                    className="form-control cinema-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={posterUrl}
                    onChange={(e) => {
                      setPosterUrl(e.target.value);
                      setPreviewUrl(e.target.value);
                    }}
                  />
                  <div className="text-muted small mt-1">
                    Enter a direct image link (.jpg, .png, etc.)
                  </div>
                </div>
              )}
            </div>

            {/* Language */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Language</label>
              <select
                className="form-select cinema-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="Telugu">Telugu</option>
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Kannada">Kannada</option>
                <option value="Tamil">Tamil</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>

            {/* Director */}
            <div className="col-12 col-md-6">
              <label className="cinema-label">Director</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="e.g. Sukumar, Rajamouli"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
              />
            </div>

            {/* Cast */}
            <div className="col-12">
              <label className="cinema-label">Cast (comma-separated)</label>
              <input
                type="text"
                className="form-control cinema-input"
                placeholder="Allu Arjun, Rashmika Mandanna, Fahadh Faasil"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
              />
            </div>
          </div>

          {/* Submit Button matching Screenshot 4 */}
          <div className="text-center mt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-cinema px-5 py-2"
              style={{ fontWeight: '600' }}
            >
              {submitting ? (uploadStatusText || 'Saving Movie...') : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMovie;
