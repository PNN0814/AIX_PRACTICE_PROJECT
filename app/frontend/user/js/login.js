// submit이 자동으로 되기를 막기 위한 방법
document.getElementById("formData").addEventListener("submit", function(e) {
  // 기본 submit 막기
    e.preventDefault();
  
  // 로그인 버튼이 아닌 다른 버튼 클릭 시 무시
  if(document.activeElement.id == "doSignup"){
    window.location.href="/userCreatePage";
  } else {
    // 아이디 값 체크
    if (document.getElementById("user_id").value == "") {
      alert("아이디를 입력해주세요.");
      document.getElementById("user_id").focus();
      return;

    // 비밀번호 값 체크
    } else if (document.getElementById("user_pw").value == "") {
      alert("비밀번호를 입력해주세요.");
      document.getElementById("user_pw").focus();
      return;
    }
    
    // FormData 객체 생성
    const form = document.getElementById("formData");
    const formData = new FormData(form);

    // fetch PUT 요청
    fetch("/LoginCheck", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // alert(data.message);   // "수정이 완료되었습니다."
        window.location.href = "/board/list"; // ✅ 수정 완료 후 이동
      } else {
        alert(data.message);
      }
    })
    .catch(err => {
      alert("에러 발생: " + err.message);
    });
  }
});

const API_BASE = "http://127.0.0.1:8000";

/* 인증/역할 토글 */
const guestMenu = document.getElementById('guestMenu');
const memberMenu = document.getElementById('memberMenu');
const helloUser  = document.getElementById('helloUser');

function isLogin(){ return !!localStorage.getItem('user'); }
function renderAuth(){
  if(!(guestMenu && memberMenu)) return;
  if(isLogin()){
    let u = null; try{ u = JSON.parse(localStorage.getItem('user')||'null'); }catch(e){}
    const name = u?.user_id || u?.username || u?.id || '';
    helloUser && (helloUser.textContent = name ? `${name}님 환영합니다` : `환영합니다`);
    guestMenu.classList.add('hidden'); memberMenu.classList.remove('hidden');
  }else{
    guestMenu.classList.remove('hidden'); memberMenu.classList.add('hidden');
  }
}
document.getElementById('doLogout')?.addEventListener('click', ()=>{ localStorage.removeItem('user'); renderAuth(); });
document.getElementById('goMy')?.addEventListener('click', ()=> location.href='/app/frontend/user/html/mypage.html');

/* 게시판 목록/검색/정렬/페이징 (서버 연동) */
const postListTbody = document.getElementById('postList');
const paging        = document.getElementById('paging');
const filterEl      = document.getElementById('filterField');
const qEl           = document.getElementById('q');
const sortEl        = document.getElementById('sortBy');

const PAGE_SIZE = 15;
let CUR_PAGE = 1;
let LAST_TOTAL = 0;
let CURRENT_LIST = [];

// /posts?field=&q=&sort=&page=&size=
async function fetchPosts(){
  if(!(postListTbody && paging)) return;
  const field = filterEl ? filterEl.value : 'title';
  const q     = encodeURIComponent((qEl?.value || '').trim());
  const sort  = sortEl ? sortEl.value : 'date_desc';
  const url = `${API_BASE}/posts?field=${field}&q=${q}&sort=${sort}&page=${CUR_PAGE}&size=${PAGE_SIZE}`;
  const res = await fetch(url);
  if(!res.ok){
    const alt = await fetch(`${API_BASE}/posts`).then(r=>r.json()).catch(()=>[]);
    const arr = Array.isArray(alt) ? alt : [];
    LAST_TOTAL = arr.length;
    CURRENT_LIST = arr.slice((CUR_PAGE-1)*PAGE_SIZE, CUR_PAGE*PAGE_SIZE);
    return renderTable();
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

document.getElementById('searchForm')?.addEventListener('submit',(e)=>{ e.preventDefault(); CUR_PAGE=1; fetchPosts(); });
sortEl?.addEventListener('change', ()=>{ CUR_PAGE=1; fetchPosts(); });

/* =======================
   🔧 추가: 로그인/회원가입 처리 + 상태 동기화
   ======================= */

// 1) 로그인 처리(있을 때만)
document.getElementById('loginForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f=e.target;
  const payload={ user_id:f.user_id.value, user_pw:f.user_pw.value };
  try{
    const res = await fetch(`${API_BASE}/userLogin`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if(!res.ok) throw await res.json().catch(()=>({detail:'로그인 실패'}));
    const user = await res.json();
    localStorage.setItem('user', JSON.stringify(user)); // 헤더 토글용 저장
    // 메인으로 이동
    location.href = '/app/frontend/user/html/index.html';
  }catch(err){ alert(err.detail || '로그인 실패'); }
});

// 2) 회원가입 처리(같은 페이지에 폼이 있다면)
document.getElementById('signupForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f=e.target;
  const payload={
    user_id:f.user_id.value, user_pw:f.user_pw.value, user_email:f.user_email.value,
    user_addr1:f.user_addr1.value, user_addr2:f.user_addr2.value,
    user_post:f.user_post.value, user_birth:f.user_birth.value
  };
  try{
    const res=await fetch(`${API_BASE}/userCreate`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    if(!res.ok) throw await res.json().catch(()=>({detail:'회원가입 실패'}));
    alert('가입 완료! 로그인 탭에서 로그인해주세요.');
  }catch(err){ alert(err.detail||'회원가입 실패'); }
});

// 3) DOM/뒤로가기/다른 탭 상태변경에도 헤더 갱신
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderAuth);
}
window.addEventListener('pageshow', renderAuth);
window.addEventListener('storage', (e)=>{ if(e.key==='user') renderAuth(); });

/* 시작 */
renderAuth();
fetchPosts().catch(console.error);
