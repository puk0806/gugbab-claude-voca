# 진척률 가시화 (Home + Level + Mode) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IndexedDB에 영속화 중인 학습 진도를 Home / Level / Mode 세 화면에 표시해, 사용자가 "메모리가 안 남는다"고 느끼는 인지 갭을 제거한다.

**Architecture:**
- 순수 함수 `summarizeProgress` 하나로 cardId 단위 집계 (learned·completed·due) 표준화.
- Repo 계층에 `getProgressSummary(cardType, level, now)` 추가, 세 라우트 loader가 공유.
- UI: 기존 `LevelCard`는 그대로 활용 (`learnedCount`·`dueCount`만 실제값 주입). Level / Mode 타일은 부 라벨로 진척 표시.

**Tech Stack:** React 19, React Router 7, Dexie 4, TypeScript, Vitest, Biome.

**브랜치:** `feature/progress-visibility` (main에서 분기).

---

## 정의

- **total**: 해당 (cardType, level) 콘텐츠의 전체 카드 수 (manifest 기반).
- **learned**: cardId 단위로 progress 행이 1개 이상 존재하는 카드 수 (어떤 studyMode든 한 번이라도 답한 카드).
- **completed**: cardId 단위로 *모든* progress 행이 `state === 'review' && dueAt > now` 인 카드 수 (= `computeLearningScore`의 'completed' 단계).
- **due**: cardId 단위로 어떤 progress 행이 `state !== 'new' && dueAt <= now` 인 카드 수.

세 수치는 cardId 단위 dedup. studyMode별 중복 집계 안 함.

---

## File Structure

- 신규: `src/db/repository/progressSummary.ts` — 순수 함수 `summarizeProgress` + 타입 `ProgressSummary`.
- 신규: `src/db/repository/progressSummary.test.ts` — 순수 함수 단위 테스트.
- 수정: `src/db/repository/progressRepo.ts` — `getProgressSummary` 추가 (DB → summarizeProgress 어댑터).
- 수정: `src/db/repository/progressRepo.test.ts` — repo 통합 테스트 케이스 추가.
- 수정: `src/db/index.ts` — 새 함수·타입 export.
- 수정: `src/routes/Home.tsx` — loader가 (level × cardType) 진도 합쳐 LevelCard에 주입.
- 수정: `src/routes/Home.test.tsx` — progress 주입 시 LevelCard에 숫자 반영 검증.
- 수정: `src/routes/Level.tsx` — loader에서 word/sentence 진도 fetch, 타일에 표시.
- 수정: `src/routes/Level.test.tsx` — 진척 라벨 검증.
- 수정: `src/routes/Level.module.css` — 진척 라벨 스타일 (소형 폰트, 보조 색).
- 수정: `src/routes/Mode.tsx` — loader가 studyMode별 진도 fetch, 4개 타일에 표시.
- 수정: `src/routes/Mode.test.tsx` — studyMode별 라벨 검증.
- 수정: `src/routes/Mode.module.css` — 라벨 스타일.

---

## Task 1: `ProgressSummary` 순수 집계 함수

**Files:**
- Create: `src/db/repository/progressSummary.ts`
- Create: `src/db/repository/progressSummary.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/db/repository/progressSummary.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { SrsCard } from '@/srs/types';
import { summarizeProgress } from './progressSummary';

function mkCard(
  cardId: string,
  studyMode: 'flashcard' | 'recall' | 'cloze',
  state: SrsCard['state'],
  dueAt: number,
): SrsCard {
  return {
    cardId,
    studyMode,
    cardType: 'word',
    level: 'A1',
    state,
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt,
    lastReviewedAt: 0,
    lapses: 0,
    lastRating: 'good',
  };
}

describe('summarizeProgress', () => {
  const now = 1_000_000_000_000;

  it('progress 0개 → 모두 0', () => {
    expect(summarizeProgress({ totalContent: 100, progress: [], now })).toEqual({
      total: 100,
      learned: 0,
      completed: 0,
      due: 0,
    });
  });

  it('learned = cardId 단위 dedup', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'learning', now + 1000),
      mkCard('c1', 'recall', 'learning', now + 1000),
      mkCard('c2', 'flashcard', 'learning', now + 1000),
    ];
    const r = summarizeProgress({ totalContent: 100, progress, now });
    expect(r.learned).toBe(2);
  });

  it('due = state !== "new" AND dueAt <= now (cardId dedup)', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'review', now - 1000),
      mkCard('c1', 'recall', 'review', now + 1000),
      mkCard('c2', 'flashcard', 'learning', now - 1000),
      mkCard('c3', 'flashcard', 'new', now - 1000),
    ];
    const r = summarizeProgress({ totalContent: 100, progress, now });
    expect(r.due).toBe(2);
  });

  it('completed = 모든 모드가 review state + dueAt > now', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'review', now + 1000),
      mkCard('c1', 'recall', 'review', now + 1000),
      mkCard('c2', 'flashcard', 'review', now + 1000),
      mkCard('c2', 'recall', 'learning', now + 1000),
    ];
    const r = summarizeProgress({ totalContent: 100, progress, now });
    expect(r.completed).toBe(1);
  });

  it('learned >= completed (포함 관계)', () => {
    const progress = [
      mkCard('c1', 'flashcard', 'review', now + 1000),
      mkCard('c2', 'flashcard', 'learning', now + 1000),
    ];
    const r = summarizeProgress({ totalContent: 10, progress, now });
    expect(r.learned).toBe(2);
    expect(r.completed).toBe(1);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/db/repository/progressSummary.test.ts`
Expected: FAIL — `Cannot find module './progressSummary'`.

- [ ] **Step 3: 최소 구현**

`src/db/repository/progressSummary.ts`:
```ts
/**
 * progress 행 배열을 cardId 단위 집계 통계로 변환하는 순수 함수.
 *
 * - learned: cardId 단위 dedup, progress 1개 이상.
 * - completed: 모든 모드가 review state + dueAt > now (졸업).
 * - due: 어떤 모드든 state !== 'new' && dueAt <= now (오늘 복습).
 *
 * React·Dexie 의존 0.
 */
import type { SrsCard } from '@/srs/types';

export interface ProgressSummary {
  readonly total: number;
  readonly learned: number;
  readonly completed: number;
  readonly due: number;
}

export interface SummarizeInput {
  readonly totalContent: number;
  readonly progress: readonly SrsCard[];
  readonly now: number;
}

export function summarizeProgress(input: SummarizeInput): ProgressSummary {
  const { totalContent, progress, now } = input;

  const byCard = new Map<string, SrsCard[]>();
  for (const p of progress) {
    const arr = byCard.get(p.cardId) ?? [];
    arr.push(p);
    byCard.set(p.cardId, arr);
  }

  let learned = 0;
  let completed = 0;
  let due = 0;

  for (const rows of byCard.values()) {
    learned += 1;
    const isCompleted = rows.every((p) => p.state === 'review' && p.dueAt > now);
    if (isCompleted) completed += 1;
    const hasDue = rows.some((p) => p.state !== 'new' && p.dueAt <= now);
    if (hasDue) due += 1;
  }

  return { total: totalContent, learned, completed, due };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/db/repository/progressSummary.test.ts`
Expected: 5 PASS.

- [ ] **Step 5: 커밋**

```bash
git checkout -b feature/progress-visibility
git add src/db/repository/progressSummary.ts src/db/repository/progressSummary.test.ts
git commit -m "[code] Add: summarizeProgress 순수 집계 함수 (cardId 단위 dedup)"
```

---

## Task 2: `getProgressSummary` repo 어댑터 + export

**Files:**
- Modify: `src/db/repository/progressRepo.ts` (말미 함수 추가)
- Modify: `src/db/repository/progressRepo.test.ts`
- Modify: `src/db/index.ts`

- [ ] **Step 1: repo 테스트 케이스 추가**

`src/db/repository/progressRepo.test.ts` 의 기존 describe 블록 내부에 추가:
```ts
it('getProgressSummary: 진도 없으면 모두 0', async () => {
  const r = await getProgressSummary('word', 'A1', 100, Date.now());
  expect(r).toEqual({ total: 100, learned: 0, completed: 0, due: 0 });
});

it('getProgressSummary: cardId 단위 집계', async () => {
  const now = Date.now();
  await upsertProgress({
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'learning',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: now + 86_400_000,
    lastReviewedAt: now,
    lapses: 0,
    lastRating: 'good',
  });
  const r = await getProgressSummary('word', 'A1', 100, now);
  expect(r.learned).toBe(1);
  expect(r.completed).toBe(0);
});
```

또한 import에 `getProgressSummary` 추가.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/db/repository/progressRepo.test.ts`
Expected: FAIL — `getProgressSummary is not a function` 또는 import 에러.

- [ ] **Step 3: repo 함수 추가**

`src/db/repository/progressRepo.ts` 끝에:
```ts
import { summarizeProgress, type ProgressSummary } from './progressSummary';

/**
 * (cardType, level) 범위의 progress를 cardId 단위로 집계.
 * 학습 진도 표시(Home·Level·Mode loader)에 사용.
 */
export async function getProgressSummary(
  cardType: CardType,
  level: CEFR,
  totalContent: number,
  now: number,
): Promise<ProgressSummary> {
  const progress = await getAllProgressByLevel(cardType, level);
  return summarizeProgress({ totalContent, progress, now });
}
```

- [ ] **Step 4: `src/db/index.ts` export 추가**

```ts
// progressRepo
export {
  countDue,
  getAllProgressByCardId,
  getAllProgressByLevel,
  getDueCards,
  getNewProgress,
  getProgress,
  getProgressSummary,
  upsertProgress,
} from './repository/progressRepo';

export type { ProgressSummary } from './repository/progressSummary';
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test src/db/repository/progressRepo.test.ts`
Expected: 모두 PASS.

- [ ] **Step 6: 커밋**

```bash
git add src/db/repository/progressRepo.ts src/db/repository/progressRepo.test.ts src/db/index.ts
git commit -m "[code] Add: getProgressSummary repo 어댑터 + barrel export"
```

---

## Task 3: Home — LevelCard 실제 진도 주입

**Files:**
- Modify: `src/routes/Home.tsx`
- Modify: `src/routes/Home.test.tsx`

- [ ] **Step 1: Home 테스트 시나리오 추가**

`src/routes/Home.test.tsx`에 새 케이스 추가:
```ts
import { resetDb } from '@/db/schema';
import { upsertProgress } from '@/db';

it('A1에 progress 1개 있으면 진도 비율 반영', async () => {
  await resetDb();
  const now = Date.now();
  await upsertProgress({
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'learning',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: now - 1000,
    lastReviewedAt: now,
    lapses: 0,
    lastRating: 'good',
  });
  mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
  renderRoutes(routes, '/');
  await waitFor(() => screen.getByRole('heading', { name: /레벨을 선택하세요/ }));
  // due 배지가 보여야 함 (dueAt < now)
  expect(screen.getByLabelText(/오늘 복습 1장/)).toBeInTheDocument();
});
```

기존 `beforeEach`에 `await resetDb()` 추가.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/routes/Home.test.tsx`
Expected: FAIL — `due 1장` aria-label 못 찾음.

- [ ] **Step 3: Home.tsx loader 수정**

```tsx
import { loadManifest } from '@/content';
import { getProgressSummary } from '@/db';
import { LevelCard } from '@/shared/components';
import { CEFR_LEVELS, type CEFR } from '@/shared/types';
import styles from './Home.module.css';
import { useLoaderData, useNavigate } from 'react-router-dom';

interface LevelSummary {
  readonly level: CEFR;
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly learnedCount: number;
  readonly dueCount: number;
}

interface HomeLoaderData {
  readonly summaries: readonly LevelSummary[];
}

const LEVEL_SUBTITLE: Record<CEFR, string> = {
  A1: '기초 일상',
  A2: '기초 회화',
  B1: '독립 사용자',
  B2: '능숙한 사용자',
  C1: '유창한 사용자',
  C2: '원어민 수준',
};

export async function homeLoader(): Promise<HomeLoaderData> {
  const manifest = await loadManifest();
  const now = Date.now();
  const summaries: LevelSummary[] = await Promise.all(
    CEFR_LEVELS.map(async (level) => {
      const wordCount = manifest.counts.words[level];
      const sentenceCount = manifest.counts.sentences[level];
      const [w, s] = await Promise.all([
        getProgressSummary('word', level, wordCount, now),
        getProgressSummary('sentence', level, sentenceCount, now),
      ]);
      return {
        level,
        wordCount,
        sentenceCount,
        learnedCount: w.learned + s.learned,
        dueCount: w.due + s.due,
      };
    }),
  );
  return { summaries };
}

export function Home() {
  const { summaries } = useLoaderData() as HomeLoaderData;
  const navigate = useNavigate();

  return (
    <div>
      <h1 className={styles.heading}>레벨을 선택하세요</h1>
      <p className={styles.subheading}>CEFR 6단계 중 학습할 레벨을 골라주세요.</p>
      <div className={styles.grid}>
        {summaries.map((s) => {
          const total = s.wordCount + s.sentenceCount;
          const disabled = total === 0;
          return (
            <LevelCard
              key={s.level}
              level={s.level}
              subtitle={`${LEVEL_SUBTITLE[s.level]} · 단어 ${s.wordCount} · 문장 ${s.sentenceCount}`}
              totalCount={total}
              learnedCount={s.learnedCount}
              dueCount={s.dueCount}
              disabled={disabled}
              onClick={() => navigate(`/level/${s.level}`)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/routes/Home.test.tsx`
Expected: 모두 PASS (신규 1개 + 기존 2개).

- [ ] **Step 5: 커밋**

```bash
git add src/routes/Home.tsx src/routes/Home.test.tsx
git commit -m "[code] Modify: Home loader가 실제 progress 집계해 LevelCard에 주입"
```

---

## Task 4: Level — 단어/문장 타일에 진척 라벨

**Files:**
- Modify: `src/routes/Level.tsx`
- Modify: `src/routes/Level.module.css`
- Modify: `src/routes/Level.test.tsx`

- [ ] **Step 1: Level 테스트 시나리오 추가**

```ts
import { resetDb } from '@/db/schema';
import { upsertProgress } from '@/db';

it('A1 word에 progress 1건 → 단어 타일에 학습 카드 수 라벨', async () => {
  await resetDb();
  const now = Date.now();
  await upsertProgress({
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'learning',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: now + 86_400_000,
    lastReviewedAt: now,
    lapses: 0,
    lastRating: 'good',
  });
  mockFetchByUrlSuffix({ '/data/manifest.json': MANIFEST_A1_ONLY });
  renderRoutes(routes, '/level/A1');
  await waitFor(() => screen.getByRole('heading', { name: /A1 레벨/ }));
  expect(screen.getByText(/학습 1\s*\/\s*649/)).toBeInTheDocument();
});
```

기존 `beforeEach`에 `await resetDb()` 추가.

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/routes/Level.test.tsx`
Expected: FAIL — `학습 1 / 649` 텍스트 못 찾음.

- [ ] **Step 3: Level.tsx loader·UI 수정**

```tsx
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { loadManifest } from '@/content';
import { getProgressSummary, type ProgressSummary } from '@/db';
import { isCefr, type CEFR } from '@/shared/types';
import styles from './Level.module.css';

interface LevelLoaderData {
  readonly level: CEFR;
  readonly wordCount: number;
  readonly sentenceCount: number;
  readonly wordSummary: ProgressSummary;
  readonly sentenceSummary: ProgressSummary;
}

export async function levelLoader({ params }: LoaderFunctionArgs): Promise<LevelLoaderData> {
  const raw = params.cefr;
  if (!raw || !isCefr(raw)) {
    throw new Response('Invalid level', { status: 404 });
  }
  const manifest = await loadManifest();
  const wordCount = manifest.counts.words[raw];
  const sentenceCount = manifest.counts.sentences[raw];
  const now = Date.now();
  const [wordSummary, sentenceSummary] = await Promise.all([
    getProgressSummary('word', raw, wordCount, now),
    getProgressSummary('sentence', raw, sentenceCount, now),
  ]);
  return { level: raw, wordCount, sentenceCount, wordSummary, sentenceSummary };
}

function ProgressMeta({ s }: { readonly s: ProgressSummary }) {
  if (s.total === 0) return null;
  return (
    <div className={styles.progressMeta}>
      <span>학습 {s.learned} / {s.total}</span>
      {s.due > 0 && <span className={styles.due}>due {s.due}</span>}
      {s.completed > 0 && <span className={styles.completed}>완료 {s.completed}</span>}
    </div>
  );
}

export function Level() {
  const { level, wordCount, sentenceCount, wordSummary, sentenceSummary } =
    useLoaderData() as LevelLoaderData;
  const navigate = useNavigate();
  const params = useParams();

  return (
    <div>
      <h1 className={styles.heading}>{level} 레벨</h1>
      <p className={styles.subheading}>학습할 콘텐츠 타입을 선택하세요.</p>
      <div className={styles.tiles}>
        <button
          type="button"
          className={styles.tile}
          onClick={() => navigate(`/level/${params.cefr}/word`)}
          disabled={wordCount === 0}
        >
          <div className={styles.tileTitle}>단어 학습</div>
          {wordCount > 0 ? (
            <>
              <div className={styles.tileCount}>{wordCount}개의 단어</div>
              <ProgressMeta s={wordSummary} />
            </>
          ) : (
            <div className={styles.tileEmpty}>준비 중</div>
          )}
        </button>
        <button
          type="button"
          className={styles.tile}
          onClick={() => navigate(`/level/${params.cefr}/sentence`)}
          disabled={sentenceCount === 0}
        >
          <div className={styles.tileTitle}>문장 학습</div>
          {sentenceCount > 0 ? (
            <>
              <div className={styles.tileCount}>{sentenceCount}개의 문장</div>
              <ProgressMeta s={sentenceSummary} />
            </>
          ) : (
            <div className={styles.tileEmpty}>준비 중</div>
          )}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CSS 추가**

`src/routes/Level.module.css` 말미에:
```css
.progressMeta {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 0.8rem;
  color: var(--mui-palette-text-secondary, #6b7280);
  flex-wrap: wrap;
  justify-content: center;
}

.due {
  color: var(--mui-palette-warning-main, #f59e0b);
  font-weight: 600;
}

.completed {
  color: var(--mui-palette-success-main, #16a34a);
  font-weight: 600;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test src/routes/Level.test.tsx`
Expected: 모두 PASS.

- [ ] **Step 6: 커밋**

```bash
git add src/routes/Level.tsx src/routes/Level.module.css src/routes/Level.test.tsx
git commit -m "[code] Modify: Level 타일에 학습/완료/due 카운트 라벨 추가"
```

---

## Task 5: Mode — studyMode별 학습 카드 수 표시

**Files:**
- Modify: `src/routes/Mode.tsx`
- Modify: `src/routes/Mode.module.css`
- Modify: `src/routes/Mode.test.tsx`

- [ ] **Step 1: Mode 테스트 시나리오 추가**

```ts
import { resetDb } from '@/db/schema';
import { upsertProgress } from '@/db';

it('A1 word flashcard에 진도 1건 → 플래시카드 타일에 학습 카드 수', async () => {
  await resetDb();
  const now = Date.now();
  await upsertProgress({
    cardId: 'w_a1_001',
    studyMode: 'flashcard',
    cardType: 'word',
    level: 'A1',
    state: 'learning',
    repetitions: 1,
    easeFactor: 2.5,
    intervalDays: 1,
    dueAt: now + 86_400_000,
    lastReviewedAt: now,
    lapses: 0,
    lastRating: 'good',
  });
  mockFetchByUrlSuffix({});
  renderRoutes(routes, '/level/A1/word');
  await waitFor(() => screen.getByRole('heading', { name: /A1 · 단어/ }));
  const flashcardTile = screen.getByRole('button', { name: /플래시카드/ });
  expect(flashcardTile).toHaveTextContent(/학습 1/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test src/routes/Mode.test.tsx`
Expected: FAIL — `학습 1` 텍스트 없음.

- [ ] **Step 3: Mode.tsx 수정**

```tsx
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { getAllProgressByLevel } from '@/db';
import {
  type CardType,
  type CEFR,
  isCardType,
  isCefr,
  STUDY_MODES_BY_CARD_TYPE,
  type StudyMode,
} from '@/shared/types';
import styles from './Mode.module.css';

type ModeKey = StudyMode | 'vocabulary';

interface ModeLoaderData {
  readonly level: CEFR;
  readonly cardType: CardType;
  readonly learnedByMode: Readonly<Record<StudyMode, number>>;
  readonly learnedTotalCards: number;
}

export async function modeLoader({ params }: LoaderFunctionArgs): Promise<ModeLoaderData> {
  const cefr = params.cefr;
  const cardType = params.cardType;
  if (!cefr || !isCefr(cefr)) {
    throw new Response('Invalid level', { status: 404 });
  }
  if (!cardType || !isCardType(cardType)) {
    throw new Response('Invalid card type', { status: 404 });
  }
  const progress = await getAllProgressByLevel(cardType, cefr);
  const learnedByMode: Record<StudyMode, number> = { flashcard: 0, recall: 0, cloze: 0 };
  const byMode = new Map<StudyMode, Set<string>>();
  const allCards = new Set<string>();
  for (const p of progress) {
    allCards.add(p.cardId);
    const set = byMode.get(p.studyMode) ?? new Set<string>();
    set.add(p.cardId);
    byMode.set(p.studyMode, set);
  }
  for (const m of ['flashcard', 'recall', 'cloze'] as const) {
    learnedByMode[m] = byMode.get(m)?.size ?? 0;
  }
  return { level: cefr, cardType, learnedByMode, learnedTotalCards: allCards.size };
}

const MODE_LABEL: Record<ModeKey, { title: string; desc: string }> = {
  flashcard: { title: '플래시카드', desc: '영어 → 한국어 뒤집기. 자가체크' },
  recall: { title: '리콜 (한→영)', desc: '한국어 보고 영어 입력. 자동 채점' },
  cloze: { title: '클로즈 (빈칸)', desc: '문장 빈칸 채우기 (문장 전용)' },
  vocabulary: { title: '단어장', desc: '전체 리스트 + 마킹 (학습 X)' },
};

export function Mode() {
  const { level, cardType, learnedByMode, learnedTotalCards } =
    useLoaderData() as ModeLoaderData;
  const navigate = useNavigate();
  const params = useParams();
  const availableStudyModes = STUDY_MODES_BY_CARD_TYPE[cardType];

  function handleClick(mode: ModeKey): void {
    if (mode === 'vocabulary') {
      navigate(`/vocabulary/${params.cefr}/${params.cardType}`);
    } else {
      navigate(`/learn/${params.cefr}/${params.cardType}/${mode}`);
    }
  }

  return (
    <div>
      <h1 className={styles.heading}>
        {level} · {cardType === 'word' ? '단어' : '문장'}
      </h1>
      <p className={styles.subheading}>학습 모드를 선택하세요.</p>
      <div className={styles.tiles}>
        {(['flashcard', 'recall', 'cloze', 'vocabulary'] as const).map((mode) => {
          const meta = MODE_LABEL[mode];
          const isStudy = mode !== 'vocabulary';
          const disabled = isStudy && !availableStudyModes.includes(mode);
          if (!meta) return null;
          const learnedCount =
            mode === 'vocabulary' ? learnedTotalCards : learnedByMode[mode];
          return (
            <button
              key={mode}
              type="button"
              className={styles.tile}
              onClick={() => handleClick(mode)}
              disabled={disabled}
            >
              <div className={styles.tileTitle}>{meta.title}</div>
              <div className={styles.tileDesc}>{meta.desc}</div>
              {!disabled && learnedCount > 0 && (
                <div className={styles.tileMeta}>학습 {learnedCount}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: CSS 추가**

`src/routes/Mode.module.css` 말미에:
```css
.tileMeta {
  margin-top: 6px;
  font-size: 0.8rem;
  color: var(--mui-palette-text-secondary, #6b7280);
  font-weight: 600;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test src/routes/Mode.test.tsx`
Expected: 모두 PASS.

- [ ] **Step 6: 커밋**

```bash
git add src/routes/Mode.tsx src/routes/Mode.module.css src/routes/Mode.test.tsx
git commit -m "[code] Modify: Mode 타일에 studyMode별 학습 카드 수 라벨 추가"
```

---

## Task 6: 전체 검증 + Lint·Typecheck·VR

**Files:** 없음 (검증 단계)

- [ ] **Step 1: 전체 테스트 통과 확인**

Run: `pnpm test`
Expected: 모든 테스트 PASS. failure 시 → 해당 task 재방문.

- [ ] **Step 2: 타입체크**

Run: `pnpm typecheck`
Expected: error 0.

- [ ] **Step 3: Lint**

Run: `pnpm check`
Expected: warning/error 0.

- [ ] **Step 4: 빌드**

Run: `pnpm build`
Expected: 빌드 성공 (vite + tsc).

- [ ] **Step 5: 사용자 보고 + push 승인**

작업 보고:
- 변경 파일 리스트
- DB 영속화는 이미 정상 작동. 화면 표시만 보강.
- 다음 단계: VR 베이스라인 갱신 필요 (Home/Level/Mode 시각 변경).

승인 후:
```bash
git push -u origin feature/progress-visibility
```

- [ ] **Step 6: PR 생성 (사용자가 직접)**

사용자에게 PR 제목·바디 draft 제공. 사용자가 `gh pr create` 직접 실행.

- [ ] **Step 7: VR 베이스라인 갱신 (사용자가 직접)**

PR push 후 VR workflow가 fail → `accept-baseline` 라벨 부여 → CI가 베이스라인 갱신.
