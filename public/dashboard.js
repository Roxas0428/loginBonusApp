// public/dashboard.js
document.getElementById('claim-bonus').addEventListener('click', async () => {
    const token = localStorage.getItem('token');

    const response = await fetch('/api/claim-bonus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();
    if (response.ok) {
        alert(data.bonus);
    } else {
        alert(`ボーナスの受け取りに失敗しました: ${data.message}`);
    }
});
