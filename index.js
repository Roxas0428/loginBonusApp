const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// MongoDBへの接続
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB接続完了"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("ログインボーナスアプリへようこそ！");
});

app.listen(PORT, () => {
  console.log(`サーバー接続開始 ${PORT}`);
});
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
