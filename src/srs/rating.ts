/**
 * 2-rating 시스템(good/again) ↔ SM-2 6단계 quality 매핑.
 *
 * srs-spaced-repetition SKILL.md 권장에 따른 보수적 매핑:
 *   - good → 4 ("정답 + 약간 머뭇거림"). Q=5는 EF가 빠르게 양극화
 *   - again → 1 ("오답"). Q=0은 EF 감소(-0.8)가 과도
 *
 * 외부 모듈은 본 함수만 사용; 내부 quality 상수에 직접 의존 X (캡슐화).
 */
import type { SrsRating } from '@/shared/types';
import type { Quality } from './types';

const QUALITY_GOOD: Quality = 4;
const QUALITY_AGAIN: Quality = 1;

export function ratingToQuality(rating: SrsRating): Quality {
  return rating === 'good' ? QUALITY_GOOD : QUALITY_AGAIN;
}
