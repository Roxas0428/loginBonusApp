// ログインユーザーの情報を保存する変数
let currentUser = null;

// コメントリストの要素を取得
let commentsList = null; // 初期値を設定

// ログイン状態をチェックし、ユーザー情報を取得する関数
async function checkAuthAndGetUserInfo() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch('/api/user-info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('認証エラー');
    return await response.json();
  } catch (error) {
    console.error('認証エラー:', error);
    localStorage.removeItem('token');
    return null;
  }
}

// コメントのHTML生成
function createCommentHTML(comment) {
  const isAuthor = currentUser && comment.user && (currentUser.userId === comment.user.toString() || currentUser.username === "鈴木大地");

  const buttonsHTML = isAuthor
    ? `
      <div class="comment-buttons">
        <button class="edit-btn" data-id="${comment._id}" data-text="${comment.text}">編集</button>
        <button class="delete-btn" data-id="${comment._id}">削除</button>
      </div>
    `
    : '';

  return `
    <li data-id="${comment._id}" data-user-id="${comment.user}">
      <span>${comment.text}</span>
      <small>投稿者: ${comment.username || '不明'}</small>
      ${buttonsHTML}
    </li>
  `;
}

// コメントの取得
async function fetchComments() {
  try {
    const response = await fetch("/comments");
    if (!response.ok) throw new Error('コメント取得エラー');
    const comments = await response.json();
    commentsList.innerHTML = comments
      .map((comment) => createCommentHTML(comment))
      .join("");
  } catch (error) {
    console.error("コメントの取得中にエラーが発生しました:", error);
  }
}



document.addEventListener("DOMContentLoaded", async () => {
  const commentForm = document.getElementById("comment-form");
  commentsList = document.getElementById("comments-list"); // コメントリストを取得
  const loginMessage = document.getElementById("login-message");

  // ユーザー情報を取得
  currentUser = await checkAuthAndGetUserInfo();

  if (!currentUser) {
    loginMessage.style.display = 'block';
    commentForm.style.display = 'none';
  } else {
    loginMessage.style.display = 'none';
    commentForm.style.display = 'block';
  }

  // コメントの取得
  fetchComments();

  // コメントの追加
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const commentText = document.getElementById("comment").value;
    if (commentText.trim() === "") return;

    try {
      const response = await fetch("/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ comment: commentText }),
      });
      if (!response.ok) throw new Error('コメント追加エラー');
      commentForm.reset();
      fetchComments();
    } catch (error) {
      console.error("コメントの追加中にエラーが発生しました:", error);
    }
  });
  commentsList.addEventListener("click", async (event) => {
    if (!currentUser) {
      alert("編集・削除するにはログインが必要です。");
      return;
    }
  
    const commentId = event.target.dataset.id;
    const commentElement = event.target.closest('li');
    const commentUserId = commentElement.dataset.userId;
  
    if (event.target.classList.contains("delete-btn")) {
      // 削除権限のチェック
      if (currentUser.userId !== commentUserId && currentUser.username !== "鈴木大地") {
        alert("このコメントを削除する権限がありません。");
        return;
      }
  
      // 削除処理
      try {
        const response = await fetch(`/comments/${commentId}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('コメント削除エラー');
        fetchComments();
      } catch (error) {
        console.error("コメントの削除中にエラーが発生しました:", error);
      }
    } else if (event.target.classList.contains("edit-btn")) {
      // 編集権限のチェック
      if (currentUser.userId !== commentUserId && currentUser.username !== "鈴木大地") {
        alert("このコメントを編集する権限がありません。");
        return;
      }
  
      // 編集処理
      const newText = prompt("コメントを編集してください:", event.target.dataset.text);
      if (newText !== null && newText.trim() !== "") {
        try {
          const response = await fetch(`/comments/${commentId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ comment: newText }),
          });
          if (!response.ok) throw new Error('コメント編集エラー');
          fetchComments();
        } catch (error) {
          console.error("コメントの編集中にエラーが発生しました:", error);
        }
      }
    }
  });

});

