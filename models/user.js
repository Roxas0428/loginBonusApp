const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastBonusReceived: { type: Date, default: null },
  lastLogin: { type: Date, default: null },
  previousLogin: { type: Date, default: null }, 
});

const User = mongoose.model("User", userSchema);

module.exports = User;
