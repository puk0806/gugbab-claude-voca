/**
 * `src/db/` public API.
 *
 * Dexie IndexedDB 추상화. 외부 모듈은 본 barrel만 사용.
 */

// Persistence
export { getStorageEstimate, isPersistent, requestPersistentStorage } from './persistence';
// markRepo
export {
  clearMark,
  countMarksByLevel,
  getMark,
  listMarksByLevel,
  setMark,
} from './repository/markRepo';
// progressRepo
export {
  countDue,
  getAllProgressByCardId,
  getAllProgressByLevel,
  getDueCards,
  getNewProgress,
  getProgress,
  getProgressSummary,
  upsertProgress,
} from './repository/progressRepo';
export type { ProgressSummary } from './repository/progressSummary';
// sessionLogRepo
export type { CreateSessionInput, EndSessionInput } from './repository/sessionLogRepo';
export {
  createSession,
  endSession,
  getSession,
  listRecent,
} from './repository/sessionLogRepo';

// settingsRepo
export {
  clearSetting,
  getAllSettings,
  getSetting,
  setSetting,
} from './repository/settingsRepo';
// Schema (테스트만 직접 사용 권장)
export { db, GugbabVocaDB } from './schema';
// Row 타입 + 설정 카탈로그
export type { AppSettingRow, CardMarkRow, SessionLogRow, SettingKey } from './types';
export { SETTING_DEFAULTS, SETTING_KEYS } from './types';
