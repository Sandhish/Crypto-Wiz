const User = require('../Models/User');
const Transaction = require('../Models/Portfolio');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            console.log(`Creating payment intent for user ${userId} with amount ${amount}`);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: parseInt(amount),
                currency: 'usd',
                metadata: {
                    userId: userId.toString(),
                    type: 'deposit'
                }
            });

            console.log(`Payment intent created: ${paymentIntent.id}`);

            const amountInDollars = parseInt(amount) / 100;
            user.balance += amountInDollars;

            const transaction = new Transaction({
                user: userId,
                type: 'DEPOSIT',
                total: amountInDollars,
                price: amountInDollars,
                quantity: 1,
                symbol: 'USD'
            });

            await Promise.all([user.save(), transaction.save()]);

            console.log(`TEMPORARY: Added ${amountInDollars} to user ${userId}'s balance directly`);

            res.json({
                clientSecret: paymentIntent.client_secret,
                message: 'Payment intent created',
                newBalance: user.balance
            });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ error: 'Failed to create payment intent' });
        }
    },

    handleStripeWebhook: async (req, res) => {
        const sig = req.headers['stripe-signature'];
        let event;

        console.log('Received webhook from Stripe');
        console.log('Headers:', JSON.stringify(req.headers));

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            console.log(`Webhook event type: ${event.type}`);
        } catch (err) {
            console.error(`Webhook Error: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            console.log(`Payment succeeded: ${paymentIntent.id}`);

            const userId = paymentIntent.metadata.userId;
            const amount = paymentIntent.amount / 100;

            console.log(`Processing payment for user ${userId}, amount ${amount}`);

            try {
                const user = await User.findById(userId);
                if (!user) {
                    console.error(`User not found: ${userId}`);
                    return res.status(404).json({ error: 'User not found' });
                }

                user.balance += amount;

                const transaction = new Transaction({
                    user: userId,
                    type: 'DEPOSIT',
                    total: amount,
                    price: amount,
                    quantity: 1,
                    symbol: 'USD'
                });

                await Promise.all([user.save(), transaction.save()]);

                console.log(`Successfully processed payment for user ${userId}, added $${amount}`);
            } catch (error) {
                console.error('Error processing successful payment:', error);
                return res.status(500).json({ error: 'Failed to process payment' });
            }
        }
        res.json({ received: true });
    },

    withdrawFunds: async (req, res) => {
        try {
            const user = await User.findById(req.user._id);
            const amount = req.body.amount;

            if (amount > user.balance) {
                return res.status(400).json({ message: 'Insufficient funds.' });
            }

            user.balance -= amount;
            await user.save();

            res.json({ message: 'Withdrawal successful.', balance: user.balance });
        } catch (err) {
            res.status(500).json({ message: 'Withdrawal failed.', error: err.message });
        }
    }
};

module.exports = tradeController;