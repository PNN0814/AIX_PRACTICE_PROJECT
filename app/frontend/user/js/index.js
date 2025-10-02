// API URL 설정
const API_URL = "/board/list"; // JSON 요청 시 동일 URL, Accept 헤더 사용

let currentPage = 1;
const pageSize = 10;
let currentSearchType = "all";
let currentSearchKeyword = "";

// 로그아웃
function logout() {
    alert("로그아웃 되었습니다.");
    window.location.href = "/logout";
}

// 게시글 화면 표시 함수 (테이블용)
function displayPosts(posts) {
    const tbody = document.getElementById("postList");
    tbody.innerHTML = ""; // 기존 내용 초기화

    if (posts.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="4">게시글이 없습니다.</td>`;
        tbody.appendChild(tr);
        return;
    }

    posts.forEach(post => {
        const tr = document.createElement("tr");
        tr.dataset.boardSeq = post.board_seq;

        tr.innerHTML = `
            <td>${escapeHtml(post.board_title)}</td>
            <td>${escapeHtml(post.user_id)}</td>
            <td>${formatDate(post.board_create_date)}</td>
            <td>${post.board_view}</td>
        `;

        // 클릭 시 상세 페이지 이동
        tr.addEventListener("click", () => goToDetail(post.board_seq));

        tbody.appendChild(tr);
    });
}

// 페이지네이션 (총 개수 모름 → 다음페이지 여부만 표시)
function displayPagination(page, hasNext) {
    const paging = document.getElementById("paging");
    let html = "";

    // « 처음
    if (page > 1) {
        html += `<button onclick="loadPosts(1)">«</button>`;
    } else {
        html += `<button disabled>«</button>`;
    }

    // ‹ 이전
    if (page > 1) {
        html += `<button onclick="loadPosts(${page - 1})">‹</button>`;
    } else {
        html += `<button disabled>‹</button>`;
    }

    // 현재 페이지
    html += `<span style="margin:0 10px; font-weight:bold;">${page}</span>`;

    // › 다음
    if (hasNext) {
        html += `<button onclick="loadPosts(${page + 1})">›</button>`;
    } else {
        html += `<button disabled>›</button>`;
    }

    // » 마지막 (총 개수를 모르므로 "다음이 있으면 활성화"만 가능)
    if (hasNext) {
        html += `<button onclick="loadPosts(${page + 1})">»</button>`;
    } else {
        html += `<button disabled>»</button>`;
    }

    paging.innerHTML = html;
}

// 게시글 목록 로드 (JSON)
async function loadPosts(page = 1) {
    try {
        let url = `${API_URL}?page=${page}&size=${pageSize + 1}`;

        if (currentSearchKeyword && currentSearchType) {
            url += `&search_type=${currentSearchType}&search_keyword=${encodeURIComponent(currentSearchKeyword)}`;
        }

        const response = await fetch(url, {
            headers: { "Accept": "application/json" }
        });
        if (!response.ok) throw new Error("게시글을 불러오는데 실패했습니다.");

        const posts = await response.json();

        const hasNext = posts.length > pageSize;
        const displayPostsData = posts.slice(0, pageSize);

        displayPosts(displayPostsData);
        displayPagination(page, hasNext);

        currentPage = page;

    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 상세 페이지 이동
function goToDetail(boardSeq) {
    window.location.href = `/board/readPage/${boardSeq}`;
}

// 글쓰기 이동
function goToWrite() {
    window.location.href = "/board/createPage";
}

// 유틸: 날짜 포맷
function formatDate(dateString) {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
}

// 유틸: XSS 방지
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// 검색 처리
document.getElementById("searchForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    currentSearchType = document.getElementById("filterField").value;
    currentSearchKeyword = document.getElementById("q").value.trim();
    loadPosts(1);
});

// DOMContentLoaded 이벤트
document.addEventListener("DOMContentLoaded", () => {
    loadPosts(1);

    document.getElementById("openWrite").addEventListener("click", goToWrite);

    const logoutBtn = document.getElementById("doLogout");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const myBtn = document.getElementById("goMy");
    if (myBtn) {
        myBtn.addEventListener("click", () => {
            window.location.href = "../html/mypage.html";
        });
    }
});
