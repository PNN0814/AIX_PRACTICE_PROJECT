// /app/frontend/user/js/mypage.js
const API_BASE = "http://127.0.0.1:8000";

function me(){ try{ return JSON.parse(localStorage.getItem('user')||'null'); }catch(e){ return null; } }
let mySeq = null;

/* 탭 전환은 HTML 모듈 스크립트에서 처리 */

/* 내 정보 로드 */
async function loadMe(){
  const u = me();
  // if(!u){ alert('로그인이 필요합니다'); location.href='/app/frontend/user/html/login.html'; return; }

  // 요소 참조
  const useridView = document.getElementById('userid_view');
  const email = document.getElementById('email');
  const addr1 = document.getElementById('addr1');
  const addr2 = document.getElementById('addr2');
  const post  = document.getElementById('post');
  const birth = document.getElementById('birth');

  try{
    // 기본: /userInfo 전체에서 내 계정 찾기
    const res = await fetch(`${API_BASE}/userInfo`);
    const list = await res.json();
    const mine = list.find(x=>x.user_id===u.user_id) || {};

    mySeq = mine.no_seq ?? mine.id ?? u.no_seq ?? null;

    // ✅ 아이디 텍스트 출력(입력창 X)
    useridView.textContent = mine.user_id || u.user_id || '-';

    // ✅ 기존 값 프리필 (서버 값 우선, 없으면 localStorage)
    email.value = mine.user_email || u.user_email || '';
    addr1.value = mine.user_addr1 || u.user_addr1 || '';
    addr2.value = mine.user_addr2 || u.user_addr2 || '';
    post.value  = mine.user_post  || u.user_post  || '';
    // 생일: yyyy-mm-dd 포맷으로 시도
    const b = (mine.user_birth || u.user_birth || '').toString();
    if(b){
      if(/^\d{8}$/.test(b)){ // yyyymmdd
        birth.value = `${b.slice(0,4)}-${b.slice(4,6)}-${b.slice(6,8)}`;
      }else{
        birth.value = b.length>=10 ? b.slice(0,10) : b;
      }
    }
  }catch(e){
    // API 실패 시 localStorage만 사용
    useridView.textContent = u.user_id || '-';
    email.value = u.user_email || '';
    addr1.value = u.user_addr1 || '';
    addr2.value = u.user_addr2 || '';
    post.value  = u.user_post  || '';
    const b = (u.user_birth || '').toString();
    if(b){ birth.value = b.length===8 ? `${b.slice(0,4)}-${b.slice(4,6)}-${b.slice(6,8)}` : b.slice(0,10); }
  }
}

/* 저장/변경/비활성화 */
document.getElementById('saveProfile')?.addEventListener('click', async ()=>{
  if(!mySeq) return alert('식별자 없음');
  try{
    const res = await fetch(`${API_BASE}/userUpdate/${mySeq}`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        user_email: email.value, user_post: post.value,
        user_addr1: addr1.value, user_addr2: addr2.value,
        user_birth: (birth.value||'').replaceAll('-','')
      })
    });
    if(!res.ok) throw await res.json().catch(()=>({detail:'수정 실패'}));
    alert('내정보 수정이 완료되었습니다.');
  }catch(err){
    alert(err.detail || '수정 실패');
  }
});

document.getElementById('changePw')?.addEventListener('click', async ()=>{
  if(!mySeq) return;
  try{
    const res = await fetch(`${API_BASE}/userPwUpdate/${mySeq}`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ now_user_pw: now_pw.value, new_user_pw: new_pw.value })
    });
    if(!res.ok) throw await res.json().catch(()=>({detail:'변경 실패'}));
    await res.json().catch(()=>null);
    alert('비밀번호 변경이 완료되었습니다.');
    now_pw.value=''; new_pw.value='';
  }catch(err){
    alert(err.detail || '변경 실패');
  }
});

document.getElementById('deactivateLink')?.addEventListener('click', async ()=>{
  if(!mySeq) return;
  if(!confirm('정말 계정을 비활성화하시겠습니까?\n(언제든 재가입은 가능합니다)')) return;
  try{
    const res = await fetch(`${API_BASE}/userDeactivate/${mySeq}`,{ method:'PATCH' });
    if(!res.ok) throw await res.json().catch(()=>({detail:'비활성화 실패'}));
    alert('비활성화 처리 완료.\n그동안 이용해주셔서 감사합니다.');
    localStorage.removeItem('user');
    location.href='/app/frontend/user/html/login.html';
  }catch(err){
    alert(err.detail || '비활성화 실패');
  }
});

loadMe();
