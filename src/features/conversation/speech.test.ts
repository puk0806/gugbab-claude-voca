import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecognizer, isRecognitionSupported } from './speech';

const startMock = vi.fn();
const stopMock = vi.fn();
const abortMock = vi.fn();

interface RecognitionEventHandlers {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: unknown; resultIndex?: number }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

let lastInstance: RecognitionEventHandlers | null = null;

class MockRecognition {
  lang = '';
  continuous = true;
  interimResults = false;
  onresult: ((event: { results: unknown; resultIndex?: number }) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  start = startMock;
  stop = stopMock;
  abort = abortMock;
  constructor() {
    lastInstance = this as unknown as RecognitionEventHandlers;
  }
}

// Web Speech API onresult 이벤트 모사 — results는 세션 누적 목록
function makeEvent(entries: Array<[transcript: string, isFinal: boolean]>, resultIndex = 0) {
  const results: Record<number | string, unknown> = { length: entries.length };
  entries.forEach(([transcript, isFinal], i) => {
    results[i] = { isFinal, 0: { transcript } };
  });
  return { results, resultIndex };
}

describe('speech (영어 회화 STT)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastInstance = null;
    Reflect.set(window, 'SpeechRecognition', MockRecognition);
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'SpeechRecognition');
  });

  it('SpeechRecognition 있으면 지원, 없으면 미지원 판정', () => {
    expect(isRecognitionSupported()).toBe(true);
    Reflect.deleteProperty(window, 'SpeechRecognition');
    expect(isRecognitionSupported()).toBe(false);
  });

  it('영어 회화 입력 — lang=en-US, interim 활성, 비연속 모드로 생성된다', () => {
    createRecognizer(vi.fn(), vi.fn());
    expect(lastInstance?.lang).toBe('en-US');
    expect(lastInstance?.interimResults).toBe(true);
    expect(lastInstance?.continuous).toBe(false);
  });

  it('interim → final 순으로 onResult 가 호출된다', () => {
    const onResult = vi.fn();
    createRecognizer(onResult, vi.fn());
    lastInstance?.onresult?.(makeEvent([['hello', false]]));
    lastInstance?.onresult?.(makeEvent([['hello there', true]]));
    expect(onResult).toHaveBeenNthCalledWith(1, 'hello', false);
    expect(onResult).toHaveBeenNthCalledWith(2, 'hello there', true);
  });

  it('한 이벤트에 final+interim 배치가 오면 모두 전달한다', () => {
    const onResult = vi.fn();
    createRecognizer(onResult, vi.fn());
    lastInstance?.onresult?.(
      makeEvent(
        [
          ['first sentence', true],
          ['second', false],
        ],
        0,
      ),
    );
    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenNthCalledWith(1, 'first sentence', true);
    expect(onResult).toHaveBeenNthCalledWith(2, 'second', false);
  });

  it('에러 코드가 MicError 타입으로 매핑된다', () => {
    const onError = vi.fn();
    createRecognizer(vi.fn(), vi.fn(), onError);
    lastInstance?.onerror?.({ error: 'not-allowed' });
    expect(onError).toHaveBeenCalledWith('not-allowed');
    lastInstance?.onerror?.({ error: 'no-speech' });
    expect(onError).toHaveBeenCalledWith('no-speech');
    lastInstance?.onerror?.({ error: 'something-weird' });
    expect(onError).toHaveBeenCalledWith('unknown');
  });

  it('start/stop/abort 가 인스턴스에 위임된다', () => {
    const rec = createRecognizer(vi.fn(), vi.fn());
    rec.start();
    rec.stop();
    rec.abort();
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(stopMock).toHaveBeenCalledTimes(1);
    expect(abortMock).toHaveBeenCalledTimes(1);
  });

  it('미지원 환경에서 createRecognizer 는 throw', () => {
    Reflect.deleteProperty(window, 'SpeechRecognition');
    expect(() => createRecognizer(vi.fn(), vi.fn())).toThrow();
  });
});
