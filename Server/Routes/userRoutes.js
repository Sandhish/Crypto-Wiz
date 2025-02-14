const express = require('express');
const { protect } = require('../Config/authMiddleware');
const router = express.Router();

router.get('/me', protect, (req, res) => {
    res.json(req.user);
});

module.exports = router;