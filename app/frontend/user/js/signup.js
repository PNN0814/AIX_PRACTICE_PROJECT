const API_BASE = "http://127.0.0.1:8000";
document.getElementById('signupForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const f = e.target;
  const payload = {
    user_id:f.user_id.value, user_pw:f.user_pw.value, user_email:f.user_email.value,
    user_addr1:f.user_addr1.value, user_addr2:f.user_addr2.value,
    user_post:f.user_post.value, user_birth:f.user_birth.value
  };
  try{
    const res = await fetch(`${API_BASE}/userCreate`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if(!res.ok) throw await res.json().catch(()=>({detail:'회원가입 실패'}));
    alert('가입 완료! 로그인 해주세요.'); location.href='/login.html';
  }catch(err){ alert(err.detail || '회원가입 실패'); }
});
