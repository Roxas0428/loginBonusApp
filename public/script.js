// public/script.js

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        alert('ログイン完了!');
        // トークンを保存するなど、次のステップに進む
    } else {
        alert(`Login failed: ${data.message}`);
    }
});

document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Registration successful!');
    } else {
        alert(`Registration failed: ${data.message}`);
    }
});
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
        const token = data.token;
        localStorage.setItem('token', token);
        alert('ログイン完了！');
        window.location.href = '/dashboard.html'; // ダッシュボードページへリダイレクト
    } else {
        alert(`Login failed: ${data.message}`);
    }
});
