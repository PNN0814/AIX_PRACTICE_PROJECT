const API_BASE = "http://127.0.0.1:8000";

// 페이지 접근 제어
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (!user || !(user.user_role === 'ADMIN' || user.user_id === 'admin')) {
  alert('관리자만 접근 가능합니다.');
  location.href = '/';
}

// 게시글 불러오기
async function loadPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  const posts = await res.json();
  const tbody = document.querySelector("#adminPosts tbody");
  tbody.innerHTML = '';
  posts.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.title}</td>
      <td>${p.author}</td>
      <td>${(p.create_date || '').split('T')[0]}</td>
      <td>${p.views}</td>
      <td>
        <button onclick="deletePost(${p.id})">삭제</button>
        <button onclick="pinPost(${p.id})">상단고정</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 회원 불러오기
async function loadUsers() {
  const res = await fetch(`${API_BASE}/users`);
  const users = await res.json();
  const tbody = document.querySelector("#adminUsers tbody");
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.user_id}</td>
      <td>${u.user_email}</td>
      <td>${u.user_status}</td>
      <td>
        <button onclick="editUser('${u.user_id}')">수정</button>
        <button onclick="deleteUser('${u.user_id}')">삭제</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deletePost(id) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  await fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' });
  loadPosts();
}

async function pinPost(id) {
  await fetch(`${API_BASE}/posts/${id}/pin`, { method: 'PATCH' });
  loadPosts();
}

async function deleteUser(id) {
  if (!confirm('회원 탈퇴 처리하시겠습니까?')) return;
  await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
  loadUsers();
}

function editUser(id) {
  alert(`${id} 회원 수정 기능 (추후 구현)`);
}

loadPosts();
loadUsers();
