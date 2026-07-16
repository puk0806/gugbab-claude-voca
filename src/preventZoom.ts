/**
 * 핀치 줌 차단 helper.
 *
 * viewport meta의 user-scalable=no는 iOS Safari 10+에서 무시되고,
 * CSS touch-action(pan-x pan-y)도 iOS에서 핀치 줌을 완전히 막지 못한다.
 * WebKit 전용 gesture 이벤트를 preventDefault 해야 확실히 차단된다.
 *
 * 테스트 가능성을 위해 별도 모듈로 분리. main.tsx에서 호출.
 */
export function preventPinchZoom(target: Document = document): void {
  const cancel = (event: Event): void => {
    event.preventDefault();
  };

  // iOS Safari 전용 gesture 이벤트 — 핀치 시작/진행/종료 모두 차단
  target.addEventListener('gesturestart', cancel);
  target.addEventListener('gesturechange', cancel);
  target.addEventListener('gestureend', cancel);

  // gesture 이벤트 미지원 브라우저 대비 — 두 손가락 이상 touchmove 차단
  // (한 손가락 스크롤은 그대로 허용)
  target.addEventListener(
    'touchmove',
    (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    },
    { passive: false },
  );
}
