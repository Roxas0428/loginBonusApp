const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

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

// 6時リセットのロジックを組み込んだボーナス受け取りエンドポイント
router.post("/api/claim-bonus", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const now = new Date();
    const lastBonus = user.lastBonusReceived;

    // 現在の日付を取得し、6時にリセットされた基準時間を設定
    const resetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      6,
      0,
      0
    );

    // もし今がリセット時間の前（つまり、午前0時から午前5時59分まで）なら、
    // リセット時間を前日の6時に設定
    if (now < resetTime) {
      resetTime.setDate(resetTime.getDate() - 1);
    }

    // 最後のボーナス受け取り時間がリセット時間より前かどうかを確認
    if (lastBonus && lastBonus > resetTime) {
      return res.status(400).json({ message: "ボーナスは1日1回までです。" });
    }

    // ボーナスを付与し、受け取った時間を更新
    user.lastBonusReceived = now;
    await user.save();

    res.json({ bonus: "100ポイントを受け取りました！" });
  } catch (err) {
    res.status(500).json({ message: "サーバーエラーが発生しました。" });
  }
});

module.exports = router;
