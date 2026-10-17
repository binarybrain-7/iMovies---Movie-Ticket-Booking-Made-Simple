const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', favoriteController.getFavorites);
router.post('/:movieId', favoriteController.addFavorite);
router.delete('/:movieId', favoriteController.removeFavorite);

module.exports = router;
