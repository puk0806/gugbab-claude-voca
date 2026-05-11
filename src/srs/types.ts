/**
 * SRS (Spaced Repetition System) 도메인 타입.
 *
 * - SrsCard: SM-2 알고리즘이 다루는 카드 진도 단위.
 *   같은 cardId라도 studyMode별로 별도 row (M1: 복합 PK).
 * - SrsInput: 단일 review의 외부 입력 (rating + now 주입).
 * - SrsResult: review 결과 (갱신된 카드 + 편의용 nextDueAt).
 * - Quality: SM-2 6단계(0~5) 응답 등급.
 *
 * 본 모듈은 React 의존 0, 외부 라이브러리 0의 순수 함수 영역.
 */
import type { CardType, CEFR, SrsRating, SrsState, StudyMode } from '@/shared/types';

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SrsCard {
  readonly cardId: string;
  readonly studyMode: StudyMode;
  readonly cardType: CardType;
  readonly level: CEFR;
  readonly state: SrsState;
  readonly repetitions: number;
  readonly easeFactor: number;
  readonly intervalDays: number;
  readonly dueAt: number; // epoch ms
  readonly lastReviewedAt: number; // epoch ms (0 = 미학습)
  readonly lapses: number;
  readonly lastRating: SrsRating | null;
}

export interface SrsInput {
  readonly rating: SrsRating;
  readonly now: number; // epoch ms
}

export interface SrsResult {
  readonly card: SrsCard;
  readonly nextDueAt: number;
}
