/**
 * 클로즈 학습 컴포넌트 (Mode C, 문장 전용 빈칸 채우기).
 *
 * - english 필드의 {word} 마커가 빈칸 위치
 * - cloze 배열에 빈칸별 정답
 * - 모든 빈칸이 정답이어야 good. 하나라도 오답이면 again
 * - 빈칸 1~N개 지원 (N개면 N개 입력창 표시)
 *
 * 흐름 (Recall 과 동일 UX):
 *   - 정답: "정답입니다!" 피드백 + "다음 카드" 버튼 (사용자가 명시적으로 진행)
 *   - 오답: "틀렸어요" 피드백 + "다시 시도" / "정답 보기"
 *     - "정답 보기": 정답 노출 + "다음 카드" (advance는 사용자 클릭 시점)
 *     - 3회 연속 오답 시 자동으로 정답보기 모드 (advance 보류)
 *
 * `onAnswer` 호출 시점은 항상 "다음 카드" 버튼 클릭 — Recall 과 일관.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseCloze } from '@/content';
import type { SentenceEntry } from '@/content';
import type { SrsRating } from '@/shared/types';
import { isAllCorrect } from '@/srs';
import styles from './ClozePrompt.module.css';

interface ClozePromptProps {
  readonly card: SentenceEntry;
  readonly onAnswer: (rating: SrsRating) => void;
}

const MAX_RETRIES_BEFORE_REVEAL = 3;

export function ClozePrompt({ card, onAnswer }: ClozePromptProps) {
  const { parts, markers } = useMemo(() => parseCloze(card.english), [card.english]);
  const expecteds = useMemo(() => card.cloze ?? markers, [card.cloze, markers]);
  const [inputs, setInputs] = useState<string[]>(() => expecteds.map(() => ''));
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // 카드 변경 시 리셋
  // biome-ignore lint/correctness/useExhaustiveDependencies: card.id 변경 시점에 reset
  useEffect(() => {
    setInputs(expecteds.map(() => ''));
    setSubmitted(false);
    setCorrect(null);
    setRevealed(false);
    setAttempts(0);
    firstInputRef.current?.focus();
  }, [card.id, expecteds]);

  const allFilled = inputs.every((v) => v.trim().length > 0);

  const handleSubmit = useCallback(() => {
    if (!allFilled) return;
    const ok = isAllCorrect(inputs, expecteds);
    setSubmitted(true);
    setCorrect(ok);
    if (!ok) {
      setAttempts((prev) => prev + 1);
    }
  }, [allFilled, inputs, expecteds]);

  // 3회 연속 오답 시 자동 reveal. onAnswer 는 "다음 카드" 클릭까지 보류.
  useEffect(() => {
    if (attempts >= MAX_RETRIES_BEFORE_REVEAL && !revealed) {
      setRevealed(true);
    }
  }, [attempts, revealed]);

  const handleRetry = useCallback(() => {
    setInputs(expecteds.map(() => ''));
    setSubmitted(false);
    setCorrect(null);
    firstInputRef.current?.focus();
  }, [expecteds]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleNext = useCallback(() => {
    const rating: SrsRating = correct === true && !revealed ? 'good' : 'again';
    onAnswer(rating);
  }, [correct, revealed, onAnswer]);

  const updateInput = (index: number, value: string): void => {
    setInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const showCorrectPath = submitted && correct === true;
  const showWrongPath = submitted && correct === false && !revealed;

  return (
    <div className={styles.root}>
      <div className={styles.prompt}>
        <div className={styles.english}>
          {parts.map((part, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: parts is index-stable
            <span key={`p-${i}`}>
              {part}
              {i < markers.length && (
                <span
                  className={`${styles.blank} ${inputs[i] ? styles.filled : ''}`}
                  role="img"
                  aria-label={`빈칸 ${i + 1}`}
                >
                  {revealed ? expecteds[i] : inputs[i] || '_____'}
                </span>
              )}
            </span>
          ))}
        </div>
        <div className={styles.korean}>{card.korean}</div>
      </div>

      <div className={styles.inputsRow}>
        {expecteds.map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: expecteds is index-stable
          <div key={`in-${i}`}>
            <div className={styles.inputLabel}>빈칸 {i + 1}</div>
            <input
              ref={i === 0 ? firstInputRef : undefined}
              type="text"
              className={`${styles.input} ${
                submitted ? (correct ? styles.correct : styles.incorrect) : ''
              }`}
              value={inputs[i] ?? ''}
              onChange={(e) => updateInput(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !submitted && allFilled) {
                  handleSubmit();
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={submitted}
              aria-label={`빈칸 ${i + 1} 입력`}
            />
          </div>
        ))}
      </div>

      {showCorrectPath && (
        <div className={`${styles.feedback} ${styles.feedbackCorrect}`} role="status">
          정답입니다!
        </div>
      )}
      {showWrongPath && (
        <div className={`${styles.feedback} ${styles.feedbackWrong}`} role="status">
          틀렸어요. 다시 시도하거나 정답을 확인해 보세요.
        </div>
      )}

      {revealed && (
        <div className={styles.reveal} role="status">
          정답:
          {expecteds.map((ans, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: expecteds is index-stable
            <span key={`ans-${i}`} className={styles.revealAnswer}>
              {ans}
              {i < expecteds.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        {!submitted && (
          <button
            type="button"
            className={`${styles.action} ${styles.primary}`}
            onClick={handleSubmit}
            disabled={!allFilled}
          >
            제출
          </button>
        )}
        {showCorrectPath && (
          <button
            type="button"
            className={`${styles.action} ${styles.primary}`}
            onClick={handleNext}
          >
            다음 카드
          </button>
        )}
        {showWrongPath && (
          <>
            <button type="button" className={styles.action} onClick={handleRetry}>
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
            onClick={handleNext}
          >
            다음 카드
          </button>
        )}
      </div>
    </div>
  );
}
