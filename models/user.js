const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    loginStreak: { type: Number, default: 0 },
    lastLogin: { type: Date },
    lastBonusReceived: { type: Date, default: null } // 最後にボーナスを受け取った日時
});

const User = mongoose.model('User', userSchema);

module.exports = User;
