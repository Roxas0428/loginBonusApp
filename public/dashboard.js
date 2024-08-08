document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("ログインが必要です");
      window.location.href = "/index.html";
      return;
    }
  
    $(document).ready(function () {
        $(".modaal-inline").modaal();
      });
      
      
    
    const claimBonusButton = document.getElementById("claim-bonus");
    const bonusStatusElement = document.getElementById("bonus-status");
    const usernameElement = document.getElementById("username");
    const lastLoginElement = document.getElementById("last-login");
    const logoutButton = document.getElementById("logout");
  
    if (claimBonusButton) claimBonusButton.addEventListener("click", claimBonus);
    if (logoutButton) logoutButton.addEventListener("click", logout);
  
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
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || "ボーナスの受け取りに失敗しました";
        } catch {
          errorMessage = "ボーナスの受け取りに失敗しました";
        }
        throw new Error(errorMessage);
      }
  
      const data = await response.json();
  
      // モーダルにメッセージを設定して開く
      const modalContent = document.getElementById("inline_1");
      modalContent.innerHTML = `<p>${data.message || "ボーナスを受け取りました！"}</p>`;
      $(".modaal-inline").modaal("open");
      
      
      checkBonusStatus();
    } catch (err) {
      console.error("Claim bonus error:", err.message);
      
      // エラーメッセージをモーダルで表示
      document.getElementById("inline_1").innerHTML = `<p>エラー: ${err.message}</p>`;
      $(".modaal-inline").modaal("open");
    }
  }
  

async function loadUserInfo() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("トークンが見つかりません。ログインしてください。");
    window.location.href = "/index.html";
    return;
  }

  try {
    const response = await fetch("/api/user-info", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || "ユーザー情報の取得に失敗しました";
      } catch {
        errorMessage = "ユーザー情報の取得に失敗しました";
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    document.getElementById(
      "username"
    ).textContent = `ユーザー名: ${data.username}`;
    document.getElementById(
      "points"
    ).textContent = `連続ログイン日数: ${data.consecutiveLoginDays}`;
    document.getElementById(
      "welcome-message"
    ).textContent = `${data.username}さん、ようこそ！`;

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
      document.getElementById(
        "last-login"
      ).textContent = `初めてのログインおめでとうございます！`;
    }
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
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage =
          errorData.message || "ボーナスステータスの取得に失敗しました";
      } catch {
        errorMessage = "ボーナスステータスの取得に失敗しました";
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    document.getElementById(
      "bonus-status"
    ).textContent = `本日のログボ: ${data.status}`;
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
