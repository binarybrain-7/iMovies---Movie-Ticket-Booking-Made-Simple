const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const { authenticate } = require('../middleware/authenticate');
const authorizeAdmin = require('../middleware/authorizeAdmin');

router.patch('/:screenId', authenticate, authorizeAdmin, screenController.updateScreen);

module.exports = router;
