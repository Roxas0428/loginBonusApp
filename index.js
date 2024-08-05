const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const path = require("path");

const app = express();
dotenv.config();
app.use(express.json());
app.use(express.static('public'));

// MongoDB接続
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB接続完了"))
.catch((err) => console.error("MongoDB接続エラー:", err));

// 認証ルート
app.use("/api/auth", authRoutes);

// ボーナス受け取りエンドポイント
app.post("/api/claim-bonus", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりませんでした。" });
    }

    const now = new Date();
    const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);

    // 朝6時以前の場合、リセット時間を前日の朝6時に設定
    if (now < resetTime) {
      resetTime.setDate(resetTime.getDate() - 1);
    }

    // ユーザーが最後にボーナスを受け取った時刻をチェック
    if (user.lastBonusReceived && user.lastBonusReceived > resetTime) {
      return res.status(400).json({ message: "ボーナスは1日1回までです。" });
    }

    // ボーナスを受け取る処理
    user.lastBonusReceived = now;
    await user.save();

    res.json({ bonus: "100ポイントを受け取りました" });
  } catch (err) {
    console.error('Claim bonus error:', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// JWT検証用のミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

app.get("/api/user-info", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    res.json({
      username: user.username,
      lastLogin: user.lastLogin,
    });
  } catch (err) {
    console.error('User info retrieval error:', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

app.get("/api/bonus-status", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    const now = new Date();
    const resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
    if (now < resetTime) {
      resetTime.setDate(resetTime.getDate() - 1);
    }

    const bonusStatus = user.lastBonusReceived > resetTime ? 'ボーナスはすでに受け取られました' : 'ボーナスが受け取れます';

    res.json({ status: bonusStatus });
  } catch (err) {
    console.error('Bonus status retrieval error:', err);
    res.status(500).json({ message: 'サーバーエラーが発生しました。' });
  }
});

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, "public")));

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバー接続開始 ${PORT}`);
});
