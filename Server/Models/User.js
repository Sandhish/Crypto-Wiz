const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    portfolio: [{
        stockSymbol: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
    }],
    watchlist: [{
        symbol: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
    }],
    otp: String,
    otpExpiry: Date,
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);