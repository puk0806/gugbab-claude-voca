/**
 * `/vocabulary/:cefr/:cardType` — 단어장 (Mode D, 학습 X).
 *
 * - 전체 콘텐츠 리스트 + 검색
 * - 카드별 마킹 토글 (known / unknown / null)
 * - 학습 X·조회 only
 */
import { useCallback, useMemo, useState } from 'react';
import { type LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { fillCloze, loadSentences, loadWords } from '@/content';
import type { SentenceEntry, WordEntry } from '@/content';
import { clearMark, listMarksByLevel, setMark } from '@/db';
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
}

export async function vocabularyLoader({
  params,
}: LoaderFunctionArgs): Promise<VocabularyLoaderData> {
  const cefr = params.cefr;
  const cardType = params.cardType;
  if (!cefr || !isCefr(cefr)) throw new Response('Invalid level', { status: 404 });
  if (!cardType || !isCardType(cardType)) throw new Response('Invalid card type', { status: 404 });

  const cards = cardType === 'word' ? await loadWords(cefr) : await loadSentences(cefr);
  const marks = await listMarksByLevel(cardType, cefr);
  const initialMarks: Record<string, 'known' | 'unknown'> = {};
  for (const [id, mark] of marks.entries()) initialMarks[id] = mark;

  return { level: cefr, cardType, cards, initialMarks };
}

function getDisplayEnglish(card: WordEntry | SentenceEntry, cardType: CardType): string {
  return cardType === 'sentence' ? fillCloze((card as SentenceEntry).english) : card.english;
}

export function Vocabulary() {
  const { level, cardType, cards, initialMarks } = useLoaderData() as VocabularyLoaderData;
  const [marks, setMarks] = useState<Record<string, 'known' | 'unknown'>>(initialMarks);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => {
      const english = getDisplayEnglish(c, cardType).toLowerCase();
      const korean = c.korean.toLowerCase();
      return english.includes(q) || korean.includes(q);
    });
  }, [cards, query, cardType]);

  const handleToggle = useCallback(
    async (cardId: string, next: 'known' | 'unknown') => {
      const current = marks[cardId];
      const now = Date.now();
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
        await setMark(cardId, cardType, level, newMark, now);
      }
    },
    [marks, cardType, level],
  );

  return (
    <div className={styles.root}>
      <h1 className={styles.heading}>
        {level} 단어장 ({cardType === 'word' ? '단어' : '문장'})
      </h1>
      <p className={styles.subheading}>총 {cards.length}개 · 표시 {filtered.length}개</p>

      <input
        type="search"
        className={styles.search}
        placeholder="영어 또는 한국어로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="단어장 검색"
      />

      <ul className={styles.list}>
        {filtered.map((card) => {
          const mark = marks[card.id];
          const display = getDisplayEnglish(card, cardType);
          return (
            <li key={card.id} className={styles.item}>
              <div className={styles.itemMain}>
                <span className={styles.itemEnglish}>{display}</span>
                <span className={styles.itemKorean}>{card.korean}</span>
              </div>
              <div className={styles.markToggle}>
                <button
                  type="button"
                  className={`${styles.markBtn} ${styles.unknown} ${
                    mark === 'unknown' ? styles.active : ''
                  }`}
                  onClick={() => handleToggle(card.id, 'unknown')}
                  aria-pressed={mark === 'unknown'}
                  aria-label={`${display} 모름 표시`}
                  data-testid={`mark-unknown-${card.id}`}
                >
                  모름
                </button>
                <button
                  type="button"
                  className={`${styles.markBtn} ${styles.known} ${
                    mark === 'known' ? styles.active : ''
                  }`}
                  onClick={() => handleToggle(card.id, 'known')}
                  aria-pressed={mark === 'known'}
                  aria-label={`${display} 안다 표시`}
                  data-testid={`mark-known-${card.id}`}
                >
                  안다
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
