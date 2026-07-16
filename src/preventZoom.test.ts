import { describe, expect, it } from 'vitest';
import { preventPinchZoom } from './preventZoom';

/**
 * jsdom에는 GestureEvent/TouchEvent 생성자가 없으므로
 * cancelable한 기본 Event에 필요한 프로퍼티만 정의해 디스패치한다.
 */
function createTouchMoveEvent(touchCount: number): Event {
  const event = new Event('touchmove', { cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: Array.from({ length: touchCount }, () => ({})),
  });
  return event;
}

function createFreshDocument(): Document {
  return document.implementation.createHTMLDocument();
}

describe('preventPinchZoom', () => {
  it.each([
    'gesturestart',
    'gesturechange',
    'gestureend',
  ])('iOS %s 이벤트를 preventDefault로 차단한다', (type) => {
    const doc = createFreshDocument();
    preventPinchZoom(doc);

    const event = new Event(type, { cancelable: true });
    doc.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('두 손가락 이상 touchmove(핀치)를 차단한다', () => {
    const doc = createFreshDocument();
    preventPinchZoom(doc);

    const event = createTouchMoveEvent(2);
    doc.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('한 손가락 touchmove(스크롤)는 차단하지 않는다', () => {
    const doc = createFreshDocument();
    preventPinchZoom(doc);

    const event = createTouchMoveEvent(1);
    doc.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('리스너 등록 전에는 어떤 이벤트도 차단되지 않는다', () => {
    const doc = createFreshDocument();

    const event = new Event('gesturestart', { cancelable: true });
    doc.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
