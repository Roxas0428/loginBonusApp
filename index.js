const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const app = express();

dotenv.config();

app.use(express.json());
app.use(express.static('public')); // 静的ファイルの提供

// MongoDB接続
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB接続完了'))
    .catch(err => console.log(err));

// 認証ルート
app.use('/api/auth', authRoutes);

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`サーバー接続開始 ${PORT}`);
});


// 静的ファイルの提供
app.use(express.static("public"));

const jwt = require('jsonwebtoken');

// JWT検証用ミドルウェア
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// 保護されたルートの設定
app.get('/api/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is protected data.', user: req.user });
});


// ログインボーナスを処理するエンドポイント
app.post('/api/claim-bonus', authenticateToken, (req, res) => {
  // ボーナス処理のロジックを追加します
  const bonus = '100ポイント'; // 例: 100ポイントのボーナスを与える
  res.json({ bonus });
});
