// /app/js/addr.js
// Kakao(구 다음) 우편번호 서비스 - "레이어 내장형" 공통 바인딩
// 사용법:
// bindPostcodeLayer({ buttonId:'btnFindAddr', layerId:'postcodeLayer', addrId:'user_addr1', postId:'user_post' });

export function bindPostcodeLayer({ buttonId, layerId, addrId, postId }) {
  const btn   = document.getElementById(buttonId);
  const layer = document.getElementById(layerId);
  const addr  = document.getElementById(addrId);
  const post  = document.getElementById(postId);

  if (!btn || !layer || !addr || !post) return;

  // 닫기 버튼 처리
  const closeBtn = layer.querySelector('.addr-layer-close');
  const hideLayer = () => { layer.style.display = 'none'; layer.innerHTML = layer._tpl; };
  if (closeBtn) closeBtn.addEventListener('click', hideLayer);

  // 템플릿 저장(다시 embed할 때 내부 초기화용)
  if (!layer._tpl) layer._tpl = layer.innerHTML;

  // 버튼 클릭 시 레이어 띄우기 + 임베드
  btn.addEventListener('click', () => {
    // 스크립트 로딩 체크
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 스크립트가 아직 로드되지 않았어요. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 레이어 보이기 및 컨텐츠 초기화
    layer.style.display = 'block';
    layer.innerHTML = layer._tpl;

    const wrap = layer.querySelector('.addr-layer-body');
    const close = layer.querySelector('.addr-layer-close');

    const postcode = new daum.Postcode({
      oncomplete: function(data) {
        const road  = (data.roadAddress || '').trim();
        const jibun = (data.jibunAddress || '').trim();
        addr.value = road || jibun || '';
        post.value = (data.zonecode || '').trim(); // 5자리
        hideLayer();

        // 상세주소 포커스 이동(있을 때)
        const detail = document.getElementById('user_addr2') || document.getElementById('addr2');
        if (detail) detail.focus();
      },
      onresize: function(size) {
        wrap.style.height = size.height + 'px';
      },
      width: '100%',
      height: '100%'
    });

    // 레이어 안에 임베드
    postcode.embed(wrap);

    // 닫기 버튼 재바인딩(초기화되었을 수 있음)
    layer.querySelector('.addr-layer-close')?.addEventListener('click', hideLayer);
  });
}
