const express = require('express');
const router = express.Router();
const tradeController = require('../Controllers/portfolioController');
const { protect } = require('../Config/authMiddleware');

router.post('/buy', protect, tradeController.buyCrypto);

router.post('/sell', protect, tradeController.sellCrypto);

router.get('/portfolio', protect, tradeController.getPortfolio);

router.get('/history', protect, tradeController.getTransactionHistory);

router.post('/funds', protect, tradeController.addingFund);

module.exports = router;