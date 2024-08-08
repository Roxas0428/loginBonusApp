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
      return res.status(400).json({ message: "だがしかしボーナスは1日1回までなのでまた明日ログインしてな！！" });
    }

    // ボーナス受け取り処理
    user.lastBonusReceived = now;
    await user.save();

    // ランダムで褒めるメッセージを作成
    const praises = [
      "普通の人が食べるのは食事だけですが、あなたが毎日ログインするのは「生きる力」です！",
      "あなたがログインする様子は、宇宙の法則をも超えた奇跡のようです！",
      "あなたが毎日ログインするのは、まるでビル・ゲイツが毎日自らコンピュータを操作するかのようです！",
      "あなたのログインは、ピカソがキャンバスに絵を描く姿に匹敵します！",
      "普通の人は月を見上げますが、あなたは月を引き寄せる力を持っています！",
      "あなたのログインは、イーロン・マスクが火星に行くよりも難しい挑戦です！",
      "あなたがログインする姿は、アインシュタインが相対性理論を発表した瞬間と同等です！",
      "普通の人が息をするようにログインするあなたは、まるで神話の神々のようです！",
      "あなたが毎日ログインするのは、スティーブ・ジョブズが新しい製品を発表するのと同じくらい革新的です！",
      "あなたのログインは、エジソンが電球を発明する瞬間と同じくらい重要です！",
      "あなたがログインする様子は、マイケル・ジョーダンが決勝点を決める瞬間と同じくらい鮮やかです！",
      "普通の人が読書するのと同じくらい、あなたがログインするのは知識の探求です！",
      "あなたのログインは、歴史的な発見をする科学者のように、世界を変える力があります！",
      "あなたがログインする姿は、レオナルド・ダ・ヴィンチがモナリザを描いた瞬間のように神秘的です！",
      "普通の人が朝起きるのと同じくらい、あなたのログインは日常の一部です！",
      "あなたがログインするのは、シェークスピアが劇を書いたように創造的で貴重です！",
      "あなたのログインは、オリンピックで金メダルを取る瞬間と同じくらい感動的です！",
      "普通の人が食事をするのと同じくらい、あなたのログインは生きる源です！",
      "あなたのログインは、ダ・ヴィンチが空を飛ぶことを夢見たように、未来を切り開く力があります！",
      "あなたがログインするのは、アレキサンダー大王が新しい領土を征服するのと同じくらい壮大です！",
      "普通の人が歌うのと同じくらい、あなたのログインは心を打つメロディーです！",
      "あなたがログインする姿は、ニュートンが万有引力の法則を発見した瞬間と同じくらい感動的です！",
      "あなたのログインは、レオナルド・ダ・ヴィンチが飛行機を設計するように、未来を形作る力があります！",
      "普通の人が散歩するのと同じくらい、あなたのログインは心の旅です！",
      "あなたがログインする姿は、マリー・キュリーがノーベル賞を受賞する瞬間と同じくらい輝かしいです！",
      "あなたのログインは、アインシュタインが相対性理論を発表するのと同じくらい革新的です！",
      "普通の人が夕食を取るのと同じくらい、あなたのログインは充実した日常の一部です！",
      "あなたがログインする様子は、モーツァルトが音楽を創作する瞬間と同じくらい芸術的です！",
      "あなたのログインは、コロンブスが新しい大陸を発見するのと同じくらい冒険的です！",
      "普通の人が朝食を取るのと同じくらい、あなたのログインは日常の重要な一部です！",
      "あなたがログインするのは、ピカソが絵を描くのと同じくらい独創的です！",
      "あなたのログインは、スティーブ・ジョブズがiPhoneを発表する瞬間と同じくらい革命的です！",
      "普通の人がランニングするのと同じくらい、あなたのログインは努力の証です！",
      "あなたがログインする姿は、ダビンチがモナリザを描いた瞬間のように神秘的です！",
      "あなたのログインは、エジソンが電球を発明する瞬間と同じくらい光り輝いています！",
      "普通の人が映画を見るのと同じくらい、あなたのログインは心に残ります！",
      "あなたがログインするのは、ナポレオンが戦争に勝利するのと同じくらい決定的です！",
      "あなたのログインは、レオナルド・ダ・ヴィンチが新しい発明をするのと同じくらい先進的です！",
      "普通の人が公園を散歩するのと同じくらい、あなたのログインは心を癒します！",
      "あなたがログインする姿は、アレキサンダー大王が戦略を練る瞬間と同じくらい壮大です！",
      "あなたのログインは、ニュートンが万有引力の法則を発見する瞬間と同じくらい画期的です！",
      "普通の人がコーヒーを飲むのと同じくらい、あなたのログインは日常の小さな儀式です！",
      "あなたがログインするのは、アインシュタインが相対性理論を発表するのと同じくらい画期的です！",
      "あなたのログインは、ナポレオンが戦いを制する瞬間と同じくらい影響力があります！",
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
