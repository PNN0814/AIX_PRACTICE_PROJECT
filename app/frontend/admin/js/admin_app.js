/* ============================================================
   관리자 대시보드 JS - CRUD 완성본
   - 탭 전환, 유저/게시글 CRUD
   - 백엔드 API 연동 준비 완료
   ============================================================ */

const API_BASE = "http://127.0.0.1:8000";

/* ========== 공통 유틸 ========== */
function me(){ try{ return JSON.parse(localStorage.getItem('user')||'null'); }catch(e){ return null; } }
function toast(msg){ alert(msg); }
function esc(s){ const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; }

/* ========== 접근 제어 ========== */
// // TODO: 백엔드에서 로그인 시 user_role=ADMIN 반환 필수
// const u = me();
// if(!(u && (u.user_role==='ADMIN' || u.user_id==='admin'))){
//   toast('관리자만 접근 가능합니다.');
//   location.href='/admin';
// }

/* ========== 로그아웃 ========== */
document.getElementById('adminLogout')?.addEventListener('click', ()=>{
  if(confirm('로그아웃 하시겠습니까?')){
    localStorage.removeItem('user');
    location.href='/admin/loginPage';
  }
});

/* ========== 탭 전환 ========== */
const segBtns = document.querySelectorAll('.admin-seg__btn');
const panels  = document.querySelectorAll('.admin-card .admin-tab-panel');
let loaded = { users:false, posts:false };

function showTab(which){
  segBtns.forEach(b=>b.classList.toggle('is-active', b.dataset.tab===which));
  panels.forEach(p=>p.classList.toggle('is-active', p.id===`admin-tab-${which}`));
  if(which==='users' && !loaded.users) loadUsers();
  if(which==='posts' && !loaded.posts) loadPosts();
}
segBtns.forEach(btn=>btn.addEventListener('click', ()=>showTab(btn.dataset.tab)));
showTab('users'); // 초기 로드

/* ========================================================================
   유저 관리 CRUD
   ======================================================================== */

const userTbody = document.getElementById('userTbody');

// ========== READ: 유저 목록 조회 ==========
async function loadUsers(){
  try{
    /* TODO 백엔드:
       GET /admin/users
       - 응답: { items: [{no_seq, user_id, user_email, user_addr1, user_addr2, user_delete_yn, ...}] }
       - 관리자 권한 체크 필수
    */
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${u?.token || ''}` }
    });
    
    if(!res.ok) throw new Error('유저 목록 조회 실패');
    
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.items || []);
    renderUsers(list);
    loaded.users = true;
  }catch(e){
    console.error(e);
    // 임시 데이터 (개발용)
    renderUsers([
      {no_seq:1, user_id:'testuser1', user_email:'test1@example.com', user_addr1:'서울시', user_addr2:'강남구', user_delete_yn:'N'},
      {no_seq:2, user_id:'testuser2', user_email:'test2@example.com', user_addr1:'경기도', user_addr2:'성남시', user_delete_yn:'N'},
    ]);
  }
}

function renderUsers(arr){
  userTbody.innerHTML = '';
  arr.forEach(x=>{
    const tr = document.createElement('tr');
    const statusText = x.user_delete_yn === 'Y' ? '비활성' : '활성';
    const statusColor = x.user_delete_yn === 'Y' ? '#ef4444' : '#10b981';
    
    tr.innerHTML = `
      <td>${esc(x.no_seq ?? '')}</td>
      <td><a href="#" class="link-detail" data-id="${x.no_seq}">${esc(x.user_id ?? '')}</a></td>
      <td>${esc(x.user_email ?? '')}</td>
      <td>${esc(((x.user_addr1||'')+' '+(x.user_addr2||'')).trim() || '-')}</td>
      <td><span style="color:${statusColor}; font-weight:600;">${statusText}</span></td>
      <td>
        <button class="btn ghost" style="font-size:13px; padding:6px 10px;" data-act="detail" data-id="${x.no_seq}">상세</button>
        <button class="btn ghost" style="font-size:13px; padding:6px 10px;" data-act="edit" data-id="${x.no_seq}">정보수정</button>
        <button class="btn admin" style="font-size:13px; padding:6px 10px;" data-act="pw" data-id="${x.no_seq}">비번변경</button>
        <button class="btn danger" style="font-size:13px; padding:6px 10px;" data-act="del" data-id="${x.no_seq}">비활성화</button>
      </td>`;
    userTbody.appendChild(tr);
  });

  // 이벤트 바인딩
  userTbody.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>onUserAction(b.dataset.act, Number(b.dataset.id));
  });
  userTbody.querySelectorAll('.link-detail').forEach(a=>{
    a.onclick = (e)=>{
      e.preventDefault();
      onUserAction('detail', Number(a.dataset.id));
    };
  });
}

// ========== CREATE: 유저 추가 ==========
document.getElementById('btnAddUser')?.addEventListener('click', ()=>{
  document.getElementById('formAddUser').reset();
  modalAddUser.showModal();
});

document.getElementById('formAddUser').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const payload = {
    user_id: f.user_id.value.trim(),
    user_pw: f.user_pw.value,
    user_email: f.user_email.value.trim(),
    user_addr1: f.user_addr1.value.trim(),
    user_addr2: f.user_addr2.value.trim(),
  };

  if(!payload.user_id || !payload.user_pw || !payload.user_email){
    toast('필수 항목을 입력해주세요.');
    return;
  }

  try{
    /* TODO 백엔드:
       POST /admin/users
       - 요청 body: {user_id, user_pw, user_email, user_addr1, user_addr2}
       - 응답: {success: true, no_seq: 123} 등
       - 중복 아이디 체크
       - 비밀번호 해싱 필요
    */
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${u?.token || ''}`
      },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'유저 추가 실패'}));
      toast(err.detail || '유저 추가 실패');
      return;
    }

    toast('유저가 추가되었습니다.');
    modalAddUser.close();
    loadUsers();
  }catch(err){
    console.error(err);
    toast('네트워크 오류');
    // 임시: 모달 닫고 새로고침
    modalAddUser.close();
    loadUsers();
  }
});

// ========== UPDATE: 유저 정보 수정 & 비밀번호 변경 & 비활성화 ==========
async function onUserAction(act, no_seq){
  if(!no_seq){ toast('유효하지 않은 사용자'); return; }

  // 상세 조회
  if(act === 'detail'){
    try{
      /* TODO 백엔드:
         GET /admin/users/{no_seq}
         - 응답: {no_seq, user_id, user_email, user_addr1, user_addr2, user_delete_yn, create_date, ...}
      */
      const res = await fetch(`${API_BASE}/admin/users/${no_seq}`, {
        headers: { 'Authorization': `Bearer ${u?.token || ''}` }
      });
      
      if(!res.ok) throw new Error('유저 정보 조회 실패');
      
      const user = await res.json();
      
      const content = `
        <div style="display:grid; gap:12px;">
          <div><strong>no_seq:</strong> ${esc(user.no_seq)}</div>
          <div><strong>아이디:</strong> ${esc(user.user_id)}</div>
          <div><strong>이메일:</strong> ${esc(user.user_email)}</div>
          <div><strong>주소:</strong> ${esc((user.user_addr1||'')+' '+(user.user_addr2||'')) || '-'}</div>
          <div><strong>상태:</strong> ${user.user_delete_yn === 'Y' ? '비활성' : '활성'}</div>
          <div><strong>가입일:</strong> ${esc((user.create_date||'').split('T')[0])}</div>
        </div>
      `;
      
      document.getElementById('userDetailContent').innerHTML = content;
      modalUserDetail.showModal();
    }catch(err){
      console.error(err);
      toast('유저 정보를 불러올 수 없습니다.');
    }
    return;
  }

  // 정보 수정
  if(act === 'edit'){
    try{
      /* TODO 백엔드:
         GET /admin/users/{no_seq}
         - 현재 정보를 불러와서 폼에 채움
      */
      const res = await fetch(`${API_BASE}/admin/users/${no_seq}`, {
        headers: { 'Authorization': `Bearer ${u?.token || ''}` }
      });
      
      if(!res.ok) throw new Error('유저 정보 조회 실패');
      
      const user = await res.json();
      const f = document.getElementById('formEditUser');
      f.no_seq.value = user.no_seq;
      f.user_id.value = user.user_id;
      f.user_email.value = user.user_email || '';
      f.user_addr1.value = user.user_addr1 || '';
      f.user_addr2.value = user.user_addr2 || '';
      
      modalEditUser.showModal();
    }catch(err){
      console.error(err);
      toast('유저 정보를 불러올 수 없습니다.');
    }
    return;
  }

  // 비밀번호 변경
  if(act === 'pw'){
    try{
      const res = await fetch(`${API_BASE}/admin/users/${no_seq}`, {
        headers: { 'Authorization': `Bearer ${u?.token || ''}` }
      });
      
      if(!res.ok) throw new Error('유저 정보 조회 실패');
      
      const user = await res.json();
      const f = document.getElementById('formChangePw');
      f.no_seq.value = user.no_seq;
      f.user_id.value = user.user_id;
      f.new_pw.value = '';
      f.confirm_pw.value = '';
      
      modalChangePw.showModal();
    }catch(err){
      console.error(err);
      toast('유저 정보를 불러올 수 없습니다.');
    }
    return;
  }

  // 비활성화
  if(act === 'del'){
    if(!confirm('이 유저를 비활성화 처리하시겠습니까?')) return;
    
    try{
      /* TODO 백엔드:
         PATCH /admin/users/{no_seq}/deactivate
         - 응답: {success: true}
         - user_delete_yn = 'Y' 처리
      */
      const res = await fetch(`${API_BASE}/admin/users/${no_seq}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${u?.token || ''}`
        }
      });

      if(!res.ok){
        const err = await res.json().catch(()=>({detail:'비활성화 실패'}));
        toast(err.detail || '비활성화 실패');
        return;
      }

      toast('유저가 비활성화되었습니다.');
      loadUsers();
    }catch(err){
      console.error(err);
      toast('네트워크 오류');
      loadUsers();
    }
  }
}

// 유저 정보 수정 submit
document.getElementById('formEditUser').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const no_seq = Number(f.no_seq.value);
  const payload = {
    user_email: f.user_email.value.trim(),
    user_addr1: f.user_addr1.value.trim(),
    user_addr2: f.user_addr2.value.trim(),
  };

  try{
    /* TODO 백엔드:
       PATCH /admin/users/{no_seq}
       - 요청 body: {user_email, user_addr1, user_addr2}
       - 응답: {success: true}
    */
    const res = await fetch(`${API_BASE}/admin/users/${no_seq}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${u?.token || ''}`
      },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'수정 실패'}));
      toast(err.detail || '수정 실패');
      return;
    }

    toast('유저 정보가 수정되었습니다.');
    modalEditUser.close();
    loadUsers();
  }catch(err){
    console.error(err);
    toast('네트워크 오류');
  }
});

// 비밀번호 변경 submit
document.getElementById('formChangePw').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const no_seq = Number(f.no_seq.value);
  const newPw = f.new_pw.value;
  const confirmPw = f.confirm_pw.value;

  if(newPw !== confirmPw){
    toast('비밀번호가 일치하지 않습니다.');
    return;
  }

  if(newPw.length < 8){
    toast('비밀번호는 8자 이상이어야 합니다.');
    return;
  }

  try{
    /* TODO 백엔드:
       PATCH /admin/users/{no_seq}/password
       - 요청 body: {new_password: "..."}
       - 응답: {success: true}
       - 비밀번호 해싱 필요
    */
    const res = await fetch(`${API_BASE}/admin/users/${no_seq}/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${u?.token || ''}`
      },
      body: JSON.stringify({ new_password: newPw })
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'비밀번호 변경 실패'}));
      toast(err.detail || '비밀번호 변경 실패');
      return;
    }

    toast('비밀번호가 변경되었습니다.');
    modalChangePw.close();
  }catch(err){
    console.error(err);
    toast('네트워크 오류');
  }
});

/* ========================================================================
   게시글 관리 CRUD
   ======================================================================== */

const postTbody = document.getElementById('postTbody');

// ========== READ: 게시글 목록 조회 ==========
async function loadPosts(){
  try{
    /* TODO 백엔드:
       GET /admin/posts
       - 응답: { items: [{id, title, author, content, create_date, views, is_pinned, ...}] }
       - 상단고정 게시글 우선 정렬
    */
    const res = await fetch(`${API_BASE}/admin/posts`, {
      headers: { 'Authorization': `Bearer ${u?.token || ''}` }
    });
    
    if(!res.ok) throw new Error('게시글 목록 조회 실패');
    
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    renderPosts(items);
    loaded.posts = true;
  }catch(e){
    console.error(e);
    // 임시 데이터 (개발용)
    renderPosts([
      {id:1, title:'공지: 시스템 점검 안내', author:'admin', create_date:'2025-01-15T10:00:00', views:120, is_pinned:true},
      {id:2, title:'테스트 게시글', author:'testuser1', create_date:'2025-01-14T15:30:00', views:45, is_pinned:false},
    ]);
  }
}

function renderPosts(items){
  postTbody.innerHTML = '';
  items.forEach(p=>{
    const tr = document.createElement('tr');
    const pinIcon = p.is_pinned ? '📌' : '-';
    const pinColor = p.is_pinned ? '#ef4444' : '#9ca3af';
    
    tr.innerHTML = `
      <td>${esc(p.id)}</td>
      <td><a href="#" class="link-detail" data-id="${p.id}">${esc(p.title)}</a></td>
      <td>${esc(p.author)}</td>
      <td>${esc((p.create_date||'').toString().split('T')[0])}</td>
      <td>${esc(p.views ?? 0)}</td>
      <td><span style="color:${pinColor}; font-size:16px;">${pinIcon}</span></td>
      <td>
        <button class="btn ghost" style="font-size:13px; padding:6px 10px;" data-act="detail" data-id="${p.id}">상세</button>
        <button class="btn ghost" style="font-size:13px; padding:6px 10px;" data-act="edit" data-id="${p.id}">수정</button>
        <button class="btn admin" style="font-size:13px; padding:6px 10px;" data-act="pin" data-id="${p.id}">고정토글</button>
        <button class="btn danger" style="font-size:13px; padding:6px 10px;" data-act="del" data-id="${p.id}">삭제</button>
      </td>`;
    postTbody.appendChild(tr);
  });

  // 이벤트 바인딩
  postTbody.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>onPostAction(b.dataset.act, Number(b.dataset.id));
  });
  postTbody.querySelectorAll('.link-detail').forEach(a=>{
    a.onclick = (e)=>{
      e.preventDefault();
      onPostAction('detail', Number(a.dataset.id));
    };
  });
}

// ========== CREATE: 공지 작성 ==========
document.getElementById('btnAddNotice')?.addEventListener('click', ()=>{
  document.getElementById('formAddNotice').reset();
  modalAddNotice.showModal();
});

document.getElementById('formAddNotice').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const payload = {
    title: f.title.value.trim(),
    content: f.content.value.trim(),
    is_pinned: f.is_pinned.checked,
    author: u?.user_id || 'admin', // 현재 관리자 ID
  };

  if(!payload.title || !payload.content){
    toast('제목과 내용을 입력해주세요.');
    return;
  }

  try{
    /* TODO 백엔드:
       POST /admin/posts
       - 요청 body: {title, content, is_pinned, author}
       - 응답: {success: true, id: 123}
       - 공지사항 타입 구분 필요시 type 필드 추가
    */
    const res = await fetch(`${API_BASE}/admin/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${u?.token || ''}`
      },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'공지 작성 실패'}));
      toast(err.detail || '공지 작성 실패');
      return;
    }

    toast('공지사항이 작성되었습니다.');
    modalAddNotice.close();
    loadPosts();
  }catch(err){
    console.error(err);
    toast('네트워크 오류');
    // 임시: 모달 닫고 새로고침
    modalAddNotice.close();
    loadPosts();
  }
});

// ========== UPDATE & DELETE: 게시글 액션 ==========
async function onPostAction(act, id){
  if(!id){ toast('유효하지 않은 게시글'); return; }

  // 상세 조회
  if(act === 'detail'){
    try{
      /* TODO 백엔드:
         GET /admin/posts/{id}
         - 응답: {id, title, content, author, create_date, views, is_pinned, ...}
      */
      const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${u?.token || ''}` }
      });
      
      if(!res.ok) throw new Error('게시글 조회 실패');
      
      const post = await res.json();
      
      const content = `
        <div style="display:grid; gap:12px;">
          <div><strong>ID:</strong> ${esc(post.id)}</div>
          <div><strong>제목:</strong> ${esc(post.title)}</div>
          <div><strong>작성자:</strong> ${esc(post.author)}</div>
          <div><strong>작성일:</strong> ${esc((post.create_date||'').split('T')[0])}</div>
          <div><strong>조회수:</strong> ${esc(post.views ?? 0)}</div>
          <div><strong>상단고정:</strong> ${post.is_pinned ? '예' : '아니오'}</div>
          <div style="margin-top:8px; padding-top:12px; border-top:1px solid #e5e7eb;">
            <strong>내용:</strong><br/>
            <div style="margin-top:8px; padding:12px; background:#f9fafb; border-radius:8px; white-space:pre-wrap;">
              ${esc(post.content)}
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('postDetailContent').innerHTML = content;
      modalPostDetail.showModal();
    }catch(err){
      console.error(err);
      toast('게시글을 불러올 수 없습니다.');
    }
    return;
  }

  // 수정
  if(act === 'edit'){
    try{
      const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        headers: { 'Authorization': `Bearer ${u?.token || ''}` }
      });
      
      if(!res.ok) throw new Error('게시글 조회 실패');
      
      const post = await res.json();
      const f = document.getElementById('formEditPost');
      f.id.value = post.id;
      f.title.value = post.title || '';
      f.content.value = post.content || '';
      
      modalEditPost.showModal();
    }catch(err){
      console.error(err);
      toast('게시글을 불러올 수 없습니다.');
    }
    return;
  }

  // 상단고정 토글
  if(act === 'pin'){
    try{
      /* TODO 백엔드:
         PATCH /admin/posts/{id}/pin
         - 응답: {success: true, is_pinned: true/false}
         - is_pinned 값을 반대로 토글
      */
      const res = await fetch(`${API_BASE}/admin/posts/${id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${u?.token || ''}`
        }
      });

      if(!res.ok){
        const err = await res.json().catch(()=>({detail:'상단고정 실패'}));
        toast(err.detail || '상단고정 실패');
        return;
      }

      const result = await res.json();
      toast(result.is_pinned ? '상단에 고정되었습니다.' : '고정이 해제되었습니다.');
      loadPosts();
    }catch(err){
      console.error(err);
      toast('네트워크 오류');
      loadPosts();
    }
    return;
  }

  // 삭제
  if(act === 'del'){
    if(!confirm('정말 삭제하시겠습니까?')) return;
    
    try{
      /* TODO 백엔드:
         DELETE /admin/posts/{id}
         - 응답: {success: true}
         - 실제 삭제 또는 delete_yn='Y' 처리
      */
      const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${u?.token || ''}`
        }
      });

      if(!res.ok){
        const err = await res.json().catch(()=>({detail:'삭제 실패'}));
        toast(err.detail || '삭제 실패');
        return;
      }

      toast('게시글이 삭제되었습니다.');
      loadPosts();
    }catch(err){
      console.error(err);
      toast('네트워크 오류');
      loadPosts();
    }
  }
}

// 게시글 수정 submit
document.getElementById('formEditPost').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const id = Number(f.id.value);
  const payload = {
    title: f.title.value.trim(),
    content: f.content.value.trim(),
  };

  if(!payload.title || !payload.content){
    toast('제목과 내용을 입력해주세요.');
    return;
  }

  try{
    /* TODO 백엔드:
       PATCH /admin/posts/{id}
       - 요청 body: {title, content}
       - 응답: {success: true}
    */
    const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${u?.token || ''}`
      },
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'수정 실패'}));
      toast(err.detail || '수정 실패');
      return;
    }

    toast('게시글이 수정되었습니다.');
    modalEditPost.close();
    loadPosts();
  }catch(err){
    console.error(err);
    toast('네트워크 오류');
  }
});
