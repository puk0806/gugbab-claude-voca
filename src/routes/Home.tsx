/**
 * 홈 화면 (`/`) — 대화 / 단어 / 문장 3택.
 *
 * - 대화 연습 → `/conversation` (바로 채팅, 난이도 선택 없음)
 * - 단어/문장 학습 → `/cards/:cardType` (난이도 선택 → 모드 선택)
 *
 * loader는 manifest 카운트 + cardType별 전 레벨 진도 합계를 집계
 * (cardType당 단일 벌크 조회 — getProgressSummariesByType).
 */
import { useLoaderData, useNavigate } from 'react-router-dom';
import { loadManifest } from '@/content';
import { getProgressSummariesByType } from '@/db';
import { type CardType, type CEFR, CEFR_LEVELS } from '@/shared/types';
import styles from './Home.module.css';

interface TypeSummary {
  readonly totalCount: number;
  readonly learnedCount: number;
  readonly dueCount: number;
}

interface HomeLoaderData {
  readonly word: TypeSummary;
  readonly sentence: TypeSummary;
}

async function summarizeType(
  cardType: CardType,
  counts: Readonly<Record<CEFR, number>>,
  now: number,
): Promise<TypeSummary> {
  const byLevel = await getProgressSummariesByType(cardType, counts, now);
  return CEFR_LEVELS.reduce<TypeSummary>(
    (acc, level) => ({
      totalCount: acc.totalCount + counts[level],
      learnedCount: acc.learnedCount + byLevel[level].learned,
      dueCount: acc.dueCount + byLevel[level].due,
    }),
    { totalCount: 0, learnedCount: 0, dueCount: 0 },
  );
}

export async function homeLoader(): Promise<HomeLoaderData> {
  const manifest = await loadManifest();
  const now = Date.now();
  const [word, sentence] = await Promise.all([
    summarizeType('word', manifest.counts.words, now),
    summarizeType('sentence', manifest.counts.sentences, now),
  ]);
  return { word, sentence };
}

interface TypeMetaProps {
  readonly s: TypeSummary;
}

function TypeMeta({ s }: TypeMetaProps) {
  return (
    <div className={styles.tileMeta}>
      <span>
        학습 {s.learnedCount} / {s.totalCount}개
      </span>
      {s.dueCount > 0 && <span className={styles.due}>due {s.dueCount}</span>}
    </div>
  );
}

const CARD_TILES: ReadonlyArray<{
  readonly cardType: CardType;
  readonly title: string;
  readonly desc: string;
}> = [
  { cardType: 'word', title: '단어 학습', desc: '플래시카드 · 리콜 — CEFR 6단계' },
  { cardType: 'sentence', title: '문장 학습', desc: '플래시카드 · 클로즈 — CEFR 6단계' },
];

export function Home() {
  const data = useLoaderData() as HomeLoaderData;
  const navigate = useNavigate();

  return (
    <div>
      <h1 className={styles.heading}>무엇을 연습할까요?</h1>
      <p className={styles.subheading}>대화·단어·문장 중 하나를 선택하세요.</p>
      <div className={styles.tiles}>
        <button
          type="button"
          className={`${styles.tile} ${styles.tileConversation}`}
          onClick={() => navigate('/conversation')}
        >
          <div className={styles.tileTitle}>대화 연습</div>
          <div className={styles.tileDesc}>AI와 영어로 자유롭게 대화하며 연습</div>
        </button>
        {CARD_TILES.map((tile) => (
          <button
            key={tile.cardType}
            type="button"
            className={styles.tile}
            onClick={() => navigate(`/cards/${tile.cardType}`)}
          >
            <div className={styles.tileTitle}>{tile.title}</div>
            <div className={styles.tileDesc}>{tile.desc}</div>
            <TypeMeta s={data[tile.cardType]} />
          </button>
        ))}
      </div>
    </div>
  );
}
