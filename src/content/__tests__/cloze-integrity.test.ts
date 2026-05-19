import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SentenceEntry, WordEntry } from '@/content/types';
import { isClozeWordValid } from './cloze-integrity-utils';

const ROOT = join(__dirname, '../../..');
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const;

function loadWords(level: string): WordEntry[] {
  try {
    const raw = readFileSync(join(ROOT, 'public/data/words', `${level}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadSentences(level: string): SentenceEntry[] {
  try {
    const raw = readFileSync(join(ROOT, 'public/data/sentences', `${level}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

describe('cloze 정합성 (누적 lemma 풀)', () => {
  for (let i = 0; i < LEVELS.length; i++) {
    const currentLevel = LEVELS[i];
    const cumulativeLevels = LEVELS.slice(0, i + 1);

    describe(`${currentLevel?.toUpperCase()}`, () => {
      const lemmaPool = new Set<string>();
      for (const lvl of cumulativeLevels) {
        if (!lvl) continue;
        for (const w of loadWords(lvl)) {
          lemmaPool.add(w.english.toLowerCase());
        }
      }
      const sentences = currentLevel ? loadSentences(currentLevel) : [];

      if (sentences.length === 0) {
        it.skip(`${currentLevel?.toUpperCase()} 문장 없음 (큐레이션 전)`, () => {});
        return;
      }

      it(`모든 cloze 정답이 누적 lemma 풀에 존재 (${sentences.length}문장)`, () => {
        const failures: { id: string; cloze: string }[] = [];
        for (const s of sentences) {
          if (!s.cloze) continue;
          for (const clozeWord of s.cloze) {
            if (!isClozeWordValid(clozeWord, lemmaPool)) {
              failures.push({ id: s.id, cloze: clozeWord });
            }
          }
        }
        if (failures.length > 0) {
          const uniqueWords = [...new Set(failures.map((f) => f.cloze.toLowerCase()))].sort();
          const sample = failures.slice(0, 10);
          console.error(
            `${currentLevel} cloze 위반 ${failures.length}건. unique ${uniqueWords.length}개: ${JSON.stringify(uniqueWords)} / 샘플 위치: ${JSON.stringify(sample)}`,
          );
        }
        expect(failures).toEqual([]);
      });
    });
  }
});
