const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authenticate');

router.delete('/:reviewId', authenticate, reviewController.deleteReview);

module.exports = router;
