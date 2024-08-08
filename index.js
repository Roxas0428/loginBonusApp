const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const path = require("path");

const authRoutes = require("./routes/auth");
const User = require("./models/User");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB接続
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB接続完了"))
  .catch((err) => console.error("MongoDB接続エラー:", err));

// ミドルウェア: JWT検証
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

// ルート: ホームページのリダイレクト
app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// 認証ルート
app.use("/api/auth", authRoutes);

// ルート: ユーザー情報の取得
app.get("/api/user-info", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    // 連続ログイン日数の更新ロジック
    const now = new Date();
    const previousLogin = user.lastLogin;

    if (previousLogin) {
      const previousLoginDate = new Date(previousLogin);
      const daysDifference = Math.floor(
        (now - previousLoginDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference === 1) {
        // 1日だけ間隔が空いている場合は連続ログイン日数を増やす
        user.consecutiveLoginDays += 1;
      } else if (daysDifference > 1) {
        // 1日以上間隔が空いている場合は連続ログイン日数をリセットする
        user.consecutiveLoginDays = 1;
      }
    } else {
      // 初回ログイン時の処理
      user.consecutiveLoginDays = 1;
    }

    // ログイン日時の更新
    user.previousLogin = user.lastLogin;
    user.lastLogin = now;
    await user.save();

    res.json({
      username: user.username,
      consecutiveLoginDays: user.consecutiveLoginDays,
      previousLogin: user.previousLogin
        ? user.previousLogin.toISOString()
        : null,
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
      points: user.points,
    });
  } catch (err) {
    console.error("User info retrieval error:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});

// ルート: ボーナスステータスの取得
app.get("/api/bonus-status", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user)
      return res.status(404).json({ message: "ユーザーが見つかりません" });

    const now = new Date();
    const resetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      6,
      0,
      0
    );
    if (now < resetTime) resetTime.setDate(resetTime.getDate() - 1);

    const bonusStatus =
      user.lastBonusReceived > resetTime ? "受け取り済みです" : "受け取れます";

    res.json({ status: bonusStatus });
  } catch (err) {
    console.error("Bonus status retrieval error:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});

// ルート: ボーナス受け取り
app.post("/api/claim-bonus", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user)
      return res.status(404).json({ message: "ユーザーが見つかりません" });

    const now = new Date();
    const resetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      6,
      0,
      0
    );
    if (now < resetTime) resetTime.setDate(resetTime.getDate() - 1);

    if (user.lastBonusReceived && user.lastBonusReceived > resetTime) {
      return res.status(400).json({ message: "ボーナスは1日1回までです。" });
    }

    // ボーナス受け取り処理
    user.lastBonusReceived = now;
    await user.save();

    // ランダムで褒めるメッセージを作成
    const praises = [
      "素晴らしいですね！毎日ログインしているあなたは本当に努力家です！",
      "お疲れ様です！その継続力には敬意を表します！",
      "毎日コツコツとログインするあなたは本当に素晴らしいです！",
    ];
    const randomPraise = praises[Math.floor(Math.random() * praises.length)];
    const message = `${randomPraise} 今日もログインできてえらい！`;

    res.json({ message });
  } catch (err) {
    console.error("Claim bonus error:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバー接続開始 ${PORT}`);
});
