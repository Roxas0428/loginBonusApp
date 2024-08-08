document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "ログインに失敗しました");
        }

        const data = await response.json();
        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html"; // ログイン成功後、ダッシュボードへ遷移
      } catch (err) {
        console.error("Login error:", err.message);
        alert(`エラー: ${err.message}`);
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = document.getElementById("register-username").value;
      const password = document.getElementById("register-password").value;

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "新規登録に失敗しました");
        }

        alert("登録が完了しました。ログインしてください。");
        window.location.href = "login.html"; // 登録成功後、ログインページへ遷移
      } catch (err) {
        console.error("Register error:", err.message);
        alert(`エラー: ${err.message}`);
      }
    });
  }
});
