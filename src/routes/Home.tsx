/**
 * 홈 화면 (`/`) — CEFR 6단계 레벨 카드.
 *
 * loader는 manifest.json + 각 레벨/cardType의 progress 집계.
 * 콘텐츠 0인 레벨은 disabled (콘텐츠 준비 중).
 */
import { useLoaderData, useNavigate } from 'react-router-dom';
import { loadManifest } from '@/content';
import { getProgressSummary } from '@/db';
import { LevelCard } from '@/shared/components';
import { CEFR_LEVELS, type CEFR } from '@/shared/types';
import styles from './Home.module.css';

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
