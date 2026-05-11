/**
 * IndexedDB row 타입.
 *
 * - CardMarkRow: 단어장 마킹 (M5). cardId 단위로 1개 (모드 무관).
 * - AppSettingRow: key-value 영속 설정.
 * - SessionLogRow: 학습 세션 로그 (P1).
 *
 * SrsCard(`@/srs`)는 본 DB의 cardProgress 테이블 row 타입으로 직접 사용.
 */
import type { CardType, CEFR, StudyMode } from '@/shared/types';

export interface CardMarkRow {
  readonly cardId: string;
  readonly cardType: CardType;
  readonly level: CEFR;
  readonly mark: 'known' | 'unknown';
  readonly markedAt: number;
}

export interface AppSettingRow<V = unknown> {
  readonly key: string;
  readonly value: V;
}

export interface SessionLogRow {
  readonly id?: number; // auto-increment, 첫 insert 시 미정
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly level: CEFR;
  readonly cardType: CardType;
  readonly studyMode: StudyMode;
  readonly cardsSeen: number;
  readonly goodCount: number;
  readonly againCount: number;
}

/**
 * appSettings 테이블에 사용되는 key 카탈로그.
 * 외부 코드는 본 enum 통해서만 key에 접근 — typo 방지·중앙 관리.
 */
export const SETTING_KEYS = {
  TTS_VOICE_URI: 'ttsVoiceURI',
  TTS_RATE: 'ttsRate',
  TTS_AUTO_PLAY: 'ttsAutoPlay',
  SESSION_SIZE: 'sessionSize',
  NEW_CARD_RATIO: 'newCardRatio',
  AUTO_FLIP_MS: 'autoFlipMs',
  LAST_USED_LEVEL: 'lastUsedLevel',
  SRS_ALGO_VERSION: 'srsAlgoVersion',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/**
 * 설정 default 값. 미저장 key 조회 시 본 값 반환.
 */
export const SETTING_DEFAULTS: Record<SettingKey, unknown> = {
  [SETTING_KEYS.TTS_VOICE_URI]: null,
  [SETTING_KEYS.TTS_RATE]: 1.0,
  [SETTING_KEYS.TTS_AUTO_PLAY]: true,
  [SETTING_KEYS.SESSION_SIZE]: 20,
  [SETTING_KEYS.NEW_CARD_RATIO]: 0.3,
  [SETTING_KEYS.AUTO_FLIP_MS]: 0,
  [SETTING_KEYS.LAST_USED_LEVEL]: null,
  [SETTING_KEYS.SRS_ALGO_VERSION]: 1,
};
