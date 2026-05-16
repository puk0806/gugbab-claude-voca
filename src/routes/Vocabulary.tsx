/**
 * `/vocabulary/:cefr/:cardType` — 단어장 (Mode D, 학습 X).
 *
 * - 학습 우선순위 점수 기반 정렬 (모름 → 복습필요 → 학습중 → 미학습 → 완료 → 안다)
 * - 단계별 카운터 + 필터 chip
 * - 검색 (영어 / 한국어)
 * - **무한 스크롤 = IntersectionObserver** (useInfiniteSentinel 훅)
 * - **가상 스크롤 = react-virtuoso** (useWindowScroll 모드 — 페이지 자체 스크롤)
 * - 카드별 mark 토글 (known / unknown / null)
 *
 * 두 관심사 분리:
 * - IntersectionObserver는 *언제 더 노출할지* 트리거 (배치 +60)
 * - virtuoso는 *어떻게 DOM 최소 렌더할지* (윈도윙)
 */
import { useCallback, useState } from 'react';
import { type LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { fillCloze, loadSentences, loadWords } from '@/content';
import type { SentenceEntry, WordEntry } from '@/content';
import { clearMark, getAllProgressByLevel, listMarksByLevel, setMark } from '@/db';
import {
  type LearningStage,
  type ScoredCard,
  StageFilterChips,
  useInfiniteSentinel,
  useVocabularyCards,
  VocabularyRow,
} from '@/features/vocabulary';
import type { SrsCard } from '@/srs/types';
import {
  type CardType,
  type CEFR,
  isCardType,
  isCefr,
  type UserMark,
} from '@/shared/types';
import styles from './Vocabulary.module.css';

interface VocabularyLoaderData {
  readonly level: CEFR;
  readonly cardType: CardType;
  readonly cards: ReadonlyArray<WordEntry | SentenceEntry>;
  readonly initialMarks: Readonly<Record<string, 'known' | 'unknown'>>;
  readonly initialProgress: readonly SrsCard[];
}

const PAGE_SIZE = 60;

export async function vocabularyLoader({
  params,
}: LoaderFunctionArgs): Promise<VocabularyLoaderData> {
  const cefr = params.cefr;
  const cardType = params.cardType;
  if (!cefr || !isCefr(cefr)) throw new Response('Invalid level', { status: 404 });
  if (!cardType || !isCardType(cardType))
    throw new Response('Invalid card type', { status: 404 });

  const [cards, marksMap, progress] = await Promise.all([
    cardType === 'word' ? loadWords(cefr) : loadSentences(cefr),
    listMarksByLevel(cardType, cefr),
    getAllProgressByLevel(cardType, cefr),
  ]);

  const initialMarks: Record<string, 'known' | 'unknown'> = {};
  for (const [id, mark] of marksMap.entries()) initialMarks[id] = mark;

  return { level: cefr, cardType, cards, initialMarks, initialProgress: progress };
}

function getDisplayEnglish(
  card: WordEntry | SentenceEntry,
  cardType: CardType,
): string {
  return cardType === 'sentence'
    ? fillCloze((card as SentenceEntry).english)
    : card.english;
}

function getDisplayKorean(
  card: WordEntry | SentenceEntry,
  cardType: CardType,
): string {
  if (cardType !== 'word') return card.korean;
  const word = card as WordEntry;
  return word.secondaryKorean ? `${word.korean} / ${word.secondaryKorean}` : word.korean;
}

export function Vocabulary() {
  const { level, cardType, cards, initialMarks, initialProgress } =
    useLoaderData() as VocabularyLoaderData;
  const [marks, setMarks] = useState<Record<string, 'known' | 'unknown'>>(initialMarks);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<LearningStage | 'all'>('all');

  const { scored, stageCounts, filtered, visible, hasMore, loadMore } =
    useVocabularyCards({
      cards,
      cardType,
      marks,
      initialProgress,
      query,
      stageFilter,
      pageSize: PAGE_SIZE,
      getDisplayEnglish,
      getDisplayKorean,
    });

  const sentinelRef = useInfiniteSentinel(loadMore, {
    disabled: !hasMore,
    rootMargin: '300px',
  });

  const handleToggle = useCallback(
    async (cardId: string, next: 'known' | 'unknown') => {
      const current = marks[cardId];
      const tsNow = Date.now();
      const newMark: UserMark = current === next ? null : next;

      setMarks((prev) => {
        const updated = { ...prev };
        if (newMark === null) {
          delete updated[cardId];
        } else {
          updated[cardId] = newMark;
        }
        return updated;
      });

      if (newMark === null) {
        await clearMark(cardId);
      } else {
        await setMark(cardId, cardType, level, newMark, tsNow);
      }
    },
    [marks, cardType, level],
  );

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>
        {level} 단어장 ({cardType === 'word' ? '단어' : '문장'})
      </h1>
      <p className={styles.subheading}>
        총 {cards.length}개 · 표시 {filtered.length}개 · 노출 {visible.length}개 (스크롤
        시 +{PAGE_SIZE})
      </p>

      <input
        type="search"
        className={styles.search}
        placeholder="영어 또는 한국어로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="단어장 검색"
      />

      <StageFilterChips
        stageFilter={stageFilter}
        stageCounts={stageCounts}
        totalCount={scored.length}
        onChange={setStageFilter}
      />

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>표시할 카드가 없어요</div>
      ) : (
        <>
          {/* virtuoso = 가상 스크롤 (DOM 윈도윙). useWindowScroll로 페이지 자체 스크롤 사용 */}
          <Virtuoso
            useWindowScroll
            data={visible as ScoredCard[]}
            increaseViewportBy={{ top: 200, bottom: 600 }}
            itemContent={(_idx, item) => (
              <VocabularyRow
                key={item.card.id}
                item={item}
                cardType={cardType}
                getDisplayEnglish={getDisplayEnglish}
                getDisplayKorean={getDisplayKorean}
                onToggle={handleToggle}
              />
            )}
          />
          {/* IntersectionObserver sentinel — 무한 스크롤 트리거 */}
          {hasMore && (
            <div
              ref={sentinelRef}
              className={styles.sentinel}
              aria-hidden="true"
              data-testid="infinite-sentinel"
            />
          )}
        </>
      )}
    </div>
  );
}
