const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  lastLogin: {
    type: Date
  },
  previousLogin: {
    type: Date
  },
  consecutiveLoginDays: {
    type: Number,
    default: 0
  },
  lastBonusReceived: {
    type: Date
  },
  points: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("User", userSchema);
