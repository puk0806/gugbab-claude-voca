/**
 * `/level/:cefr` — 콘텐츠 타입 선택 (단어/문장).
 *
 * cardType 결정 후 `/level/:cefr/:cardType` (Mode 화면)로 이동.
 */
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { loadManifest } from '@/content';
import { isCefr, type CEFR } from '@/shared/types';
import styles from './Level.module.css';

interface LevelLoaderData {
  readonly level: CEFR;
  readonly wordCount: number;
  readonly sentenceCount: number;
}

export async function levelLoader({ params }: LoaderFunctionArgs): Promise<LevelLoaderData> {
  const raw = params.cefr;
  if (!raw || !isCefr(raw)) {
    throw new Response('Invalid level', { status: 404 });
  }
  const manifest = await loadManifest();
  return {
    level: raw,
    wordCount: manifest.counts.words[raw],
    sentenceCount: manifest.counts.sentences[raw],
  };
}

export function Level() {
  const { level, wordCount, sentenceCount } = useLoaderData() as LevelLoaderData;
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
            <div className={styles.tileCount}>{wordCount}개의 단어</div>
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
            <div className={styles.tileCount}>{sentenceCount}개의 문장</div>
          ) : (
            <div className={styles.tileEmpty}>준비 중</div>
          )}
        </button>
      </div>
    </div>
  );
}
