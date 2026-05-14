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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { Virtuoso } from 'react-virtuoso';
import { fillCloze, loadSentences, loadWords } from '@/content';
import type { SentenceEntry, WordEntry } from '@/content';
import { clearMark, getAllProgressByLevel, listMarksByLevel, setMark } from '@/db';
import {
  computeLearningScore,
  type LearningStage,
  STAGE_META,
  useInfiniteSentinel,
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
const STAGE_ORDER: readonly LearningStage[] = [
  'unknown',
  'review-due',
  'learning',
  'new',
  'completed',
  'known',
];

export async function vocabularyLoader({
  params,
}: LoaderFunctionArgs): Promise<VocabularyLoaderData> {
  const cefr = params.cefr;
  const cardType = params.cardType;
  if (!cefr || !isCefr(cefr)) throw new Response('Invalid level', { status: 404 });
  if (!cardType || !isCardType(cardType)) throw new Response('Invalid card type', { status: 404 });

  const [cards, marksMap, progress] = await Promise.all([
    cardType === 'word' ? loadWords(cefr) : loadSentences(cefr),
    listMarksByLevel(cardType, cefr),
    getAllProgressByLevel(cardType, cefr),
  ]);

  const initialMarks: Record<string, 'known' | 'unknown'> = {};
  for (const [id, mark] of marksMap.entries()) initialMarks[id] = mark;

  return { level: cefr, cardType, cards, initialMarks, initialProgress: progress };
}

function getDisplayEnglish(card: WordEntry | SentenceEntry, cardType: CardType): string {
  return cardType === 'sentence' ? fillCloze((card as SentenceEntry).english) : card.english;
}

function getDisplayKorean(card: WordEntry | SentenceEntry, cardType: CardType): string {
  if (cardType !== 'word') return card.korean;
  const word = card as WordEntry;
  return word.secondaryKorean ? `${word.korean} / ${word.secondaryKorean}` : word.korean;
}

interface ScoredCard {
  readonly card: WordEntry | SentenceEntry;
  readonly mark: 'known' | 'unknown' | null;
  readonly stage: LearningStage;
  readonly score: number;
  readonly reps: number;
}

export function Vocabulary() {
  const { level, cardType, cards, initialMarks, initialProgress } =
    useLoaderData() as VocabularyLoaderData;
  const [marks, setMarks] = useState<Record<string, 'known' | 'unknown'>>(initialMarks);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<LearningStage | 'all'>('all');

  // 시각 고정 — 한 세션 내 정렬 안정성 (스크롤 중 재정렬 방지)
  const [now] = useState(() => Date.now());

  // cardId별 progress 그룹화
  const progressByCardId = useMemo(() => {
    const m = new Map<string, SrsCard[]>();
    for (const p of initialProgress) {
      const arr = m.get(p.cardId) ?? [];
      arr.push(p);
      m.set(p.cardId, arr);
    }
    return m;
  }, [initialProgress]);

  // 카드별 학습 점수·단계 계산
  const scored = useMemo<readonly ScoredCard[]>(() => {
    return cards.map((c) => {
      const mark = marks[c.id] ?? null;
      const progressByMode = progressByCardId.get(c.id) ?? [];
      const { score, stage } = computeLearningScore({ mark, progressByMode, now });
      const reps = progressByMode.reduce((sum, p) => sum + p.repetitions, 0);
      return { card: c, mark, stage, score, reps };
    });
  }, [cards, marks, progressByCardId, now]);

  // 단계별 카운트
  const stageCounts = useMemo<Readonly<Record<LearningStage, number>>>(() => {
    const init: Record<LearningStage, number> = {
      unknown: 0,
      'review-due': 0,
      learning: 0,
      new: 0,
      completed: 0,
      known: 0,
    };
    for (const s of scored) init[s.stage] += 1;
    return init;
  }, [scored]);

  // 필터 + 검색 + 정렬
  const filtered = useMemo<readonly ScoredCard[]>(() => {
    let arr: readonly ScoredCard[] = scored;
    if (stageFilter !== 'all') {
      arr = arr.filter((s) => s.stage === stageFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter((s) => {
        const en = getDisplayEnglish(s.card, cardType).toLowerCase();
        const ko = getDisplayKorean(s.card, cardType).toLowerCase();
        return en.includes(q) || ko.includes(q);
      });
    }
    return [...arr].sort((a, b) => a.score - b.score);
  }, [scored, stageFilter, query, cardType]);

  // 무한 스크롤(IntersectionObserver) + 가상 스크롤(virtuoso) 분리 구조
  // 1. visibleCount = 현재까지 노출된 batch 크기 (60 → 120 → 180 …)
  // 2. IntersectionObserver가 sentinel viewport 진입 감지 → +60
  // 3. virtuoso는 visible 배열만 받아 DOM 최소 렌더
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 필터·검색 변경 시 visibleCount 리셋
  // biome-ignore lint/correctness/useExhaustiveDependencies: stageFilter/query 변화 트리거가 의도
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [stageFilter, query]);

  const visible = useMemo(
    () => filtered.slice(0, Math.min(visibleCount, filtered.length)),
    [filtered, visibleCount],
  );

  const hasMore = visible.length < filtered.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  // IntersectionObserver — sentinel이 viewport 300px 앞 진입 시 +60 batch
  const sentinelRef = useInfiniteSentinel(handleLoadMore, {
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
        총 {cards.length}개 · 표시 {filtered.length}개 · 노출 {visible.length}개 (스크롤 시 +
        {PAGE_SIZE})
      </p>

      <input
        type="search"
        className={styles.search}
        placeholder="영어 또는 한국어로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="단어장 검색"
      />

      <div className={styles.stageChips} role="tablist" aria-label="학습 단계 필터">
        <button
          type="button"
          role="tab"
          aria-selected={stageFilter === 'all'}
          className={`${styles.stageChip} ${stageFilter === 'all' ? styles.active : ''}`}
          onClick={() => setStageFilter('all')}
        >
          전체 <span className={styles.chipCount}>{scored.length}</span>
        </button>
        {STAGE_ORDER.map((stage) => (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={stageFilter === stage}
            className={`${styles.stageChip} ${styles[`chip-${stage}`] ?? ''} ${
              stageFilter === stage ? styles.active : ''
            }`}
            onClick={() => setStageFilter(stage)}
          >
            <span className={`${styles.dot} ${styles[`dot-${stage}`] ?? ''}`} />
            {STAGE_META[stage].label}
            <span className={styles.chipCount}>{stageCounts[stage]}</span>
          </button>
        ))}
      </div>

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

interface VocabularyRowProps {
  readonly item: ScoredCard;
  readonly cardType: CardType;
  readonly onToggle: (cardId: string, next: 'known' | 'unknown') => void;
}

function VocabularyRow({ item, cardType, onToggle }: VocabularyRowProps) {
  const { card, mark, stage, reps } = item;
  const english = getDisplayEnglish(card, cardType);
  const korean = getDisplayKorean(card, cardType);
  const stageLabel = STAGE_META[stage].label;

  return (
    <li className={styles.item} data-testid={`vocab-row-${card.id}`}>
      <span
        role="img"
        className={`${styles.dot} ${styles[`dot-${stage}`] ?? ''}`}
        aria-label={`학습 단계: ${stageLabel}`}
        title={stageLabel}
      />
      <div className={styles.itemMain}>
        <span className={styles.itemEnglish}>{english}</span>
        <span className={styles.itemKorean}>{korean}</span>
        {reps > 0 && <span className={styles.itemMeta}>학습 {reps}회</span>}
      </div>
      <div className={styles.markToggle}>
        <button
          type="button"
          className={`${styles.markBtn} ${styles.unknown} ${
            mark === 'unknown' ? styles.active : ''
          }`}
          onClick={() => onToggle(card.id, 'unknown')}
          aria-pressed={mark === 'unknown'}
          aria-label={`${english} 모름 표시`}
          data-testid={`mark-unknown-${card.id}`}
        >
          모름
        </button>
        <button
          type="button"
          className={`${styles.markBtn} ${styles.known} ${
            mark === 'known' ? styles.active : ''
          }`}
          onClick={() => onToggle(card.id, 'known')}
          aria-pressed={mark === 'known'}
          aria-label={`${english} 안다 표시`}
          data-testid={`mark-known-${card.id}`}
        >
          안다
        </button>
      </div>
    </li>
  );
}
