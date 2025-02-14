const express = require('express');
const router = express.Router();
const { protect } = require('../Config/authMiddleware');
const watchlistController = require('../Controllers/watchlistController');

router.post('/add', protect, watchlistController.watchlistAdd);

router.delete('/remove/:symbol', protect, watchlistController.watchlistRemove);

router.get('/', protect, watchlistController.getWatchlist);

module.exports = router;
