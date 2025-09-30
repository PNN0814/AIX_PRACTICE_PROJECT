// /app/frontend/user/js/app.js
const API_BASE = "http://127.0.0.1:8000";

/* =======================
   인증/역할 (헤더 토글)
   ======================= */
const guestMenu = document.getElementById('guestMenu');
const memberMenu = document.getElementById('memberMenu');
const helloUser  = document.getElementById('helloUser');
const adminBtn   = document.getElementById('goAdmin');

function isLogin(){ return !!localStorage.getItem('user'); }
function isAdmin(){
  const u = JSON.parse(localStorage.getItem('user')||'null');
  return !!u && ((u.user_role === 'ADMIN') || (u.user_id === 'admin'));
}
function renderAuth(){
  if(!(guestMenu && memberMenu)) return; // 다른 페이지 가드
  if(isLogin()){
    // ✅ user_id가 없을 때를 대비해 보강
    let u = null;
    try { u = JSON.parse(localStorage.getItem('user')||'null'); } catch(e) {}
    const name = u?.user_id || u?.username || u?.id || '';
    if(helloUser) helloUser.textContent = name ? `${name}님 환영합니다` : `환영합니다`;
    guestMenu.classList.add('hidden');
    memberMenu.classList.remove('hidden');
    if(adminBtn) adminBtn.style.display = isAdmin()? 'inline-block' : 'none';
  }else{
    guestMenu.classList.remove('hidden');
    memberMenu.classList.add('hidden');
    if(adminBtn) adminBtn.style.display = 'none';
  }
}
document.getElementById('doLogout')?.addEventListener('click', ()=>{
  localStorage.removeItem('user'); renderAuth();
});
document.getElementById('goMy')?.addEventListener('click', ()=>{
  location.href='/app/frontend/user/html/mypage.html';
});
document.getElementById('goAdmin')?.addEventListener('click', ()=>{
  if(isAdmin()) location.href='/app/frontend/user/html/admin.html';
});

/* =======================
   (옵션) 모달 가드 (있을 때만)
   ======================= */
const loginModal  = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const writeModal  = document.getElementById('writeModal');
const adminModal  = document.getElementById('adminModal');

document.getElementById('openLogin') ?.addEventListener('click', ()=> loginModal?.showModal());
document.getElementById('closeLogin')?.addEventListener('click', ()=> loginModal?.close());
document.getElementById('openSignup') ?.addEventListener('click', ()=> signupModal?.showModal());
document.getElementById('closeSignup')?.addEventListener('click', ()=> signupModal?.close());
document.getElementById('openWrite')  ?.addEventListener('click', ()=>{
  if(!isLogin()){ alert('로그인 후 이용하세요'); return; }
  writeModal?.showModal();
});
document.getElementById('closeWrite') ?.addEventListener('click', ()=> writeModal?.close());
document.getElementById('openAdmin')  ?.addEventListener('click', ()=> adminModal?.showModal());
document.getElementById('closeAdmin') ?.addEventListener('click', ()=> adminModal?.close());

/* =======================
   게시판 목록/검색/정렬/페이징 (서버 연동)
   ======================= */
const postListTbody = document.getElementById('postList');
const paging        = document.getElementById('paging');
const filterEl      = document.getElementById('filterField'); // select: title|content|author
const qEl           = document.getElementById('q');           // input
const sortEl        = document.getElementById('sortBy');      // select

const PAGE_SIZE = 15;
let CUR_PAGE = 1;
let LAST_TOTAL = 0;
let CURRENT_LIST = [];

// /posts?field=&q=&sort=&page=&size=
async function fetchPosts(){
  if(!(postListTbody && paging)) return; // 다른 페이지면 skip

  const field = filterEl ? filterEl.value : 'title';
  const q     = encodeURIComponent((qEl?.value || '').trim());
  const sort  = sortEl ? sortEl.value : 'date_desc';

  const url = `${API_BASE}/posts?field=${field}&q=${q}&sort=${sort}&page=${CUR_PAGE}&size=${PAGE_SIZE}`;
  const res = await fetch(url);
  if(!res.ok){
    // 레거시(배열) 대응
    const alt = await fetch(`${API_BASE}/posts`).then(r=>r.json()).catch(()=>[]);
    if(Array.isArray(alt)){
      LAST_TOTAL = alt.length;
      CURRENT_LIST = alt.slice((CUR_PAGE-1)*PAGE_SIZE, CUR_PAGE*PAGE_SIZE);
      return renderTable();
    }
    throw new Error('목록 로드 실패');
  }

  const data = await res.json();
  if(Array.isArray(data)){
    LAST_TOTAL = data.length;
    CURRENT_LIST = data.slice((CUR_PAGE-1)*PAGE_SIZE, CUR_PAGE*PAGE_SIZE);
  }else{
    CURRENT_LIST = data.items || [];
    LAST_TOTAL   = Number(data.total ?? CURRENT_LIST.length);
    CUR_PAGE     = Number(data.page  ?? CUR_PAGE);
  }
  renderTable();
}

function renderTable(){
  postListTbody.innerHTML = '';
  CURRENT_LIST.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><a href="/app/frontend/user/html/post.html?id=${p.id}" class="view-link">${p.title}</a></td>
      <td>${p.author}</td>
      <td>${(p.create_date||p.date||'').toString().split('T')[0]}</td>
      <td>${p.views ?? 0}</td>`;
    postListTbody.appendChild(tr);
  });
  buildPagination();
}

function buildPagination(){
  paging.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(LAST_TOTAL / PAGE_SIZE));

  let start = Math.max(1, CUR_PAGE - 2);
  let end   = Math.min(totalPages, start + 4);
  start = Math.max(1, Math.min(start, Math.max(1, end - 4)));

  for(let i=start;i<=end;i++){
    const b=document.createElement('button');
    b.textContent=i;
    b.className='page-btn'+(i===CUR_PAGE?' active':'');
    b.onclick=()=>{ CUR_PAGE=i; fetchPosts(); };
    paging.appendChild(b);
  }
  const next=document.createElement('button');
  next.textContent='>'; next.className='page-btn'; next.disabled=CUR_PAGE>=totalPages;
  next.onclick=()=>{ if(CUR_PAGE<totalPages){ CUR_PAGE++; fetchPosts(); } };
  paging.appendChild(next);

  const last=document.createElement('button');
  last.textContent='>>'; last.className='page-btn'; last.disabled=CUR_PAGE>=totalPages;
  last.onclick=()=>{ CUR_PAGE=totalPages; fetchPosts(); };
  paging.appendChild(last);
}

/* 이벤트 */
document.getElementById('searchForm')?.addEventListener('submit',(e)=>{
  e.preventDefault(); CUR_PAGE=1; fetchPosts();
});
sortEl?.addEventListener('change', ()=>{ CUR_PAGE=1; fetchPosts(); });

/* =======================
   ✅ 추가: 실행 타이밍 & 상태 동기화 보강
   ======================= */

// 1) DOM이 늦게 만들어져도 안전하게 다시 렌더
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderAuth();
    fetchPosts().catch(console.error);
  });
}

// 2) BFCache 복귀(pageshow) 시에도 상태 반영
window.addEventListener('pageshow', () => {
  renderAuth();
});

// 3) 다른 탭/창에서 로그인 상태가 바뀌면 바로 반영
window.addEventListener('storage', (e) => {
  if (e.key === 'user') {
    renderAuth();
  }
});

/* 시작 (기존 동작 유지) */
renderAuth();
fetchPosts().catch(console.error);
