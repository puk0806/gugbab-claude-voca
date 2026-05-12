import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('초기 상태는 모든 필드가 비어 있다', () => {
    const s = useSessionStore.getState();
    expect(s.cefr).toBeNull();
    expect(s.cardType).toBeNull();
    expect(s.studyMode).toBeNull();
    expect(s.queue).toEqual([]);
    expect(s.cursor).toBe(0);
    expect(s.results).toEqual([]);
  });

  it('startSession이 큐와 메타데이터를 설정한다', () => {
    useSessionStore.getState().startSession({
      cefr: 'A1',
      cardType: 'word',
      studyMode: 'flashcard',
      queue: ['c1', 'c2', 'c3'],
      now: 1000,
    });
    const s = useSessionStore.getState();
    expect(s.cefr).toBe('A1');
    expect(s.queue).toEqual(['c1', 'c2', 'c3']);
    expect(s.startedAt).toBe(1000);
  });

  it('recordResult + advance로 결과가 누적되고 커서가 이동한다', () => {
    const store = useSessionStore.getState();
    store.startSession({
      cefr: 'A1',
      cardType: 'word',
      studyMode: 'flashcard',
      queue: ['c1', 'c2'],
      now: 1000,
    });
    store.recordResult('c1', 'good');
    store.advance();
    store.recordResult('c2', 'again');
    store.advance();
    const s = useSessionStore.getState();
    expect(s.cursor).toBe(2);
    expect(s.results).toHaveLength(2);
  });

  it('summary가 good/again 카운트를 정확히 집계한다', () => {
    const store = useSessionStore.getState();
    store.startSession({
      cefr: 'A1',
      cardType: 'word',
      studyMode: 'flashcard',
      queue: ['c1', 'c2', 'c3'],
      now: 1000,
    });
    store.recordResult('c1', 'good');
    store.recordResult('c2', 'good');
    store.recordResult('c3', 'again');
    const sum = store.summary();
    expect(sum.cardsSeen).toBe(3);
    expect(sum.goodCount).toBe(2);
    expect(sum.againCount).toBe(1);
  });

  it('advance는 queue.length를 초과하지 않는다', () => {
    const store = useSessionStore.getState();
    store.startSession({
      cefr: 'A1',
      cardType: 'word',
      studyMode: 'flashcard',
      queue: ['only'],
      now: 1,
    });
    store.advance();
    store.advance(); // 한 번 더
    expect(useSessionStore.getState().cursor).toBe(1);
  });
});
