/**
 * Web Speech API 음성 인식(STT) — 영어 회화 입력용 (lang=en-US).
 *
 * gugbab 형제 앱들의 speech 모듈 인식 부분과 동일 패턴.
 * 브라우저 전용 — SpeechRecognition/webkitSpeechRecognition 미지원이면
 * isRecognitionSupported() 가 false (UI 는 마이크 버튼 자체를 숨긴다).
 */

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionResultList {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  /** 표준 속성이지만 일부 WebKit 구현이 누락 — 방어적으로 optional 취급 */
  readonly resultIndex?: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function isRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export interface SpeechRecognizer {
  start(): void;
  stop(): void;
  abort(): void;
}

export type MicError = 'not-allowed' | 'no-speech' | 'network' | 'unknown';

export function createRecognizer(
  onResult: (text: string, isFinal: boolean) => void,
  onEnd: () => void,
  onError?: (type: MicError) => void,
): SpeechRecognizer {
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | SpeechRecognitionCtor
    | undefined;

  if (!Ctor) throw new Error('SpeechRecognition 미지원');

  const rec = new Ctor();
  rec.lang = 'en-US'; // 영어 회화 연습 — 사용자는 영어로 발화
  rec.continuous = false;
  rec.interimResults = true;

  // resultIndex 없는 비표준 구현용 진행 커서 — 이미 확정(final) 처리한 앞부분 재생 방지
  let nextUnprocessedIndex = 0;
  rec.onresult = (event) => {
    // 한 이벤트에 여러 결과가 배치될 수 있다(final + 새 interim) — resultIndex부터 전부 전달해 final 유실 방지.
    const start = event.resultIndex ?? Math.min(nextUnprocessedIndex, event.results.length - 1);
    for (let i = start; i < event.results.length; i++) {
      const result = event.results[i];
      if (result) onResult(result[0]?.transcript ?? '', result.isFinal);
    }
    let finals = 0;
    while (finals < event.results.length && event.results[finals]?.isFinal) finals++;
    nextUnprocessedIndex = finals;
  };
  rec.onend = onEnd;
  rec.onerror = (event) => {
    const errType = event.error;
    let type: MicError = 'unknown';
    if (errType === 'not-allowed' || errType === 'permission-denied') type = 'not-allowed';
    else if (errType === 'no-speech') type = 'no-speech';
    else if (errType === 'network') type = 'network';
    onError?.(type);
  };

  return {
    start: () => rec.start(),
    stop: () => rec.stop(),
    abort: () => rec.abort(),
  };
}
