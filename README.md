# loginBonusApp
document.addEventListener('DOMContentLoaded', () => {
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

async function checkBonusStatus() {
    // ボーナスステータスのチェックと更新処理
    // 例えば、ボーナスのステータスを表示する処理を実装
}

async function loadUserInfo() {
    // ユーザー情報の読み込み処理
    // 例えば、ユーザー名や最終ログイン時間を表示する処理を実装
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/index.html";
}
