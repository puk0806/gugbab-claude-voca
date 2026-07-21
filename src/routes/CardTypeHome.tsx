/**
 * `/cards/:cardType` — 단어/문장별 난이도(CEFR) 선택.
 *
 * 홈에서 콘텐츠 타입을 고른 뒤 진입. 해당 타입의 레벨별 카운트·진도만 표시하고,
 * 레벨 선택 시 `/cards/:cardType/:cefr` (Mode 화면)로 이동.
 * 콘텐츠 0인 레벨은 disabled.
 */
import { type LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import { loadManifest } from '@/content';
import { getProgressSummariesByType } from '@/db';
import { LevelCard } from '@/shared/components';
import { type CardType, type CEFR, CEFR_LEVELS, isCardType } from '@/shared/types';
import styles from './CardTypeHome.module.css';

interface LevelSummary {
  readonly level: CEFR;
  readonly count: number;
  readonly learnedCount: number;
  readonly dueCount: number;
}

interface CardTypeHomeLoaderData {
  readonly cardType: CardType;
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

export async function cardTypeHomeLoader({
  params,
}: LoaderFunctionArgs): Promise<CardTypeHomeLoaderData> {
  const cardType = params.cardType;
  if (!cardType || !isCardType(cardType)) {
    throw new Response('Invalid card type', { status: 404 });
  }
  const manifest = await loadManifest();
  const now = Date.now();
  const counts = cardType === 'word' ? manifest.counts.words : manifest.counts.sentences;
  const byLevel = await getProgressSummariesByType(cardType, counts, now);
  const summaries: LevelSummary[] = CEFR_LEVELS.map((level) => ({
    level,
    count: counts[level],
    learnedCount: byLevel[level].learned,
    dueCount: byLevel[level].due,
  }));
  return { cardType, summaries };
}

export function CardTypeHome() {
  const { cardType, summaries } = useLoaderData() as CardTypeHomeLoaderData;
  const navigate = useNavigate();
  const typeLabel = cardType === 'word' ? '단어' : '문장';

  return (
    <div>
      <h1 className={styles.heading}>{typeLabel} 학습</h1>
      <p className={styles.subheading}>난이도를 선택하세요. (CEFR 6단계)</p>
      <div className={styles.grid}>
        {summaries.map((s) => (
          <LevelCard
            key={s.level}
            level={s.level}
            subtitle={`${LEVEL_SUBTITLE[s.level]} · ${typeLabel} ${s.count}개`}
            totalCount={s.count}
            learnedCount={s.learnedCount}
            dueCount={s.dueCount}
            disabled={s.count === 0}
            onClick={() => navigate(`/cards/${cardType}/${s.level}`)}
          />
        ))}
      </div>
    </div>
  );
}
