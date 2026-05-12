/**
 * `/level/:cefr/:cardType` — 학습 모드 선택 (플래시카드 / 리콜 / 클로즈 / 단어장).
 *
 * cardType=word인 경우 클로즈 모드 비활성.
 * 단어장 선택 시 `/vocabulary/:cefr/:cardType`로 이동.
 * 그 외 학습 모드 선택 시 `/learn/:cefr/:cardType/:studyMode`로 이동.
 */
import { type LoaderFunctionArgs, useLoaderData, useNavigate, useParams } from 'react-router-dom';
import {
  type CardType,
  type CEFR,
  isCardType,
  isCefr,
  STUDY_MODES_BY_CARD_TYPE,
} from '@/shared/types';
import styles from './Mode.module.css';

interface ModeLoaderData {
  readonly level: CEFR;
  readonly cardType: CardType;
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
  return { level: cefr, cardType };
}

const MODE_LABEL: Record<string, { title: string; desc: string }> = {
  flashcard: { title: '플래시카드', desc: '영어 → 한국어 뒤집기. 자가체크' },
  recall: { title: '리콜 (한→영)', desc: '한국어 보고 영어 입력. 자동 채점' },
  cloze: { title: '클로즈 (빈칸)', desc: '문장 빈칸 채우기 (문장 전용)' },
  vocabulary: { title: '단어장', desc: '전체 리스트 + 마킹 (학습 X)' },
};

export function Mode() {
  const { level, cardType } = useLoaderData() as ModeLoaderData;
  const navigate = useNavigate();
  const params = useParams();
  const availableStudyModes = STUDY_MODES_BY_CARD_TYPE[cardType];

  function handleClick(mode: 'flashcard' | 'recall' | 'cloze' | 'vocabulary'): void {
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
