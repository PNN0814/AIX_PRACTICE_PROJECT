// 필수 데이터 불러오기
const user_id   = document.getElementById("user_id").value;
const no_seq    = document.getElementById("no_seq").value;
const boardSeq  = document.getElementById("board_seq").value;

// 상세 페이지 JS
document.addEventListener("DOMContentLoaded", async () => {
    // 게시글 상세 불러오기
    try {
        const response = await fetch(`/board/${boardSeq}`, {
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
            throw new Error("게시글을 불러올 수 없습니다.");
        }

        const data = await response.json();

        const create_date = new Date(data.board_create_date);

        // 게시글 채우기
        document.getElementById("boardTitle").textContent = data.board_title;
        document.getElementById("boardAuthor").textContent = data.user_id;
        document.getElementById("boardDate").textContent = create_date.getFullYear()+"-"+(create_date.getMonth()+1)+"-"+("0" + create_date.getDate()).slice(-2);
        document.getElementById("boardViews").textContent = `조회수: ${data.board_view}`;
        document.getElementById("boardContent").innerHTML = data.board_content;
        if(user_id == data.user_id){
            document.getElementById("boardActions").innerHTML = `<button type="button" class="btn-edit" onclick="editBoard(${data.board_seq})">✏️ 수정</button><button type="button" class="btn-delete" onclick="deleteBoard(${data.board_seq})">🗑️ 삭제</button>`;

        }
    } catch (err) {
        console.error(err);
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
    }

    // 댓글 작성 이벤트
    document.getElementById("btn-comment-submit").addEventListener("click", async () => {
        const content = document.getElementById("commentContent").value;

        if (!content.trim()) {
            alert("댓글 내용을 입력해주세요.");
            return;
        } else if (content.length > 1000) {
            alert("댓글은 1000자를 초과할 수 없습니다.");
            return;
        }

        try {
            const res = await fetch(`/board/${boardSeq}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_seq: no_seq,
                    user_id: user_id,
                    comment_content: content
                })
            });

            if (!res.ok) {
                throw new Error("댓글 작성 실패");
            }

            document.getElementById("commentContent").value = "";
            loadComments(); // 댓글 다시 불러오기

        } catch (err) {
            console.error(err);
            alert("댓글 작성 중 오류 발생");
        }
    });

    // 댓글 불러오기 실행
    loadComments();
});

// 댓글 목록 불러오기
async function loadComments() {
    try {
        console.log("111");
        const res = await fetch(`/board/${boardSeq}/comments`, {
            headers: { "Accept": "application/json" }
        });

        console.log("1");

        if (!res.ok) {
            throw new Error("댓글을 불러올 수 없습니다.");
        }

        console.log("2");

        const comments = await res.json();
        const commentList = document.getElementById("commentList");
        const commentCount = document.getElementById("commentCount");

        commentList.innerHTML = "";
        commentCount.textContent = comments.length;

        comments.forEach(c => {
            const comment_create_date = new Date(c.comment_create_date);
            const div = document.createElement("div");
            div.classList.add("comment-item");
            
            div.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${c.user_id}</span>
                    <span class="comment-date">${comment_create_date.getFullYear()+"-"+(comment_create_date.getMonth()+1)+"-"+("0" + comment_create_date.getDate()).slice(-2)}</span>
                </div>
                <div class="comment-body">${c.comment_content}</div>
                ${no_seq == c.user_seq ? `
                <button class="btn-comment-delete" onclick="deleteComment(${c.comment_seq})">삭제</button>
            ` : ""}
            `;
            commentList.appendChild(div);
        });

    } catch (err) {
        console.error(err);
        alert("댓글을 불러오는 중 오류 발생");
    }
}

// 댓글 삭제
async function deleteComment(comment_seq) {
    if (!confirm("댓글을 삭제하시겠습니까?")) {
        return;
    }
    
    try {
        const response = await fetch(`/board/${boardSeq}/comments/${comment_seq}`, {
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

// 목록 이동
function goToList() {
    window.location.href = "/board/list";
}

// 수정 이동
function editBoard(boardSeq) {
    window.location.href = `/board/updatePage/${boardSeq}`;
}

// 삭제 처리
async function deleteBoard(boardSeq) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        const res = await fetch(`/board/${boardSeq}`, { method: "DELETE" });

        if (!res.ok) {
            throw new Error("삭제 실패");
        } else {
            alert("삭제가 정상적으로 되었습니다.");
            window.location.href = "/board/list";
        }
    } catch (err) {
        console.error(err);
        alert("삭제 중 오류 발생");
    }
}