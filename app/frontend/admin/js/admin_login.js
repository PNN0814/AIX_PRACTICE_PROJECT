const API_BASE = "http://127.0.0.1:8000";

function toast(msg){ alert(msg); }

document.getElementById('adminLoginForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const payload = { user_id: f.user_id.value.trim(), user_pw: f.user_pw.value };

  try{
    const res = await fetch(`${API_BASE}/userLogin`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });

    if(!res.ok){
      const err = await res.json().catch(()=>({detail:'로그인 실패'}));
      toast(err.detail || '로그인 실패');
      return;
    }

    const user = await res.json();

    // 서버에서 user_role이 오지 않는 경우, admin 계정은 강제로 ADMIN 지정
    if(!user.user_role && user.user_id === 'admin'){
      user.user_role = 'ADMIN';
    }

    if(!(user.user_role === 'ADMIN' || user.user_id === 'admin')){
      toast('관리자 권한이 없습니다.');
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));
    location.href = '/app/admin/html/index.html';
  }catch(err){
    console.error(err);
    toast('네트워크 오류 또는 서버 응답 없음');
  }
});
