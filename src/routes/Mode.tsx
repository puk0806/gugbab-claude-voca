/**
 * `/level/:cefr/:cardType` — 학습 모드 선택 (플래시카드 / 리콜 / 클로즈 / 단어장).
 *
 * cardType=word인 경우 클로즈 모드 비활성.
 * 단어장 선택 시 `/vocabulary/:cefr/:cardType`로 이동.
 * 그 외 학습 모드 선택 시 `/learn/:cefr/:cardType/:studyMode`로 이동.
 *
 * 각 타일에 studyMode별 학습 카드 수(cardId 단위 dedup) 라벨 표시.
 */
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
  const byMode = new Map<StudyMode, Set<string>>();
  const allCards = new Set<string>();
  for (const p of progress) {
    allCards.add(p.cardId);
    const set = byMode.get(p.studyMode) ?? new Set<string>();
    set.add(p.cardId);
    byMode.set(p.studyMode, set);
  }
  const learnedByMode: Record<StudyMode, number> = {
    flashcard: byMode.get('flashcard')?.size ?? 0,
    recall: byMode.get('recall')?.size ?? 0,
    cloze: byMode.get('cloze')?.size ?? 0,
  };
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
