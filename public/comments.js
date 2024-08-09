document.addEventListener("DOMContentLoaded", () => {
  const commentForm = document.getElementById("comment-form");
  const commentsList = document.getElementById("comments-list");

  // コメントの取得
  async function fetchComments() {
    try {
      const response = await fetch("/comments");
      const comments = await response.json();
      commentsList.innerHTML = comments
        .map((comment) => createCommentHTML(comment._id, comment.text))
        .join("");
    } catch (error) {
      console.error("コメントの取得中にエラーが発生しました:", error);
    }
  }

  // コメントのHTML生成
  function createCommentHTML(id, text) {
    return `
            <li data-id="${id}">
                <span>${text}</span>
                <div class="comment-buttons">
                    <button class="edit-btn" data-id="${id}" data-text="${text}">編集</button>
                    <button class="delete-btn" data-id="${id}">削除</button>
                </div>
            </li>
        `;
  }

  // コメントの追加
  commentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const commentText = document.getElementById("comment").value;
    if (commentText.trim() === "") return;

    try {
      await fetch("/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText }),
      });
      commentForm.reset();
      fetchComments();
    } catch (error) {
      console.error("コメントの追加中にエラーが発生しました:", error);
    }
  });

  // コメントの削除
  commentsList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const id = event.target.dataset.id;
      try {
        await fetch(`/comments/${id}`, { method: "DELETE" });
        fetchComments();
      } catch (error) {
        console.error("コメントの削除中にエラーが発生しました:", error);
      }
    }
  });

  // コメントの編集
  commentsList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("edit-btn")) {
      const id = event.target.dataset.id;
      const text = event.target.dataset.text;
      const newText = prompt("コメントを編集してください:", text);
      if (newText !== null && newText.trim() !== "") {
        try {
          await fetch(`/comments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: newText }),
          });
          fetchComments();
        } catch (error) {
          console.error("コメントの編集中にエラーが発生しました:", error);
        }
      }
    }
  });

  fetchComments();
});
