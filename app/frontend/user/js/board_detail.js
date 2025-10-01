// API URL 설정
const API_URL = "http://localhost:8000";

// URL에서 게시글 번호 가져오기
const urlParams = new URLSearchParams(window.location.search);
const boardSeq = urlParams.get("seq");

let currentUserSeq = null;
let boardData = null;

// 로그인 정보 확인
function checkLogin() {
    const userSeq = localStorage.getItem("user_seq");
    const userId = localStorage.getItem("user_id");
    
    if (!userSeq || !userId) {
        alert("로그인이 필요합니다.");
        window.location.href = "../html/login.html";
        return false;
    }
    
    currentUserSeq = parseInt(userSeq);
    return true;
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    if (!checkLogin()) return;

    if (!boardSeq) {
        alert("잘못된 접근입니다.");
        goToList();
        return;
    }

    loadBoardDetail();
    loadComments();

    // ✅ 댓글 작성 버튼 이벤트 연결
    document.getElementById("btn-comment-submit")
        .addEventListener("click", createComment);
});


// 게시글 상세 로드
async function loadBoardDetail() {
    try {
        const response = await fetch(`${API_URL}/board/${boardSeq}`);
        
        if (!response.ok) {
            throw new Error("게시글을 불러오는데 실패했습니다.");
        }
        
        boardData = await response.json();
        displayBoardDetail(boardData);
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
        goToList();
    }
}

// 게시글 상세 표시
function displayBoardDetail(board) {
    document.getElementById("boardTitle").textContent = board.board_title;
    document.getElementById("boardAuthor").textContent = board.user_id;
    document.getElementById("boardDate").textContent = formatDate(board.board_create_date);
    document.getElementById("boardViews").textContent = board.board_view;
    document.getElementById("boardContent").textContent = board.board_content;
    
    // 작성자일 경우 수정/삭제 버튼 표시
    const actionsDiv = document.getElementById("boardActions");
    if (board.user_seq === currentUserSeq) {
        actionsDiv.innerHTML = `
            <button class="btn-edit" onclick="goToEdit()">✏️ 수정</button>
            <button class="btn-delete" onclick="deleteBoard()">🗑️ 삭제</button>
        `;
    }
}

// 댓글 목록 로드
async function loadComments() {
    try {
        const response = await fetch(`${API_URL}/board/${boardSeq}/comments`);
        
        if (!response.ok) {
            throw new Error("댓글을 불러오는데 실패했습니다.");
        }
        
        const comments = await response.json();
        displayComments(comments);
    } catch (error) {
        console.error("Error:", error);
    }
}

// 댓글 표시
function displayComments(comments) {
    const commentList = document.getElementById("commentList");
    const commentCount = document.getElementById("commentCount");
    
    commentCount.textContent = comments.length;
    
    if (comments.length === 0) {
        commentList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">첫 댓글을 작성해보세요!</div>
            </div>
        `;
        return;
    }
    
    commentList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.user_id)}</span>
                <span class="comment-date">${formatDate(comment.comment_create_date)}</span>
            </div>
            <div class="comment-content">${escapeHtml(comment.comment_content)}</div>
            ${comment.user_seq === currentUserSeq ? `
                <button class="btn-comment-delete" onclick="deleteComment(${comment.comment_seq})">삭제</button>
            ` : ""}
        </div>
    `).join("");
}

// 댓글 작성
async function createComment() {
    const content = document.getElementById("commentContent").value.trim();
    
    if (!content) {
        alert("댓글 내용을 입력해주세요.");
        return;
    }
    
    if (content.length > 1000) {
        alert("댓글은 1000자를 초과할 수 없습니다.");
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/board/${boardSeq}/comments?user_seq=${currentUserSeq}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                comment_content: content
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "댓글 작성에 실패했습니다.");
        }
        
        alert("댓글이 작성되었습니다.");
        document.getElementById("commentContent").value = "";
        loadComments();
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 댓글 삭제
async function deleteComment(commentSeq) {
    if (!confirm("댓글을 삭제하시겠습니까?")) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/board/${boardSeq}/comments/${commentSeq}?user_seq=${currentUserSeq}`, {
            method: "DELETE"
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "댓글 삭제에 실패했습니다.");
        }
        
        alert("댓글이 삭제되었습니다.");
        loadComments();
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 게시글 수정
function goToEdit() {
    window.location.href = `board_write.html?seq=${boardSeq}`;
}

// 게시글 삭제
async function deleteBoard() {
    if (!confirm("게시글을 삭제하시겠습니까?")) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/board/${boardSeq}?user_seq=${currentUserSeq}`, {
            method: "DELETE"
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "게시글 삭제에 실패했습니다.");
        }
        
        alert("게시글이 삭제되었습니다.");
        goToList();
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 목록으로 이동
function goToList() {
    window.location.href = "index.html";
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}