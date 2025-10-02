/* ============================================================
   관리자 로그인 JS
   - admin 테이블 사용
   - admin_id, admin_pw 필드 사용
   ============================================================ */

const API_BASE = "http://127.0.0.1:8000";

/* ========== 관리자 로그인 ========== */
document.getElementById('adminLoginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  
  // admin 테이블 필드명에 맞춰 변환
  const payload = { 
    admin_id: f.user_id.value.trim(),  // HTML input name="user_id" → API admin_id
    admin_pw: f.user_pw.value          // HTML input name="user_pw" → API admin_pw
  };

  // 유효성 검사
  if(!payload.admin_id || !payload.admin_pw){
    alert('아이디와 비밀번호를 입력해주세요.');
    return;
  }

  try{
    /* 백엔드 API:
       POST /admin/login
       - 요청: {admin_id, admin_pw}
       - 응답: {no_seq, admin_id, admin_gubun, token}
       - admin 테이블에서 조회
       - admin_delete_yn = 'N' 체크
    */
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    // 응답 에러 처리
    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'로그인 실패'}));
      alert(err.detail || '로그인 실패');
      return;
    } else {
      //관리자 정보 받기
      const admin = await res.json();

      // 기존 프론트엔드 코드 호환성 유지
      // admin_app.js에서 user_role, user_id를 체크하므로 추가
      admin.user_role = 'ADMIN';
      admin.user_id = admin.admin_id;
      
      // localStorage에 관리자 정보 저장
      localStorage.setItem('user', JSON.stringify(admin));

      alert('로그인 성공!');
      
      // 관리자 대시보드로 이동
        location.href = '/admin/userPage';
    }
  }catch(err){
    console.error('로그인 에러:', err);
    alert('네트워크 오류 또는 서버 응답 없음');
  }
});

/* ========== Enter 키 처리 ========== */
document.querySelectorAll('#adminLoginForm input').forEach(input => {
  input.addEventListener('keypress', (e) => {
    if(e.key === 'Enter'){
      document.getElementById('adminLoginForm').requestSubmit();
    }
  });
});
