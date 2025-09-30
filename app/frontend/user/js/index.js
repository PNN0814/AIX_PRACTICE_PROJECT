// /app/frontend/user/js/index.js
// 역할: 메인(index.html) 진입 시 app.js를 모듈로 불러와 초기화 타이밍을 보장
import './app.js';

// 안전망: DOM 완성/뒤로가기 복귀 시 헤더를 다시 그릴 수 있도록 이벤트만 트리거
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // app.js가 이미 초기화하지만, 혹시 늦게 붙는 노드가 있으면 다시 그리도록 트리거
    window.dispatchEvent(new Event('pageshow'));
  });
} else {
  window.dispatchEvent(new Event('pageshow'));
}
