// API URL 설정
const API_URL = "http://localhost:8000";

let currentPage = 1;
const pageSize = 10;
let currentSearchType = "all";
let currentSearchKeyword = "";

// 로그인 확인
function checkLogin() {
    const userSeq = localStorage.getItem("user_seq");
    const userId = localStorage.getItem("user_id");

    const guestMenu = document.getElementById("guestMenu");
    const memberMenu = document.getElementById("memberMenu");
    const helloUser = document.getElementById("helloUser");

    if (!userSeq || !userId) {
        guestMenu.classList.remove("hidden");
        memberMenu.classList.add("hidden");
        return false;
    }

    guestMenu.classList.add("hidden");
    memberMenu.classList.remove("hidden");
    helloUser.textContent = `👋 ${userId} 님 환영합니다!`;

    return true;
}

// 로그아웃
function logout() {
    localStorage.removeItem("user_seq");
    localStorage.removeItem("user_id");
    alert("로그아웃 되었습니다.");
    location.reload();
}

// 게시글 목록 로드 (배열 응답 기준)
async function loadPosts(page = 1) {
    try {
        // 다음 페이지 확인 위해 +1
        let url = `${API_URL}/board/list?page=${page}&size=${pageSize + 1}`;

        if (currentSearchKeyword && currentSearchType) {
            url += `&search_type=${currentSearchType}&search_keyword=${encodeURIComponent(currentSearchKeyword)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("게시글을 불러오는데 실패했습니다.");

        const posts = await response.json();

        // 다음 페이지 여부
        const hasNext = posts.length > pageSize;

        // 실제 표시 목록
        const displayPostsData = posts.slice(0, pageSize);

        displayPosts(displayPostsData);
        displayPagination(page, hasNext);

        currentPage = page;

        // 검색어 유지
        document.getElementById("searchType").value = currentSearchType;
        document.getElementById("searchKeyword").value = currentSearchKeyword;
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

// 게시글 출력
function displayPosts(posts) {
    const postList = document.getElementById("postList");

    if (!posts || posts.length === 0) {
        postList.innerHTML = `
            <tr><td colspan="5" style="text-align:center; padding:20px;">📭 게시글이 없습니다.</td></tr>
        `;
        return;
    }

    postList.innerHTML = posts.map(post => `
        <tr onclick="goToDetail(${post.board_seq})" style="cursor:pointer;">
            <td>${escapeHtml(post.board_title)}</td>
            <td>${escapeHtml(post.user_id)}</td>
            <td>${formatDate(post.board_create_date)}</td>
            <td>${post.board_view}</td>
            <td>${post.comment_count}</td>
        </tr>
    `).join("");
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

// 상세 페이지 이동
function goToDetail(boardSeq) {
    window.location.href = `board_detail.html?seq=${boardSeq}`;
}

// 글쓰기 이동
function goToWrite() {
    if (!checkLogin()) {
        alert("로그인이 필요합니다.");
        window.location.href = "../html/login.html";
        return;
    }
    window.location.href = "board_write.html";
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

// DOMContentLoaded 이벤트
document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    loadPosts(1);

    // 검색
    document.getElementById("searchForm").addEventListener("submit", (e) => {
        e.preventDefault();
        currentSearchType = document.getElementById("searchType").value;
        currentSearchKeyword = document.getElementById("searchKeyword").value.trim();
        loadPosts(1);
    });

    // 글쓰기 버튼
    document.getElementById("openWrite").addEventListener("click", goToWrite);

    // 로그아웃 버튼
    const logoutBtn = document.getElementById("doLogout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }

    // ✅ 내정보 버튼
    const myBtn = document.getElementById("goMy");
    if (myBtn) {
        myBtn.addEventListener("click", () => {
            window.location.href = "../html/mypage.html";
        });
    }
});
