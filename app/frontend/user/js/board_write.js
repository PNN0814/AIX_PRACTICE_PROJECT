// API URL 설정
const API_URL = "http://localhost:8000";

// URL에서 게시글 번호 가져오기 (수정 모드인 경우)
// const urlParams = new URLSearchParams(window.location.search);
// const boardSeq = urlParams.get("seq");

const userSeq = document.getElementById("no_seq").value;
const userId = document.getElementById("user_id").value;
const boardSeq = document.getElementById("board_seq").value;

let currentUserSeq = null;
let isEditMode = false;
let selectedFiles = []; // 선택된 파일들
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_COUNT = 5;

// 로그인 정보 확인
function checkLogin() {
    if (!userSeq || !userId) {
        alert("로그인이 필요합니다.");
        window.location.href = "/";
        return false;
    }
    
    currentUserSeq = parseInt(userSeq);
    return true;
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    if (!checkLogin()) return;
    
    // 파일 선택 이벤트 리스너
    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
        fileInput.addEventListener("change", handleFileSelect);
    }

    if (boardSeq) {
        // 수정 모드
        isEditMode = true;
        document.getElementById("pageTitle").textContent = "✏️ 게시글 수정";
        document.querySelector(".btn-submit").textContent = "수정";
        loadBoardForEdit();
    }
});

// 파일 선택 처리
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    
    // 파일 개수 체크
    if (selectedFiles.length + files.length > MAX_FILE_COUNT) {
        alert(`파일은 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
        event.target.value = "";
        return;
    }
    
    // 각 파일 검증
    for (const file of files) {
        // 파일 크기 체크
        if (file.size > MAX_FILE_SIZE) {
            alert(`${file.name}의 크기가 10MB를 초과합니다.`);
            continue;
        }
        
        // 중복 체크
        if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            alert(`${file.name}은 이미 추가되었습니다.`);
            continue;
        }
        
        selectedFiles.push(file);
    }
    
    // 파일 목록 표시
    displayFileList();
    
    // input 초기화 (같은 파일 다시 선택 가능하도록)
    event.target.value = "";
}

// 파일 목록 표시
function displayFileList() {
    const fileListDiv = document.getElementById("fileList");
    
    if (!fileListDiv) return;
    
    if (selectedFiles.length === 0) {
        fileListDiv.innerHTML = "";
        return;
    }
    
    fileListDiv.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info-detail">
                <span class="file-icon">${getFileIcon(file.name)}</span>
                <div class="file-text">
                    <span class="file-name">${escapeHtml(file.name)}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
            </div>
            <button type="button" class="btn-file-remove" onclick="removeFile(${index})">✕</button>
        </div>
    `).join("");
}

// 파일 제거
function removeFile(index) {
    selectedFiles.splice(index, 1);
    displayFileList();
}

// 파일 아이콘 반환
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
        'pdf': '📄',
        'doc': '📝', 'docx': '📝',
        'xls': '📊', 'xlsx': '📊',
        'txt': '📃',
        'zip': '📦', 'rar': '📦'
    };
    return icons[ext] || '📎';
}

// 파일 크기 포맷
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

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
    
    // 파일 업로드는 아직 서버가 지원하지 않습니다
    if (selectedFiles.length > 0) {
        alert("파일 업로드 기능은 준비중입니다. 텍스트만 작성해주세요.");
        selectedFiles = [];
        displayFileList();
        return;
    }

    try {
        // 버튼 비활성화
        const submitBtn = document.querySelector(".btn-submit");
        submitBtn.disabled = true;
        submitBtn.textContent = "저장 중...";

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
        window.location.href = `/board/readPage/${result.board_seq}`;
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 취소/뒤로가기
function goBack() {
    if (confirm("작성을 취소하시겠습니까?")) {
        if (isEditMode && boardSeq) {
            window.location.href = `/board/readPage/${boardSeq}`;
        } else {
            window.location.href = "/board/list";
        }
    }
}