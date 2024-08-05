// public/script.js

// ログインフォームのイベントリスナー
document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "ログインに失敗しました");
    }

    const token = data.token;
    localStorage.setItem("token", token);
    alert("ログイン完了！");
    window.location.href = "/dashboard.html"; // ダッシュボードページへリダイレクト
  } catch (err) {
    console.error("ログイン中にエラーが発生しました:", err.message);
    alert(`エラー: ${err.message}`);
  }
});

// 登録フォームのイベントリスナー
document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "登録に失敗しました");
    }

    alert("登録が完了しました！ログインしてください。");
    // オプション: 登録成功後にログインフォームにフォーカスを移動
    document.getElementById("login-username").focus();
  } catch (err) {
    console.error("登録中にエラーが発生しました:", err.message);
    alert(`エラー: ${err.message}`);
  }
});