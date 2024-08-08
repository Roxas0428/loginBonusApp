document.addEventListener("DOMContentLoaded", () => {
  const commentForm = document.getElementById("comment-form");
  const commentsList = document.getElementById("comments-list");

  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const commentText = document.getElementById("comment").value;

    // コメントを作成
    const newComment = document.createElement("li");

    // コメントテキスト
    const textNode = document.createTextNode(commentText);
    newComment.appendChild(textNode);

    // 編集・削除ボタン
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("comment-buttons");

    const editButton = document.createElement("button");
    editButton.textContent = "編集";
    editButton.addEventListener("click", () => editComment(newComment));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.classList.add("delete");
    deleteButton.addEventListener("click", () => deleteComment(newComment));

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);

    newComment.appendChild(buttonContainer);

    // コメントをコメント一覧に追加
    commentsList.appendChild(newComment);

    // フォームをリセット
    commentForm.reset();
  });

  function editComment(commentElement) {
    const newText = prompt(
      "コメントを編集してください:",
      commentElement.childNodes[0].textContent
    );
    if (newText !== null) {
      commentElement.childNodes[0].textContent = newText;
    }
  }

  function deleteComment(commentElement) {
    if (confirm("本当に削除しますか？")) {
      commentElement.remove();
    }
  }
});
