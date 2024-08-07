const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  lastBonusReceived: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  previousLogin: { type: Date, default: null },
  consecutiveLoginDays: { type: Number, default: 0 }, // 追加
});

const User = mongoose.model("User", userSchema);

module.exports = User;
