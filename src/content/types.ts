/**
 * 정적 콘텐츠(JSON)의 도메인 타입.
 *
 * 콘텐츠는 `public/data/{words,sentences}/{cefr}.json` 에서 fetch.
 * Claude로 생성 → git commit → Vercel 재배포 (수개월 단위 갱신).
 *
 * id 규약 (불변):
 *   - 단어: `w_{level}_{seq}` (예: `w_a1_001`)
 *   - 문장: `s_{level}_{seq}` (예: `s_a1_001`)
 *
 * 클로즈 마커 (M2):
 *   - english 필드에 `{단어}` 형태로 빈칸 위치 표시
 *   - cloze 배열의 동일 인덱스 단어가 정답
 *   - 일반 표시 시 마커는 단어로 치환 (`fillCloze`)
 */
import type { CEFR } from '@/shared/types';

export const PARTS_OF_SPEECH = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'determiner',
  'other',
] as const;

export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export interface WordExample {
  readonly en: string;
  readonly ko: string;
}

export interface WordEntry {
  readonly id: string;
  readonly level: CEFR;
  readonly english: string;
  readonly korean: string;
  readonly partOfSpeech: PartOfSpeech;
  readonly ipa?: string;
  readonly examples?: readonly WordExample[];
  readonly tags?: readonly string[];
}

export interface SentenceEntry {
  readonly id: string;
  readonly level: CEFR;
  readonly english: string;
  readonly korean: string;
  readonly literal?: string;
  readonly cloze?: readonly string[];
  readonly context?: string;
  readonly tags?: readonly string[];
}

export interface ContentManifest {
  readonly buildAt: string; // ISO 8601
  readonly schemaVersion: 1;
  readonly counts: {
    readonly words: Record<CEFR, number>;
    readonly sentences: Record<CEFR, number>;
  };
}
