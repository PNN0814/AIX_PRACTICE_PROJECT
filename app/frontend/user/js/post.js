const API_BASE = "http://127.0.0.1:8000";
const qs = new URLSearchParams(location.search);
const postId = Number(qs.get('id'));

const postTitle = document.getElementById('postTitle');
const postMeta  = document.getElementById('postMeta');
const postContent = document.getElementById('postContent');
const attachGrid = document.getElementById('attachGrid');
const ownerActions = document.getElementById('ownerActions');
const editModal = document.getElementById('editModal');

const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const editFiles = document.getElementById('editFiles');

function me(){ try{ return JSON.parse(localStorage.getItem('user')||'null'); }catch(e){ return null; } }

async function load(){
  if(!postId){ alert('잘못된 접근'); location.href='/'; return; }
  const res = await fetch(`${API_BASE}/posts/${postId}`); // 조회수 +1
  if(!res.ok){ alert('게시글을 찾을 수 없음'); location.href='/'; return; }
  const p = await res.json();

  postTitle.textContent = p.title;
  const date = (p.create_date||'').split('T')[0];
  postMeta.textContent = `${p.author} · ${date} · 조회수 ${p.views}`;
  postContent.textContent = p.content || '';

  attachGrid.innerHTML = '';
  const files = p.files || p.attachments || [];
  if(Array.isArray(files) && files.length){
    files.slice(0,3).forEach(url=>{
      const img = document.createElement('img'); img.src = url; img.alt = 'attachment';
      attachGrid.appendChild(img);
    });
  }else{
    document.getElementById('attachArea').style.display = 'none';
  }

  const u = me();
  if(u && (u.user_id===p.author || u.user_role==='ADMIN')){
    ownerActions.style.display = 'flex';
  }
}

document.getElementById('btnEdit')?.addEventListener('click', ()=>{
  editTitle.value = postTitle.textContent;
  editContent.value = postContent.textContent;
  editModal.showModal();
});

document.getElementById('editForm')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const patch = await fetch(`${API_BASE}/posts/${postId}`, {
    method:'PATCH', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ title: editTitle.value, content: editContent.value })
  });
  if(!patch.ok){ alert('수정 실패'); return; }

  if(editFiles.files && editFiles.files.length){
    const fd = new FormData();
    Array.from(editFiles.files).slice(0,3).forEach(f=>fd.append('files', f));
    try{ await fetch(`${API_BASE}/posts/${postId}/files`, { method:'POST', body:fd }); }catch(_){}
  }

  alert('수정 완료'); editModal.close(); await load();
});

document.getElementById('btnDelete')?.addEventListener('click', async ()=>{
  if(!confirm('정말 삭제할까요?')) return;
  const del = await fetch(`${API_BASE}/posts/${postId}`, { method:'DELETE' });
  if(del.ok){ alert('삭제 완료'); location.href='/'; } else alert('삭제 실패');
});

load();
