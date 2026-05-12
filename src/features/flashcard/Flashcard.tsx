/**
 * 플래시카드 학습 컴포넌트 (Mode A).
 *
 * 흐름: 앞면(영어) → 뒤집기 → 뒷면(한국어) → 알았음/모르겠음
 * 키보드: Space=뒤집기, ←=again, →=good
 *
 * cardType=word면 영어 + 품사 + 한국어 표시.
 * cardType=sentence면 클로즈 마커가 채워진 영어 + 한국어 표시.
 */
import { useCallback, useEffect, useState } from 'react';
import { fillCloze } from '@/content';
import type { SentenceEntry, WordEntry } from '@/content';
import type { SrsRating } from '@/shared/types';
import styles from './Flashcard.module.css';

interface FlashcardProps {
  readonly card: WordEntry | SentenceEntry;
  readonly cardType: 'word' | 'sentence';
  readonly onAnswer: (rating: SrsRating) => void;
  readonly onSpeak?: ((text: string) => void) | undefined;
  readonly ttsSupported?: boolean;
}

export function Flashcard({
  card,
  cardType,
  onAnswer,
  onSpeak,
  ttsSupported = false,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  const englishDisplay =
    cardType === 'sentence' ? fillCloze((card as SentenceEntry).english) : card.english;

  const flip = useCallback(() => setFlipped((prev) => !prev), []);

  const answer = useCallback(
    (rating: SrsRating) => {
      if (!flipped) return;
      onAnswer(rating);
      setFlipped(false);
    },
    [flipped, onAnswer],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        flip();
      } else if (e.code === 'ArrowLeft' && flipped) {
        answer('again');
      } else if (e.code === 'ArrowRight' && flipped) {
        answer('good');
      } else if (e.code === 'KeyP' && onSpeak) {
        onSpeak(englishDisplay);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip, answer, flipped, onSpeak, englishDisplay]);

  // 카드 변경 시 자동 뒤집기 리셋
  // biome-ignore lint/correctness/useExhaustiveDependencies: card.id 변경 추적이 의도
  useEffect(() => {
    setFlipped(false);
  }, [card.id]);

  const pos = cardType === 'word' ? (card as WordEntry).partOfSpeech : undefined;

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.card}
        onClick={flip}
        aria-label={flipped ? '카드 뒷면' : '카드 앞면 — 탭하여 뒤집기'}
      >
        {onSpeak && (
          <button
            type="button"
            className={styles.ttsButton}
            onClick={(e) => {
              e.stopPropagation();
              onSpeak(englishDisplay);
            }}
            disabled={!ttsSupported}
            aria-label="영어 발음 듣기"
            title={ttsSupported ? '발음 듣기 (P)' : '이 브라우저는 음성 재생을 지원하지 않습니다'}
          >
            🔊
          </button>
        )}
        <div className={styles.face}>
          {flipped ? (
            <div className={styles.korean}>{card.korean}</div>
          ) : (
            <>
              <div className={styles.english}>{englishDisplay}</div>
              {pos && <div className={styles.pos}>{pos}</div>}
            </>
          )}
        </div>
        <div className={styles.hint}>
          {flipped ? '알았음 / 모르겠음을 선택하세요' : '카드를 탭하거나 Space로 뒤집기'}
        </div>
      </button>

      <div className={styles.actions}>
        {!flipped ? (
          <button type="button" className={`${styles.action} ${styles.flip}`} onClick={flip}>
            뒤집기
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`${styles.action} ${styles.again}`}
              onClick={() => answer('again')}
            >
              모르겠음
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.good}`}
              onClick={() => answer('good')}
            >
              알았음
            </button>
          </>
        )}
      </div>
    </div>
  );
}
