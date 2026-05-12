/**
 * 리콜 학습 컴포넌트 (Mode B, 한→영 입력).
 *
 * 흐름:
 *   한국어 표시 → 영어 입력 → 제출
 *   - 정답: 자동 진행 (good)
 *   - 오답: "다시 시도" / "정답 보기" 노출
 *     - "정답 보기" 탭 → 정답 노출 + again 처리
 *     - 3회 연속 오답 시 자동 정답보기 모드 (좌절 방지)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { fillCloze } from '@/content';
import type { SentenceEntry, WordEntry } from '@/content';
import type { SrsRating } from '@/shared/types';
import { isCorrect } from '@/srs';
import styles from './RecallPrompt.module.css';

interface RecallPromptProps {
  readonly card: WordEntry | SentenceEntry;
  readonly cardType: 'word' | 'sentence';
  readonly onAnswer: (rating: SrsRating) => void;
}

const MAX_RETRIES_BEFORE_REVEAL = 3;

export function RecallPrompt({ card, cardType, onAnswer }: RecallPromptProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const expected =
    cardType === 'sentence' ? fillCloze((card as SentenceEntry).english) : card.english;

  const reset = useCallback(() => {
    setInput('');
    setSubmitted(false);
    setCorrect(null);
    setRevealed(false);
    setAttempts(0);
  }, []);

  // 카드 변경 시 리셋
  // biome-ignore lint/correctness/useExhaustiveDependencies: card.id 변경 추적이 의도
  useEffect(() => {
    reset();
    inputRef.current?.focus();
  }, [card.id, reset]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const ok = isCorrect(input, expected);
    setSubmitted(true);
    setCorrect(ok);
    if (ok) {
      onAnswer('good');
    } else {
      setAttempts((prev) => prev + 1);
    }
  }, [input, expected, onAnswer]);

  // 3회 연속 오답 시 자동으로 정답 보기 모드 진입 (좌절 방지)
  useEffect(() => {
    if (attempts >= MAX_RETRIES_BEFORE_REVEAL && !revealed) {
      setRevealed(true);
      onAnswer('again');
    }
  }, [attempts, revealed, onAnswer]);

  const handleRetry = useCallback(() => {
    setInput('');
    setSubmitted(false);
    setCorrect(null);
    inputRef.current?.focus();
  }, []);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    onAnswer('again');
  }, [onAnswer]);

  const inputCls = submitted
    ? correct
      ? styles.correct
      : styles.incorrect
    : '';

  return (
    <div className={styles.root}>
      <div className={styles.prompt}>
        <div className={styles.korean}>{card.korean}</div>
      </div>

      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          className={`${styles.input} ${inputCls}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !submitted) {
              handleSubmit();
            }
          }}
          placeholder="영어로 입력하세요"
          aria-label="영어 입력"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={revealed}
        />

        {revealed && (
          <div className={styles.reveal}>
            정답: <span className={styles.revealAnswer}>{expected}</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {!submitted && (
          <button
            type="button"
            className={`${styles.action} ${styles.primary}`}
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            제출
          </button>
        )}
        {submitted && correct === false && !revealed && (
          <>
            <button
              type="button"
              className={`${styles.action} ${styles.secondary}`}
              onClick={handleRetry}
            >
              다시 시도
            </button>
            <button
              type="button"
              className={`${styles.action} ${styles.primary}`}
              onClick={handleReveal}
            >
              정답 보기
            </button>
          </>
        )}
        {revealed && (
          <button
            type="button"
            className={`${styles.action} ${styles.primary}`}
            onClick={reset}
          >
            다음 카드
          </button>
        )}
      </div>
    </div>
  );
}
