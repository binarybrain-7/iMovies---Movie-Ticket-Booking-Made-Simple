const Review = require('../models/Review');
const Movie = require('../models/Movie');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Get approved reviews for a movie
 * GET /api/v1/movies/:movieId/reviews
 */
const getMovieReviews = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const reviews = await Review.find({ movieId, status: 'APPROVED' })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { reviews });
  } catch (err) {
    next(err);
  }
};

/**
 * Create or update a review for a movie
 * POST /api/v1/movies/:movieId/reviews
 */
const createOrUpdateReview = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be a number between 1 and 5');
    }

    if (!comment || !comment.trim()) {
      throw new ValidationError('Review comment is required');
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      throw new NotFoundError('Movie not found');
    }

    // Upsert review: one per user per movie
    let review = await Review.findOne({ userId: req.user._id, movieId });

    if (review) {
      review.rating = Number(rating);
      review.comment = comment.trim();
      review.status = 'APPROVED';
      await review.save();
      return sendSuccess(res, { review }, 'Review updated successfully');
    }

    review = await Review.create({
      userId: req.user._id,
      movieId,
      rating: Number(rating),
      comment: comment.trim(),
      status: 'APPROVED',
    });

    const populatedReview = await Review.findById(review._id).populate('userId', 'username');

    return sendSuccess(res, { review: populatedReview }, 'Review submitted successfully', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a review
 * DELETE /api/v1/reviews/:reviewId
 */
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new NotFoundError('Review not found');
    }

    // Check ownership or admin
    if (req.user.role !== 'ADMIN' && review.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('You do not have permission to delete this review');
    }

    await Review.findByIdAndDelete(reviewId);

    return sendSuccess(res, {}, 'Review deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMovieReviews,
  createOrUpdateReview,
  deleteReview,
};
