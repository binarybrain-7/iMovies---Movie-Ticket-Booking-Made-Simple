const express = require('express');
const router = express.Router();
const seatLockController = require('../controllers/seatLockController');
const { authenticate } = require('../middleware/authenticate');

router.use(authenticate);

router.delete('/:lockId', seatLockController.releaseLock);
router.get('/:lockId', seatLockController.getSeatLock);

module.exports = router;
