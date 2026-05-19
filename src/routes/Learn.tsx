/**
 * `/learn/:cefr/:cardType/:studyMode` — 학습 세션 화면.
 *
 * 흐름:
 *   1. loader: 콘텐츠 + 진도 + 마킹 → composeQueue → 세션 시작
 *   2. useLearnSession 훅: 세션 라이프사이클·답변 처리·종료 판정
 *   3. studyMode별 컴포넌트 분기 (flashcard / recall / cloze)
 *   4. 큐 소진 시 SessionSummary 렌더
 */
import { type LoaderFunctionArgs, useLoaderData, useParams } from 'react-router-dom';
import type { SentenceEntry, WordEntry } from '@/content';
import { loadSentences, loadWords } from '@/content';
import { getAllProgressByLevel, getDueCards, getNewProgress, listMarksByLevel } from '@/db';
import { ClozePrompt } from '@/features/cloze';
import { Flashcard } from '@/features/flashcard';
import {
  composeQueue,
  type LearnSessionData,
  SessionSummary,
  useLearnSession,
} from '@/features/learning';
import { RecallPrompt } from '@/features/recall';
import { EmptyState } from '@/shared/components';
import { isCardType, isCefr, isStudyMode, isStudyModeAvailable } from '@/shared/types';
import type { SrsCard } from '@/srs';
import { useSpeak } from '@/tts';
import styles from './Learn.module.css';

const DEFAULT_SESSION_SIZE = 20;
const DEFAULT_NEW_RATIO = 0.3;

export async function learnLoader({ params }: LoaderFunctionArgs): Promise<LearnSessionData> {
  const cefr = params.cefr;
  const cardType = params.cardType;
  const studyMode = params.studyMode;

  if (!cefr || !isCefr(cefr)) throw new Response('Invalid level', { status: 404 });
  if (!cardType || !isCardType(cardType)) throw new Response('Invalid card type', { status: 404 });
  if (!studyMode || !isStudyMode(studyMode)) throw new Response('Invalid mode', { status: 404 });
  if (!isStudyModeAvailable(cardType, studyMode)) {
    throw new Response('Mode not available for this card type', { status: 404 });
  }

  const content = cardType === 'word' ? await loadWords(cefr) : await loadSentences(cefr);
  const due = await getDueCards(studyMode, cardType, cefr, Date.now());
  const newProgress = await getNewProgress(studyMode, cardType, cefr);
  const marks = await listMarksByLevel(cardType, cefr);
  const allModeProgress = await getAllProgressByLevel(cardType, cefr);

  const contentIds = content.map((c) => c.id);
  const progress: SrsCard[] = [...due, ...newProgress];

  // composeQueue 가 cardId 별 다른 mode 통과 여부 판정에 사용
  const allProgressByCardId = new Map<string, SrsCard[]>();
  for (const p of allModeProgress) {
    const arr = allProgressByCardId.get(p.cardId) ?? [];
    arr.push(p);
    allProgressByCardId.set(p.cardId, arr);
  }

  const queue = composeQueue({
    progress,
    contentIds,
    allProgressByCardId,
    cardType,
    studyMode,
    sessionSize: DEFAULT_SESSION_SIZE,
    newCardRatio: DEFAULT_NEW_RATIO,
    now: Date.now(),
  });

  const cardsById: Record<string, WordEntry | SentenceEntry> = {};
  for (const c of content) cardsById[c.id] = c;

  const marksByCardId: LearnSessionData['marksByCardId'] = (() => {
    const m: Record<string, 'known' | 'unknown' | 'mastered'> = {};
    for (const [id, mark] of marks.entries()) m[id] = mark;
    return m;
  })();

  const progressByCardId: Record<string, SrsCard> = {};
  for (const p of progress) progressByCardId[p.cardId] = p;

  return {
    level: cefr,
    cardType,
    studyMode,
    queue,
    cardsById,
    marksByCardId,
    progressByCardId,
  };
}

export function Learn() {
  const data = useLoaderData() as LearnSessionData;
  const params = useParams();
  const { speak, supported: ttsSupported } = useSpeak();
  const { currentCard, cursor, queueLength, finished, getSummary, handleAnswer, restart } =
    useLearnSession(data);

  if (finished) {
    const sum = getSummary();
    return (
      <SessionSummary
        cardsSeen={sum.cardsSeen}
        goodCount={sum.goodCount}
        againCount={sum.againCount}
        onRestart={restart}
      />
    );
  }

  if (!currentCard) {
    return <EmptyState title="카드를 불러오는 중..." />;
  }

  const modeLabel =
    data.studyMode === 'flashcard' ? '플래시카드' : data.studyMode === 'recall' ? '리콜' : '클로즈';

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <span>
          {params.cefr} · {data.cardType === 'word' ? '단어' : '문장'}
        </span>
        <span className={styles.progress}>
          {cursor + 1} / {queueLength}
        </span>
        <span className={styles.modeChip}>{modeLabel}</span>
      </div>

      {data.studyMode === 'flashcard' && (
        <Flashcard
          card={currentCard}
          cardType={data.cardType}
          onAnswer={handleAnswer}
          onSpeak={ttsSupported ? speak : undefined}
          ttsSupported={ttsSupported}
        />
      )}
      {data.studyMode === 'recall' && (
        <RecallPrompt card={currentCard} cardType={data.cardType} onAnswer={handleAnswer} />
      )}
      {data.studyMode === 'cloze' && data.cardType === 'sentence' && (
        <ClozePrompt card={currentCard as SentenceEntry} onAnswer={handleAnswer} />
      )}
    </div>
  );
}
