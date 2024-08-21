// 必要なモジュールのインポート
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const path = require("path");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const User = require("./models/user");

// 環境変数の設定
dotenv.config();

// Expressアプリケーションの初期化
const app = express();

// ミドルウェアの設定
app.use(express.json());
app.use('/auth', authRoutes); // 認証ルートを適用
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB接続
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB接続完了"))
  .catch((err) => console.error("MongoDB接続エラー:", err));

// JWT検証ミドルウェア
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

// ホームページリダイレクトルート
app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// 認証ルート
app.use("/api/auth", authRoutes);

// ユーザー情報取得ルート
app.get("/api/user-info", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user)
      return res.status(404).json({ message: "ユーザーが見つかりません" });

    // console.log("Before update:", {
    //   lastLogin: user.lastLogin,
    //   previousLogin: user.previousLogin,
    //   consecutiveLoginDays: user.consecutiveLoginDays,
    // });

    const now = new Date();
    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;

    // 最後のログインから24時間以上経過している場合のみ更新
    if (!lastLoginDate || now - lastLoginDate >= 24 * 60 * 60 * 1000) {
      // 連続ログイン日数の更新
      if (lastLoginDate) {
        const daysDifference = Math.floor(
          (now - lastLoginDate) / (1000 * 60 * 60 * 24)
        );
        if (daysDifference === 1) {
          user.consecutiveLoginDays += 1;
        } else if (daysDifference > 1) {
          user.consecutiveLoginDays = 1;
        }
      } else {
        user.consecutiveLoginDays = 1;
      }

      // 前回のログイン時間を保存し、現在のログイン時間を更新
      user.previousLogin = user.lastLogin;
      user.lastLogin = now;

      await user.save();

      // console.log("After update:", {
      //   lastLogin: user.lastLogin,
      //   previousLogin: user.previousLogin,
      //   consecutiveLoginDays: user.consecutiveLoginDays,
      // });
    }

    res.json({
      username: user.username,
      consecutiveLoginDays: user.consecutiveLoginDays,
      previousLogin: user.previousLogin
        ? user.previousLogin.toISOString()
        : null,
      lastLogin: user.lastLogin.toISOString(),
      points: user.points,
    });
  } catch (err) {
    console.error("User info retrieval error:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});
// ボーナスステータス取得ルート
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

// ボーナス受け取りルート
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
      return res.status(400).json({
        message:
          "ボーナスは1日1回までなのでまた明日ログインして褒めてもらおう！！",
      });
    }

    user.lastBonusReceived = now;
    await user.save();

    const praises = require("./praises.js");

    const randomPraise = praises[Math.floor(Math.random() * praises.length)];
    const message = `${randomPraise} 今日もログインできて素晴らしい！！また明日待ってます！！`;

    res.json({ message });
  } catch (err) {
    console.error("Claim bonus error:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});

// コメント機能用のスキーマとルート
const commentSchema = new mongoose.Schema({
  text: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: String // ユーザー名を保存
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);

// コメント取得ルート
// コメント取得ルート
app.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    console.error("コメント取得エラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// コメント追加ルート
app.post('/comments', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "ユーザーが見つかりません" });
    }

    const newComment = new Comment({
      user: user._id,
      username: user.username,
      text: req.body.comment
    });
    
    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    console.error("コメント追加エラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// コメント編集ルート
app.put('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "コメントが見つかりません" });
    }

    if (comment.user.toString() !== req.user.userId && req.user.username !== "鈴木大地") {
      return res.status(403).json({ message: "このコメントを編集する権限がありません" });
    }

    comment.text = req.body.comment;
    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error("コメント編集エラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

// コメント削除ルート
app.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "コメントが見つかりません" });
    }

    // コメントの所有者とログインユーザーのIDを比較
    if (comment.user.toString() !== req.user.userId && req.user.username !== "鈴木大地") {
      return res.status(403).json({ message: "このコメントを削除する権限がありません" });
    }

    await comment.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error("コメント削除エラー:", err);
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});


// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバー接続開始 ${PORT}`);
});

process.env.MONGO_URI;
process.env.JWT_SECRET;
process.env.PORT;
