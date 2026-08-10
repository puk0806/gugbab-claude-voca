/**
 * ReplyAidMode(답변 부가 정보 모드) localStorage 영속화 + UI 라벨.
 *
 * 저장값이 없거나 오염됐으면 기본값('both')으로 폴백한다.
 * localStorage 접근 불가 환경(프라이버시 모드 등)에서도 예외 없이 동작한다.
 */
import { DEFAULT_REPLY_AID_MODE, type ReplyAidMode } from './chatRequest';

const STORAGE_KEY = 'gugbab-voca:replyAidMode';

/** 라디오 렌더 순서 고정용 목록. */
export const REPLY_AID_MODES: readonly ReplyAidMode[] = [
  'none',
  'translation',
  'expressions',
  'both',
];

export const REPLY_AID_MODE_LABELS: Record<ReplyAidMode, string> = {
  none: '영어만',
  translation: '해석',
  expressions: '핵심표현',
  both: '둘 다',
};

function isReplyAidMode(value: string | null): value is ReplyAidMode {
  return value !== null && (REPLY_AID_MODES as readonly string[]).includes(value);
}

export function loadReplyAidMode(): ReplyAidMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isReplyAidMode(raw) ? raw : DEFAULT_REPLY_AID_MODE;
  } catch {
    return DEFAULT_REPLY_AID_MODE;
  }
}

export function saveReplyAidMode(mode: ReplyAidMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 저장 실패 시 세션 내 상태로만 동작
  }
}
