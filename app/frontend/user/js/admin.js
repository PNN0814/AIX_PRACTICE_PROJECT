const API_BASE = "http://127.0.0.1:8000";
function me(){ try{ return JSON.parse(localStorage.getItem('user')||'null'); }catch(e){ return null; } }
const u = me();
if(!(u && (u.user_role==='ADMIN' || u.user_id==='admin'))){ alert('관리자만 접근 가능'); location.href='/'; }

const userTbody = document.getElementById('userTbody');
const postTbody = document.getElementById('postTbody');

async function loadUsers(){
  const res = await fetch(`${API_BASE}/userInfo`);
  const list = await res.json();
  userTbody.innerHTML='';
  list.forEach(x=>{
    const tr=document.createElement('tr');
    tr.innerHTML = `
      <td>${x.no_seq ?? ''}</td>
      <td>${x.user_id}</td>
      <td>${x.user_email||''}</td>
      <td>${(x.user_addr1||'')+' '+(x.user_addr2||'')}</td>
      <td>${x.user_delete_yn||'N'}</td>
      <td>
        <button class="btn ghost" data-act="edit" data-id="${x.no_seq}">정보수정</button>
        <button class="btn admin" data-act="pw" data-id="${x.no_seq}">비번수정</button>
        <button class="btn danger" data-act="del" data-id="${x.no_seq}">비활성화</button>
      </td>`;
    userTbody.appendChild(tr);
  });

  userTbody.querySelectorAll('button').forEach(b=>{
    b.onclick = async ()=>{
      const id = b.dataset.id, act=b.dataset.act;
      if(act==='edit'){
        alert('서버 미구현: PATCH /admin/users/{no_seq}');
      }else if(act==='pw'){
        const npw = prompt('새 비밀번호 입력'); if(!npw) return;
        alert('서버 미구현: PATCH /admin/users/{no_seq}/password');
      }else if(act==='del'){
        if(!confirm('비활성화 하시겠습니까?')) return;
        try{
          const r = await fetch(`${API_BASE}/userDeactivate/${id}`,{ method:'PATCH' });
          if(!r.ok) throw 0; alert('비활성화 완료'); loadUsers();
        }catch(_){ alert('서버 미구현 또는 실패'); }
      }
    };
  });
}

async function loadPosts(page=1,size=100){
  const res = await fetch(`${API_BASE}/posts?page=${page}&size=${size}`);
  const data = await res.json();
  postTbody.innerHTML='';
  data.items.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.id}</td>
      <td>${p.title}</td>
      <td>${p.author}</td>
      <td>${(p.create_date||'').split('T')[0]}</td>
      <td>${p.views}</td>
      <td>
        <button class="btn ghost" data-act="edit" data-id="${p.id}">수정</button>
        <button class="btn danger" data-act="del" data-id="${p.id}">삭제</button>
        <button class="btn admin" data-act="pin" data-id="${p.id}">상단고정</button>
      </td>`;
    postTbody.appendChild(tr);
  });

  postTbody.querySelectorAll('button').forEach(b=>{
    b.onclick = async ()=>{
      const id = b.dataset.id, act=b.dataset.act;
      if(act==='edit'){
        const newTitle = prompt('새 제목 입력'); if(!newTitle) return;
        const r = await fetch(`${API_BASE}/posts/${id}`,{
          method:'PATCH', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ title:newTitle })
        });
        if(r.ok) { alert('수정 완료'); loadPosts(); } else alert('수정 실패');
      }else if(act==='del'){
        if(!confirm('삭제하시겠습니까?')) return;
        const r = await fetch(`${API_BASE}/posts/${id}`,{ method:'DELETE' });
        if(r.ok) { alert('삭제 완료'); loadPosts(); } else alert('삭제 실패');
      }else if(act==='pin'){
        alert('서버 미구현: PATCH /posts/{id}/pin');
      }
    };
  });
}

loadUsers();
loadPosts();
