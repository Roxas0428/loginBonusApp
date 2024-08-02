const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const router = express.Router();

// ユーザー登録
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "ユーザー名は既に存在します" });
    }

    user = new User({ username, password });
    await user.save();

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: "サーバーエラー" });
  }
});

// ユーザーログイン
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "無効なクレデンシャル" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "無効なクレデンシャル" });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "サーバーエラー" });
  }
});

module.exports = router;



router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "無効なクレデンシャル" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "無効なクレデンシャル" });
    }

    // 日付の確認とログインボーナスの処理
    const today = new Date().setHours(0, 0, 0, 0);
    const lastLogin = new Date(user.lastLogin).setHours(0, 0, 0, 0);

    if (today > lastLogin) {
      user.loginStreak += 1;
      user.lastLogin = new Date();
      await user.save();
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, loginStreak: user.loginStreak });
  } catch (err) {
    res.status(500).json({ message: "サーバーエラー" });
  }
});
