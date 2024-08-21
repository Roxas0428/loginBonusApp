const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = express.Router();

// ユーザー登録エンドポイント
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // パスワードのバリデーション
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "パスワードは6文字以上でなければなりません" });
  }

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

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

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

// JWT検証ミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401); // トークンがない場合は未認証ステータスを返す

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) return res.sendStatus(403); // トークンが無効な場合は拒否ステータスを返す

    try {
      // トークンの情報を使ってユーザーをデータベースから取得
      const user = await User.findById(decodedToken.userId);
      if (!user) return res.sendStatus(404); // ユーザーが見つからない場合は404ステータスを返す

      // リクエストにユーザー情報を追加
      req.user = {
        userId: user._id.toString(),
        name: user.username, // ユーザー名をリクエストに追加
      };
      next(); // 次のミドルウェアまたはルートハンドラに進む
    } catch (err) {
      res.sendStatus(500); // サーバーエラーの場合は500ステータスを返す
    }
  });
}

// 認証ミドルウェアのエクスポート
module.exports = router;
