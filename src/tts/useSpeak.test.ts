import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSpeak } from './useSpeak';

describe('useSpeak', () => {
  afterEach(() => {
    // jsdom의 기본 speechSynthesis는 없음 — 별다른 cleanup 불필요
  });

  it('jsdom 환경에서 supported=false', () => {
    const { result } = renderHook(() => useSpeak());
    expect(result.current.supported).toBe(false);
  });

  it('speak/stop이 함수로 노출된다', () => {
    const { result } = renderHook(() => useSpeak());
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.stop).toBe('function');
  });

  it('미지원 환경에서 speak 호출은 noop (throw 없음)', () => {
    const { result } = renderHook(() => useSpeak());
    expect(() => result.current.speak('hello')).not.toThrow();
    expect(() => result.current.stop()).not.toThrow();
  });
});
