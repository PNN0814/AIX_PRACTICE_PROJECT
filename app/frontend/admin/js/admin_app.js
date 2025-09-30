/* ============================================================
   admin_app.js (FINAL, 경로 맞춤)
   관리자 대시보드: 탭(유저/게시글) + CRUD 액션
   ============================================================ */

const API_BASE = "http://127.0.0.1:8000";

/* 공통 */
function me(){ try{ return JSON.parse(localStorage.getItem('user')||'null'); }catch(e){ return null; } }
function toast(msg){ alert(msg); }
function esc(s){ const d=document.createElement('div'); d.textContent=s??''; return d.innerHTML; }
async function tryFetch(urlOrList, init){
  const urls = Array.isArray(urlOrList) ? urlOrList : [urlOrList];
  let lastErr;
  for(const u of urls){
    try{
      const res = await fetch(u, init);
      if(!res.ok) throw await res.json().catch(()=>({detail:`HTTP ${res.status}`}));
      return res;
    }catch(e){ lastErr=e; }
  }
  throw lastErr || new Error('request failed');
}

/* 접근 제어 */
const u = me();
if(!(u && (u.user_role==='ADMIN' || u.user_id==='admin'))){
  toast('관리자만 접근 가능'); location.href='/app/admin/html/login.html';
}

/* 로그아웃 */
document.getElementById('adminLogout')?.addEventListener('click', ()=>{
  localStorage.removeItem('user');
  location.href='/app/admin/html/login.html';
});

/* 탭 전환 */
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
showTab('users');

/* ===== 유저 관리 ===== */
const userTbody = document.getElementById('userTbody');

async function loadUsers(){
  try{
    const res = await tryFetch(`${API_BASE}/userInfo`, {method:'GET'});
    const list = await res.json();
    renderUsers(Array.isArray(list)? list : (list.items||[]));
    loaded.users = true;
  }catch(e){
    console.error(e);
    userTbody.innerHTML = `<tr><td colspan="6">유저 목록을 불러오지 못했습니다.</td></tr>`;
  }
}

function renderUsers(arr){
  userTbody.innerHTML = '';
  arr.forEach(x=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${esc(x.no_seq ?? '')}</td>
      <td>${esc(x.user_id ?? '')}</td>
      <td>${esc(x.user_email ?? '')}</td>
      <td>${esc(((x.user_addr1||'')+' '+(x.user_addr2||'')).trim())}</td>
      <td>${esc(x.user_delete_yn || 'N')}</td>
      <td>
        <button class="btn ghost" data-act="edit" data-id="${x.no_seq}">정보수정</button>
        <button class="btn admin" data-act="pw"  data-id="${x.no_seq}">비번수정</button>
        <button class="btn danger" data-act="del" data-id="${x.no_seq}">비활성화</button>
      </td>`;
    userTbody.appendChild(tr);
  });

  userTbody.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>onUserAction(b.dataset.act, Number(b.dataset.id));
  });
}

async function onUserAction(act, no_seq){
  if(!no_seq){ toast('유효하지 않은 사용자입니다.'); return; }

  if(act==='edit'){
    const email = prompt('이메일(비우면 변경 안 함)');
    const addr1 = prompt('주소1(비우면 변경 안 함)');
    const addr2 = prompt('주소2(비우면 변경 안 함)');
    const payload = {};
    if(email) payload.user_email = email;
    if(addr1) payload.user_addr1 = addr1;
    if(addr2) payload.user_addr2 = addr2;
    if(Object.keys(payload).length===0){ toast('변경 내용이 없습니다.'); return; }
    try{
      await tryFetch([`${API_BASE}/admin/users/${no_seq}`, `${API_BASE}/users/${no_seq}`],{
        method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      toast('수정 완료'); loadUsers();
    }catch(e){ console.error(e); toast(e.detail || '수정 실패'); }

  }else if(act==='pw'){
    const npw = prompt('새 비밀번호 입력'); if(!npw) return;
    try{
      await tryFetch([`${API_BASE}/admin/users/${no_seq}/password`, `${API_BASE}/userPassword/${no_seq}`],{
        method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ new_password: npw })
      });
      toast('비밀번호 변경 완료');
    }catch(e){ console.error(e); toast(e.detail || '비밀번호 변경 실패'); }

  }else if(act==='del'){
    if(!confirm('이 사용자를 비활성화 처리할까요?')) return;
    try{
      await tryFetch([`${API_BASE}/userDeactivate/${no_seq}`, `${API_BASE}/admin/users/${no_seq}/deactivate`],{
        method:'PATCH'
      });
      toast('비활성화 완료'); loadUsers();
    }catch(e){ console.error(e); toast(e.detail || '비활성화 실패'); }
  }
}

/* ===== 게시글 관리 ===== */
const postTbody = document.getElementById('postTbody');

async function loadPosts(page=1,size=100){
  try{
    const res  = await tryFetch(`${API_BASE}/posts?page=${page}&size=${size}`, {method:'GET'});
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items||[]);
    renderPosts(items);
    loaded.posts = true;
  }catch(e){
    console.error(e);
    postTbody.innerHTML = `<tr><td colspan="6">게시글을 불러오지 못했습니다.</td></tr>`;
  }
}

function renderPosts(items){
  postTbody.innerHTML = '';
  items.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${esc(p.id)}</td>
      <td>${esc(p.title)}</td>
      <td>${esc(p.author)}</td>
      <td>${esc((p.create_date||'').toString().split('T')[0])}</td>
      <td>${esc(p.views ?? 0)}</td>
      <td>
        <button class="btn ghost"  data-act="edit" data-id="${p.id}">수정</button>
        <button class="btn danger" data-act="del"  data-id="${p.id}">삭제</button>
        <button class="btn admin"  data-act="pin"  data-id="${p.id}">상단고정</button>
      </td>`;
    postTbody.appendChild(tr);
  });

  postTbody.querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>onPostAction(b.dataset.act, Number(b.dataset.id));
  });
}

async function onPostAction(act, id){
  if(!id){ toast('유효하지 않은 게시글입니다.'); return; }

  if(act==='edit'){
    const title = prompt('새 제목 (비우면 변경 없음)'); if(!title){ toast('변경 없음'); return; }
    try{
      await tryFetch(`${API_BASE}/posts/${id}`,{
        method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title })
      });
      toast('수정 완료'); loadPosts();
    }catch(e){ console.error(e); toast(e.detail || '수정 실패'); }

  }else if(act==='del'){
    if(!confirm('정말 삭제할까요?')) return;
    try{
      await tryFetch(`${API_BASE}/posts/${id}`,{ method:'DELETE' });
      toast('삭제 완료'); loadPosts();
    }catch(e){ console.error(e); toast(e.detail || '삭제 실패'); }

  }else if(act==='pin'){
    try{
      await tryFetch(`${API_BASE}/posts/${id}/pin`,{
        method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ pinned:true })
      });
      toast('상단고정 처리 완료');
    }catch(e){
      console.error(e);
      toast('서버에 상단고정 API가 아직 없어요. 백엔드에 `/posts/{id}/pin` 추가 부탁!');
    }
  }
}

/* 초기 로드 */
loadUsers();
