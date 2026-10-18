const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const reviewController = require('../controllers/reviewController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');
const { uploadPoster } = require('../middleware/upload');

// Public browsing routes
router.get('/', optionalAuth, movieController.getAllMovies);
router.get('/:movieId', optionalAuth, movieController.getMovieById);

// Reviews sub-route
router.get('/:movieId/reviews', reviewController.getMovieReviews);
router.post('/:movieId/reviews', authenticate, reviewController.createOrUpdateReview);

// Admin-only management routes
router.post('/upload-poster', authenticate, authorizeAdmin, uploadPoster.single('poster'), movieController.uploadPosterImage);
router.post('/', authenticate, authorizeAdmin, movieController.createMovie);
router.put('/:movieId', authenticate, authorizeAdmin, movieController.updateMovie);
router.patch('/:movieId', authenticate, authorizeAdmin, movieController.updateMovie);
router.delete('/:movieId', authenticate, authorizeAdmin, movieController.deleteMovie);

module.exports = router;

