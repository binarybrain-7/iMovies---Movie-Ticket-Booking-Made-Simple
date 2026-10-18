const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const screenController = require('../controllers/screenController');
const { authenticate } = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');

// Public browsing
router.get('/', theatreController.getAllTheatres);
router.get('/:theatreId', theatreController.getTheatreById);

// Screens nested route
router.get('/:theatreId/screens', screenController.getScreensByTheatre);
router.post('/:theatreId/screens', authenticate, authorizeAdmin, screenController.createScreen);

// Admin-only theatre management
router.post('/', authenticate, authorizeAdmin, theatreController.createTheatre);
router.put('/:theatreId', authenticate, authorizeAdmin, theatreController.updateTheatre);
router.patch('/:theatreId', authenticate, authorizeAdmin, theatreController.updateTheatre);
router.delete('/:theatreId', authenticate, authorizeAdmin, theatreController.deleteTheatre);

module.exports = router;
