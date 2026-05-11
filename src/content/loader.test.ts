import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadManifest, loadSentences, loadWords, resetContentCache } from './loader';

const SAMPLE_WORDS = [
  {
    id: 'w_a1_001',
    level: 'A1',
    english: 'apple',
    korean: '사과',
    partOfSpeech: 'noun',
  },
];

const SAMPLE_SENTENCES = [
  {
    id: 's_a1_001',
    level: 'A1',
    english: 'I {go} to school.',
    korean: '나는 학교에 간다.',
    cloze: ['go'],
  },
];

const SAMPLE_MANIFEST = {
  buildAt: '2026-05-10T00:00:00Z',
  schemaVersion: 1 as const,
  counts: {
    words: { A1: 80, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
    sentences: { A1: 40, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
  },
};

function mockFetchOk<T>(data: T): typeof fetch {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => data,
  })) as unknown as typeof fetch;
}

describe('content/loader', () => {
  beforeEach(() => {
    resetContentCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetContentCache();
  });

  describe('loadWords', () => {
    it('레벨별 JSON fetch + 데이터 반환', async () => {
      vi.stubGlobal('fetch', mockFetchOk(SAMPLE_WORDS));
      const words = await loadWords('A1');
      expect(words).toHaveLength(1);
      expect(words[0]?.english).toBe('apple');
    });

    it('caching: 두 번째 호출은 fetch 호출 X', async () => {
      const fetchSpy = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_WORDS,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      await loadWords('A1');
      await loadWords('A1');
      expect(fetchSpy).toHaveBeenCalledOnce();
    });

    it('레벨이 다르면 별도 fetch', async () => {
      const fetchSpy = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_WORDS,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      await loadWords('A1');
      await loadWords('A2');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('소문자 url path 사용', async () => {
      const fetchSpy = vi.fn(async (_url: string) => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_WORDS,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      await loadWords('A1');
      const calledUrl = fetchSpy.mock.calls[0]?.[0];
      expect(calledUrl).toContain('/data/words/a1.json');
    });

    it('fetch 실패 시 에러 throw', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: false,
          status: 404,
          json: async () => ({}),
        })) as unknown as typeof fetch,
      );
      await expect(loadWords('A1')).rejects.toThrow(/404/);
    });
  });

  describe('loadSentences', () => {
    it('데이터 반환 + 캐싱', async () => {
      const fetchSpy = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_SENTENCES,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      const sentences = await loadSentences('A1');
      expect(sentences[0]?.english).toBe('I {go} to school.');
      await loadSentences('A1');
      expect(fetchSpy).toHaveBeenCalledOnce();
    });
  });

  describe('loadManifest', () => {
    it('manifest 데이터 반환 + 캐싱', async () => {
      const fetchSpy = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_MANIFEST,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      const manifest = await loadManifest();
      expect(manifest.schemaVersion).toBe(1);
      expect(manifest.counts.words.A1).toBe(80);
      await loadManifest();
      expect(fetchSpy).toHaveBeenCalledOnce();
    });
  });

  describe('resetContentCache', () => {
    it('캐시 초기화 후 다시 fetch', async () => {
      const fetchSpy = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_WORDS,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      await loadWords('A1');
      resetContentCache();
      await loadWords('A1');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('basePath 옵션', () => {
    it('basePath 지정 시 prefix 추가', async () => {
      const fetchSpy = vi.fn(async (_url: string) => ({
        ok: true,
        status: 200,
        json: async () => SAMPLE_WORDS,
      }));
      vi.stubGlobal('fetch', fetchSpy as unknown as typeof fetch);

      await loadWords('A1', { basePath: 'https://cdn.example.com' });
      const calledUrl = fetchSpy.mock.calls[0]?.[0];
      expect(calledUrl).toBe('https://cdn.example.com/data/words/a1.json');
    });
  });
});
