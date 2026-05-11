/**
 * 정적 콘텐츠 fetch + 메모리 캐싱.
 *
 * - `public/data/words/{cefr}.json` / `public/data/sentences/{cefr}.json`
 * - 한 번 로드된 데이터는 in-memory 캐싱 (앱 lifetime 동안 재사용)
 * - 테스트에서는 `resetCache()`로 초기화
 *
 * 본 모듈은 React 의존 0. fetch만 사용 (axios·tanstack-query 미사용).
 */
import type { CEFR } from '@/shared/types';
import type { ContentManifest, SentenceEntry, WordEntry } from './types';

const wordCache = new Map<CEFR, readonly WordEntry[]>();
const sentenceCache = new Map<CEFR, readonly SentenceEntry[]>();
let manifestCache: ContentManifest | null = null;

export interface LoaderOptions {
  /** fetch base path. 기본 '' (root). 테스트에서 mock URL 주입 가능. */
  readonly basePath?: string;
}

function buildUrl(basePath: string, path: string): string {
  const trimmedBase = basePath.replace(/\/$/, '');
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Content fetch failed: ${url} (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function loadWords(
  level: CEFR,
  options: LoaderOptions = {},
): Promise<readonly WordEntry[]> {
  const cached = wordCache.get(level);
  if (cached) return cached;

  const url = buildUrl(options.basePath ?? '', `/data/words/${level.toLowerCase()}.json`);
  const data = await fetchJson<WordEntry[]>(url);
  wordCache.set(level, data);
  return data;
}

export async function loadSentences(
  level: CEFR,
  options: LoaderOptions = {},
): Promise<readonly SentenceEntry[]> {
  const cached = sentenceCache.get(level);
  if (cached) return cached;

  const url = buildUrl(options.basePath ?? '', `/data/sentences/${level.toLowerCase()}.json`);
  const data = await fetchJson<SentenceEntry[]>(url);
  sentenceCache.set(level, data);
  return data;
}

export async function loadManifest(options: LoaderOptions = {}): Promise<ContentManifest> {
  if (manifestCache) return manifestCache;

  const url = buildUrl(options.basePath ?? '', '/data/manifest.json');
  const data = await fetchJson<ContentManifest>(url);
  manifestCache = data;
  return data;
}

/**
 * 캐시 초기화 — 테스트·콘텐츠 갱신 알림 시 호출.
 */
export function resetContentCache(): void {
  wordCache.clear();
  sentenceCache.clear();
  manifestCache = null;
}
