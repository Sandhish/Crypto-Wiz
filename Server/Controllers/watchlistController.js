const express = require('express');
const User = require('../Models/User');

const Watchlist = {
    watchlistAdd: async (req, res) => {
        try {
            const { symbol } = req.body;
            const user = await User.findById(req.user.id);

            if (user.watchlist.some(item => item.symbol === symbol)) {
                return res.status(400).json({ message: 'Symbol already in watchlist' });
            }

            user.watchlist.push({ symbol });
            await user.save();

            res.json(user.watchlist);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    watchlistRemove: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            user.watchlist = user.watchlist.filter(item => item.symbol !== req.params.symbol);
            await user.save();
            res.json(user.watchlist);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },

    getWatchlist: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            res.json(user.watchlist);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    },
}

module.exports = Watchlist;