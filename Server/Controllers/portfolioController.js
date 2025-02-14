const User = require('../Models/User');
const Transaction = require('../Models/Portfolio');

const tradeController = {
    buyCrypto: async (req, res) => {
        try {
            const { symbol, quantity, price } = req.body;
            const userId = req.user.id;

            const total = quantity * price;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (user.balance < total) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }

            const existingPosition = user.portfolio.find(p => p.stockSymbol === symbol);
            if (existingPosition) {
                existingPosition.quantity += quantity;
            } else {
                user.portfolio.push({
                    stockSymbol: symbol,
                    quantity: quantity
                });
            }
            user.balance -= total;

            const transaction = new Transaction({
                user: userId,
                symbol,
                type: 'BUY',
                quantity,
                price,
                total
            });

            await Promise.all([user.save(), transaction.save()]);

            res.status(200).json({
                message: 'Purchase successful',
                transaction,
                newBalance: user.balance
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    sellCrypto: async (req, res) => {
        try {
            const { symbol, quantity, price } = req.body;
            const userId = req.user.id;

            const total = quantity * price;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const position = user.portfolio.find(p => p.stockSymbol === symbol);
            if (!position || position.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient crypto balance' });
            }

            if (position.quantity === quantity) {
                user.portfolio = user.portfolio.filter(p => p.stockSymbol !== symbol);
            } else {
                position.quantity -= quantity;
            }
            user.balance += total;

            const transaction = new Transaction({
                user: userId,
                symbol,
                type: 'SELL',
                quantity,
                price,
                total
            });

            await Promise.all([user.save(), transaction.save()]);

            res.status(200).json({
                message: 'Sale successful',
                transaction,
                newBalance: user.balance
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getPortfolio: async (req, res) => {
        try {
            const userId = req.user.id;

            const user = await User.findById(userId).select('portfolio balance');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                portfolio: user.portfolio,
                balance: user.balance
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getTransactionHistory: async (req, res) => {
        try {
            const userId = req.user.id;

            const transactions = await Transaction.find({ user: userId })
                .sort({ timestamp: -1 });

            res.status(200).json(transactions);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    addingFund: async (req, res) => {
        const { amount } = req.body;
        const userId = req.user._id;

        if (!amount) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.balance += amount;
            await user.save();

            res.json({ message: 'Balance updated', newBalance: user.balance });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update balance' });
        }
    }
};

module.exports = tradeController;