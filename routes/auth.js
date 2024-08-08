const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// ユーザー登録エンドポイント
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // ユーザーが既に存在するか確認
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "既にユーザー名が登録されています" });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "登録完了" });
  } catch (err) {
    console.error("User registration error:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// ログインエンドポイント
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "ユーザーが見つかりません" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "パスワードが間違っています" });
    }

    // 連続ログイン日数の更新
    const now = new Date();
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

    if (user.lastLogin) {
      const lastLoginDate = new Date(user.lastLogin);
      const daysDifference = Math.floor(
        (now - lastLoginDate) / oneDayInMilliseconds
      );

      if (daysDifference === 1) {
        user.consecutiveLoginDays += 1;
      } else if (daysDifference > 1) {
        user.consecutiveLoginDays = 1;
      }
    } else {
      user.consecutiveLoginDays = 1;
    }

    user.previousLogin = user.lastLogin;
    user.lastLogin = now;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      username: user.username,
      consecutiveLoginDays: user.consecutiveLoginDays,
    });
  } catch (err) {
    console.error("ログインエラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// JWT検証用のミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// 認証ミドルウェアのエクスポート
module.exports = router;
