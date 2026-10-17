const Favorite = require('../models/Favorite');
const Movie = require('../models/Movie');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get user's favorite movies
 * GET /api/v1/favorites
 */
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('movieId')
      .sort({ createdAt: -1 });

    const movies = favorites
      .filter((fav) => fav.movieId) // Filter out any deleted movies
      .map((fav) => ({
        ...fav.movieId.toObject(),
        favoriteId: fav._id,
        favoritedAt: fav.createdAt,
      }));

    return sendSuccess(res, { movies });
  } catch (err) {
    next(err);
  }
};

/**
 * Add movie to favorites
 * POST /api/v1/favorites/:movieId
 */
const addFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    const existing = await Favorite.findOne({ userId: req.user._id, movieId });
    if (existing) {
      throw new ConflictError('Movie is already in your favorites');
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      movieId,
    });

    return sendSuccess(res, { favorite }, 'Movie added to favorites', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Remove movie from favorites
 * DELETE /api/v1/favorites/:movieId
 */
const removeFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const deleted = await Favorite.findOneAndDelete({ userId: req.user._id, movieId });

    if (!deleted) {
      throw new NotFoundError('Movie was not found in your favorites');
    }

    return sendSuccess(res, {}, 'Movie removed from favorites');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
