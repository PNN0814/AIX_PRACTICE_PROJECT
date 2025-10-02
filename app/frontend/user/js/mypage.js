// 내 정보 수정 버튼 클릭 시
document.getElementById("formData").addEventListener("submit", function(e) {
  e.preventDefault(); // 기본 submit 막기

  // 사용자 index 값
  const no_seq = document.getElementById("no_seq").value;

  // 값 검증
  if (document.getElementById("user_email").value == "") {
    alert("이메일을 입력해주세요.");
    document.getElementById("user_email").focus();
    return;
  } else if (document.getElementById("user_addr1").value == "") {
    alert("주소1을 입력해주세요.");
    document.getElementById("user_addr1").focus();
    return;
  } else if (document.getElementById("user_post").value == "") {
    alert("우편번호를 입력해주세요.");
    document.getElementById("user_post").focus();
    return;
  } else if (document.getElementById("user_birth").value == "") {
    alert("생년월일을 입력해주세요.");
    document.getElementById("user_birth").focus();
    return;
  }

  // FormData 객체 생성
  const form = document.getElementById("formData");
  const formData = new FormData(form);

  // fetch PUT 요청
  fetch(`/userUpdate/${no_seq}`, {
    method: "PUT",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(data.message);   // "수정이 완료되었습니다."
      window.location.href = "/board/list/"; // ✅ 수정 완료 후 이동
    } else {
      alert(data.message);
    }
  })
  .catch(err => {
    alert("에러 발생: " + err.message);
  });
});

// 회원탈퇴(비활성화) 텍스트 클릭 시
document.getElementById("deactivateFormData").addEventListener("click", function(e) {
  e.preventDefault(); // 기본 submit 막기

  // 사용자 index 값
  const no_seq = document.getElementById("no_seq").value;

  const deactivateCheck = confirm("회원탈퇴(비활성화)를 하시겠습니까?");
  
  if(deactivateCheck){
    // deactivateFormData 객체 생성
    const form = document.getElementById("deactivateFormData");
    const formData = new FormData(form);

    // fetch PUT 요청
    fetch(`/userDeactivate/${no_seq}`, {
      method: "PATCH",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(data.message);   // 비활성화가 완료 되었습니다.
        window.location.href = "/"; // 수정 완료 후 이동
      } else {
        alert(data.message);  // 해당 회원이 없습니다.
      }
    })
    .catch(err => {
      alert("에러 발생: " + err.message);
    });
  }
});

// 내 정보 수정 버튼 클릭 시
document.getElementById("pwFormData").addEventListener("submit", function(e) {
  e.preventDefault(); // 기본 submit 막기

  // 사용자 index 값
  const no_seq = document.getElementById("no_seq").value;

  // 값 검증
  if (document.getElementById("new_user_pw").value == "") {
    alert("현재 비밀번호를 입력해주세요.");
    document.getElementById("new_user_pw").focus();
    return;
  } else if (document.getElementById("now_user_pw").value == "") {
    alert("새 비밀번호를 입력해주세요.");
    document.getElementById("now_user_pw").focus();
    return;
  }

  // FormData 객체 생성
  const form = document.getElementById("pwFormData");
  const formData = new FormData(form);

  // fetch PUT 요청
  fetch(`/userPwUpdate/${no_seq}`, {
    method: "PATCH",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      window.location.href = "/";
    } else {
      alert(data.message);
    }
  })
  .catch(err => {
    alert("에러 발생: " + err.message);
  });
});

// /app/frontend/user/js/mypage.js
const API_BASE = "http://127.0.0.1:8000";

function me(){ try{ return JSON.parse(localStorage.getItem('user')||'null'); }catch(e){ return null; } }
let mySeq = null;

/* 탭 전환은 HTML 모듈 스크립트에서 처리 */

/* 내 정보 로드 */
// async function loadMe(){
//   const u = me();
//   // if(!u){ alert('로그인이 필요합니다'); location.href='/app/frontend/user/html/login.html'; return; }

//   // 요소 참조
//   const useridView = document.getElementById('userid_view');
//   const email = document.getElementById('user_email');
//   const addr1 = document.getElementById('user_addr1');
//   const addr2 = document.getElementById('user_addr2');
//   const post  = document.getElementById('user_post');
//   const birth = document.getElementById('user_birth');

//   try{
//     // 기본: /userInfo 전체에서 내 계정 찾기
//     const res = await fetch(`${API_BASE}/userInfo`);
//     const list = await res.json();
//     const mine = list.find(x=>x.user_id===u.user_id) || {};

//     mySeq = mine.no_seq ?? mine.id ?? u.no_seq ?? null;

//     // ✅ 아이디 텍스트 출력(입력창 X)
//     useridView.textContent = mine.user_id || u.user_id || '-';

//     // ✅ 기존 값 프리필 (서버 값 우선, 없으면 localStorage)
//     email.value = mine.user_email || u.user_email || '';
//     addr1.value = mine.user_addr1 || u.user_addr1 || '';
//     addr2.value = mine.user_addr2 || u.user_addr2 || '';
//     post.value  = mine.user_post  || u.user_post  || '';
//     // 생일: yyyy-mm-dd 포맷으로 시도
//     const b = (mine.user_birth || u.user_birth || '').toString();
//     if(b){
//       if(/^\d{8}$/.test(b)){ // yyyymmdd
//         birth.value = `${b.slice(0,4)}-${b.slice(4,6)}-${b.slice(6,8)}`;
//       }else{
//         birth.value = b.length>=10 ? b.slice(0,10) : b;
//       }
//     }
//   }catch(e){
//     // API 실패 시 localStorage만 사용
//     useridView.textContent = u.user_id || '-';
//     email.value = u.user_email || '';
//     addr1.value = u.user_addr1 || '';
//     addr2.value = u.user_addr2 || '';
//     post.value  = u.user_post  || '';
//     const b = (u.user_birth || '').toString();
//     if(b){ birth.value = b.length===8 ? `${b.slice(0,4)}-${b.slice(4,6)}-${b.slice(6,8)}` : b.slice(0,10); }
//   }
// }

/* 저장/변경/비활성화 */
// document.getElementById('saveProfile')?.addEventListener('click', async ()=>{
//   if(!mySeq) return alert('식별자 없음');
//   try{
//     const res = await fetch(`${API_BASE}/userUpdate/${mySeq}`,{
//       method:'PATCH', headers:{'Content-Type':'application/json'},
//       body: JSON.stringify({
//         user_email: email.value, user_post: post.value,
//         user_addr1: addr1.value, user_addr2: addr2.value,
//         user_birth: (birth.value||'').replaceAll('-','')
//       })
//     });
//     if(!res.ok) throw await res.json().catch(()=>({detail:'수정 실패'}));
//     alert('내정보 수정이 완료되었습니다.');
//   }catch(err){
//     alert(err.detail || '수정 실패');
//   }
// });

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

// loadMe();
