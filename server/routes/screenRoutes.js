const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const { authenticate } = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');

// Browsing routes
router.get('/', screenController.getAllScreens);
router.get('/:screenId', screenController.getScreenById);

// Admin-only Screen Management
router.post('/', authenticate, authorizeAdmin, screenController.createScreen);
router.put('/:screenId', authenticate, authorizeAdmin, screenController.updateScreen);
router.patch('/:screenId', authenticate, authorizeAdmin, screenController.updateScreen);
router.delete('/:screenId', authenticate, authorizeAdmin, screenController.deleteScreen);

module.exports = router;
