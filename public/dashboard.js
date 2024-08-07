document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("ログインが必要です");
    window.location.href = "/index.html";
    return;
  }

  const claimBonusButton = document.getElementById("claim-bonus");
  const bonusStatusElement = document.getElementById("bonus-status");
  const usernameElement = document.getElementById("username");
  const lastLoginElement = document.getElementById("last-login");
  const logoutButton = document.getElementById("logout");

  claimBonusButton.addEventListener("click", claimBonus);
  logoutButton.addEventListener("click", logout);

  loadUserInfo();
  checkBonusStatus();
});

async function claimBonus() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("/api/claim-bonus", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "ボーナスの受け取りに失敗しました");
    }

    const data = await response.json();
    alert(data.bonus);
    checkBonusStatus(); // ボーナス受取後にステータスを更新する場合
  } catch (err) {
    console.error("Claim bonus error:", err.message);
    alert(`エラー: ${err.message}`);
  }
}

async function loadUserInfo() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("/api/auth/user-info", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("ユーザー情報の取得に失敗しました");
    }

    const data = await response.json();

    // previousLoginが存在するか確認
    if (data.previousLogin) {
      const previousLoginDate = new Date(data.previousLogin);

      if (!isNaN(previousLoginDate.getTime())) {
        document.getElementById(
          "last-login"
        ).textContent = `前回のログイン: ${previousLoginDate.toLocaleString()}`;
      } else {
        document.getElementById(
          "last-login"
        ).textContent = `前回のログイン: データが無効です`;
      }
    } else {
      // 初めてのログインなどで前回のログイン時間がない場合
      document.getElementById(
        "last-login"
      ).textContent = `初めてのログインおめでとうございます！`;
    }

    document.getElementById(
      "username"
    ).textContent = `ユーザー名: ${data.username}`;
  } catch (err) {
    console.error("ユーザー情報の取得中にエラーが発生しました:", err.message);
    alert(`エラー: ${err.message}`);
  }
}

async function checkBonusStatus() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("/api/bonus-status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("ボーナスステータスの取得に失敗しました");
    }

    const data = await response.json();
    document.getElementById(
      "bonus-status"
    ).textContent = `ボーナスステータス: ${data.status}`;
  } catch (err) {
    console.error(
      "ボーナスステータスの取得中にエラーが発生しました:",
      err.message
    );
    alert(`エラー: ${err.message}`);
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/home.html";
}
