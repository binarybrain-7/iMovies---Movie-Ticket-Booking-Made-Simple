const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get all movies with search, filters, pagination, and sorting
 */
const getAllMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      minRating,
      sort = '-releaseDate',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Search query across title, description, and cast
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { genres: searchRegex },
        { cast: searchRegex },
      ];
    }

    // Genre filter
    if (genre && genre !== 'all') {
      query.genres = new RegExp(`^${genre.trim()}$`, 'i');
    }

    // Language filter
    if (language && language !== 'all') {
      query.language = new RegExp(`^${language.trim()}$`, 'i');
    }

    // Status filter (now_showing, upcoming, archived)
    if (status && status !== 'all') {
      query.status = status;
    }

    // Rating filter
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sort).skip(skip).limit(limitNum),
      Movie.countDocuments(query),
    ]);

    return sendSuccess(res, {
      movies,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get movie details by ID
 */
const getMovieById = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    // Count upcoming shows for this movie
    const upcomingShowsCount = await Show.countDocuments({
      movieId,
      status: 'active',
    });

    return sendSuccess(res, {
      movie,
      hasActiveShows: upcomingShowsCount > 0,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new movie (Admin only)
 */
const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      genres,
      language,
      runtimeMinutes,
      releaseDate,
      certification,
      cast,
      director,
      posterUrl,
      backdropUrl,
      trailerUrl,
      status,
    } = req.body;

    if (!title || !description || !posterUrl) {
      throw new ValidationError('Title, description, and poster URL are required');
    }

    // Format genres if supplied as comma-separated string or array
    let formattedGenres = [];
    if (Array.isArray(genres)) {
      formattedGenres = genres.map((g) => g.trim()).filter(Boolean);
    } else if (typeof genres === 'string') {
      formattedGenres = genres.split(',').map((g) => g.trim()).filter(Boolean);
    }

    let formattedCast = [];
    if (Array.isArray(cast)) {
      formattedCast = cast.map((c) => c.trim()).filter(Boolean);
    } else if (typeof cast === 'string') {
      formattedCast = cast.split(',').map((c) => c.trim()).filter(Boolean);
    }

    const movie = await Movie.create({
      title: title.trim(),
      description: description.trim(),
      genres: formattedGenres.length ? formattedGenres : ['Action'],
      language: language || 'Hindi',
      runtimeMinutes: Number(runtimeMinutes) || 120,
      releaseDate: releaseDate ? new Date(releaseDate) : new Date(),
      certification: certification || 'UA',
      cast: formattedCast,
      director: director ? director.trim() : '',
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl ? backdropUrl.trim() : '',
      trailerUrl: trailerUrl ? trailerUrl.trim() : '',
      status: status || 'now_showing',
    });

    return sendSuccess(res, { movie }, 'Movie added successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Update movie details (Admin only)
 */
const updateMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const updateData = { ...req.body };

    if (updateData.genres && typeof updateData.genres === 'string') {
      updateData.genres = updateData.genres.split(',').map((g) => g.trim()).filter(Boolean);
    }
    if (updateData.cast && typeof updateData.cast === 'string') {
      updateData.cast = updateData.cast.split(',').map((c) => c.trim()).filter(Boolean);
    }

    const movie = await Movie.findByIdAndUpdate(movieId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    return sendSuccess(res, { movie }, 'Movie updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete / Archive movie (Admin only)
 */
const deleteMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);

    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    // Check if there are active bookings or active shows
    const activeShows = await Show.countDocuments({ movieId, status: 'active' });
    if (activeShows > 0) {
      // Archive instead of hard delete to preserve show and booking history
      movie.status = 'archived';
      await movie.save();
      return sendSuccess(res, { movie, archived: true }, 'Movie archived because active shows exist');
    }

    await Movie.findByIdAndDelete(movieId);
    return sendSuccess(res, {}, 'Movie deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Upload poster image from device (Admin only)
 */
const uploadPosterImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No image file was provided or invalid file format');
    }

    const relativeUrl = `/uploads/posters/${req.file.filename}`;

    return sendSuccess(
      res,
      {
        url: relativeUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
      },
      'Poster image uploaded successfully',
      200
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  uploadPosterImage,
};

