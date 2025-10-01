// API URL 설정
const API_URL = "http://localhost:8000";

// URL에서 게시글 번호 가져오기 (수정 모드인 경우)
const urlParams = new URLSearchParams(window.location.search);
const boardSeq = urlParams.get("seq");

let currentUserSeq = null;
let isEditMode = false;

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
    
    if (boardSeq) {
        // 수정 모드
        isEditMode = true;
        document.getElementById("pageTitle").textContent = "✏️ 게시글 수정";
        document.querySelector(".btn-submit").textContent = "수정";
        loadBoardForEdit();
    }
});

// 수정할 게시글 로드
async function loadBoardForEdit() {
    try {
        const response = await fetch(`${API_URL}/board/${boardSeq}`);
        
        if (!response.ok) {
            throw new Error("게시글을 불러오는데 실패했습니다.");
        }
        
        const board = await response.json();
        
        // 작성자 확인
        if (board.user_seq !== currentUserSeq) {
            alert("수정 권한이 없습니다.");
            goBack();
            return;
        }
        
        // 폼에 데이터 채우기
        document.getElementById("title").value = board.board_title;
        document.getElementById("content").value = board.board_content;
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
        goBack();
    }
}

// 게시글 등록/수정
async function submitBoard() {
    const title = document.getElementById("title").value.trim();
    const content = document.getElementById("content").value.trim();
    
    // 유효성 검사
    if (!title) {
        alert("제목을 입력해주세요.");
        document.getElementById("title").focus();
        return;
    }
    
    if (title.length > 200) {
        alert("제목은 200자를 초과할 수 없습니다.");
        document.getElementById("title").focus();
        return;
    }
    
    if (!content) {
        alert("내용을 입력해주세요.");
        document.getElementById("content").focus();
        return;
    }
    
    if (content.length > 5000) {
        alert("내용은 5000자를 초과할 수 없습니다.");
        document.getElementById("content").focus();
        return;
    }
    
    try {
        let url, method, body;
        
        if (isEditMode) {
    // 수정 모드
    url = `${API_URL}/board/${boardSeq}?user_seq=${currentUserSeq}`;
    method = "PATCH";
    body = JSON.stringify({
        board_title: title,
        board_content: content
    });
} else {
    // 작성 모드
    url = `${API_URL}/board/create?user_seq=${currentUserSeq}`; // <-- 쿼리스트링 추가!
    method = "POST";
    body = JSON.stringify({
        board_title: title,
        board_content: content
    });
}
        
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: body
        });
        
        if (!response.ok) {
            const error = await response.json();
            // detail이 객체일 경우 문자열로 변환
            let errorMsg = error.detail;
            if (typeof errorMsg === "object") {
                errorMsg = JSON.stringify(errorMsg);
            }
            throw new Error(errorMsg || "게시글 저장에 실패했습니다.");
        }
        
        const result = await response.json();
        
        alert(isEditMode ? "게시글이 수정되었습니다." : "게시글이 작성되었습니다.");
        window.location.href = `board_detail.html?seq=${result.board_seq}`;
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 취소/뒤로가기
function goBack() {
    if (confirm("작성을 취소하시겠습니까?")) {
        if (isEditMode && boardSeq) {
            window.location.href = `board_detail.html?seq=${boardSeq}`;
        } else {
            window.location.href = "index.html";
        }
    }
}