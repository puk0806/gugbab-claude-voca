/**
 * 리콜 학습 컴포넌트 (Mode B, 한→영 입력).
 *
 * 흐름:
 *   한국어 표시 → 영어 입력 → 제출
 *   - 정답: "정답!" 피드백 + "다음 카드" 버튼 (사용자가 명시적으로 진행)
 *   - 오답: "틀렸어요" 피드백 + "다시 시도" / "정답 보기" / "힌트" (오답 1회 이상)
 *     - "다시 시도": 입력 재활성, 같은 카드 유지
 *     - "정답 보기": 정답 노출 + "다음 카드" (advance는 사용자 클릭 시점)
 *     - "힌트": 마스크에서 한 글자씩 점진 노출. 다 노출되면 버튼 사라짐.
 *     - 3회 연속 오답 시 자동으로 정답보기 모드 진입 (좌절 방지, advance는 X)
 *
 * 한국어 prompt 아래에 *정답 글자수 마스크* 가 항상 노출된다 (다의어 단어 추측 도움).
 * 공백은 그대로 두고 글자만 `_` 로 마스킹. 힌트 누를 때마다 앞에서부터 1글자씩 노출.
 *
 * `onAnswer` 호출 시점은 항상 "다음 카드" 버튼 클릭 — 정답·오답·reveal 통합 처리.
 * 이는 reveal 직후 카드가 advance되어 정답을 못 보는 버그를 방지한다.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SentenceEntry, WordEntry } from '@/content';
import { fillCloze } from '@/content';
import type { SrsRating } from '@/shared/types';
import { isCorrect } from '@/srs';
import styles from './RecallPrompt.module.css';

interface RecallPromptProps {
  readonly card: WordEntry | SentenceEntry;
  readonly cardType: 'word' | 'sentence';
  readonly onAnswer: (rating: SrsRating) => void;
}

const MAX_RETRIES_BEFORE_REVEAL = 3;

/**
 * 정답 글자수 마스크 생성. 공백은 그대로, 글자는 revealedCount 이내면 노출.
 */
function buildMask(expected: string, revealedCount: number): string {
  let result = '';
  let letterIndex = 0;
  for (const ch of expected) {
    if (ch === ' ') {
      result += ' ';
    } else {
      result += letterIndex < revealedCount ? ch : '_';
      letterIndex += 1;
    }
  }
  return result;
}

/** 마스킹 대상 글자 수 (공백 제외). */
function countLetters(expected: string): number {
  let n = 0;
  for (const ch of expected) {
    if (ch !== ' ') n += 1;
  }
  return n;
}

export function RecallPrompt({ card, cardType, onAnswer }: RecallPromptProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [hintCount, setHintCount] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const expected =
    cardType === 'sentence' ? fillCloze((card as SentenceEntry).english) : card.english;

  const letterCount = useMemo(() => countLetters(expected), [expected]);
  const mask = useMemo(() => buildMask(expected, hintCount), [expected, hintCount]);

  // 카드 변경 시 리셋
  // biome-ignore lint/correctness/useExhaustiveDependencies: card.id 변경 추적이 의도
  useEffect(() => {
    setInput('');
    setSubmitted(false);
    setCorrect(null);
    setRevealed(false);
    setAttempts(0);
    setHintCount(0);
    inputRef.current?.focus();
  }, [card.id]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const ok = isCorrect(input, expected);
    setSubmitted(true);
    setCorrect(ok);
    if (!ok) {
      setAttempts((prev) => prev + 1);
    }
  }, [input, expected]);

  // 3회 연속 오답 시 자동으로 정답 보기 모드 진입 (좌절 방지).
  // onAnswer 호출은 사용자가 "다음 카드"를 누를 때까지 보류.
  useEffect(() => {
    if (attempts >= MAX_RETRIES_BEFORE_REVEAL && !revealed) {
      setRevealed(true);
    }
  }, [attempts, revealed]);

  const handleRetry = useCallback(() => {
    setInput('');
    setSubmitted(false);
    setCorrect(null);
    inputRef.current?.focus();
  }, []);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleHint = useCallback(() => {
    // hintCount 만 갱신 — 추가 힌트는 연속 클릭으로. 입력 재시도는 [다시 시도] 클릭.
    setHintCount((c) => Math.min(c + 1, letterCount));
  }, [letterCount]);

  const handleNext = useCallback(() => {
    // 정답이고 reveal 안 됐으면 'good', 그 외(오답·reveal)는 'again'.
    const rating: SrsRating = correct === true && !revealed ? 'good' : 'again';
    onAnswer(rating);
  }, [correct, revealed, onAnswer]);

  const inputCls = submitted ? (correct ? styles.correct : styles.incorrect) : '';
  const showCorrectPath = submitted && correct === true;
  const showWrongPath = submitted && correct === false && !revealed;
  // 힌트 버튼: 오답 1회 이상 + reveal 안 됨 + 정답 아님 + 더 노출할 글자 있음
  const canShowHint = attempts >= 1 && !revealed && correct !== true && hintCount < letterCount;

  return (
    <div className={styles.root}>
      <div className={styles.prompt}>
        <div className={styles.korean}>{card.korean}</div>
        <div className={styles.mask} role="img" aria-label={`정답 글자수 ${letterCount}`}>
          {mask}
        </div>
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
          disabled={submitted}
        />

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
            <button
              type="button"
              className={`${styles.action} ${styles.secondary}`}
              onClick={handleRetry}
            >
              다시 시도
            </button>
            {canShowHint && (
              <button
                type="button"
                className={`${styles.action} ${styles.secondary}`}
                onClick={handleHint}
              >
                힌트 ({hintCount + 1}/{letterCount})
              </button>
            )}
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
