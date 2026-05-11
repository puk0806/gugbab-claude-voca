/**
 * `src/content/` public API.
 *
 * 정적 콘텐츠 도메인 — 타입·로더·클로즈 파싱.
 */

// Cloze 마커 헬퍼 (M2)
export type { ClozeParseResult } from './cloze';
export { fillCloze, maskCloze, parseCloze } from './cloze';

// Loader
export type { LoaderOptions } from './loader';
export { loadManifest, loadSentences, loadWords, resetContentCache } from './loader';
// Types
export type { ContentManifest, PartOfSpeech, SentenceEntry, WordEntry, WordExample } from './types';
export { PARTS_OF_SPEECH } from './types';
