/**
 * appSettings key-value repository.
 *
 * 미저장 key 조회 시 SETTING_DEFAULTS의 default 반환.
 * 외부 코드는 SETTING_KEYS enum 통해 key 사용 (typo 방지).
 */
import { db } from '../schema';
import { SETTING_DEFAULTS, type SettingKey } from '../types';

/**
 * 단일 설정 조회. 미저장 시 default.
 */
export async function getSetting<V>(key: SettingKey): Promise<V> {
  const row = await db.appSettings.get(key);
  if (row === undefined) {
    return SETTING_DEFAULTS[key] as V;
  }
  return row.value as V;
}

/**
 * 단일 설정 저장 (insert or update).
 */
export async function setSetting<V>(key: SettingKey, value: V): Promise<void> {
  await db.appSettings.put({ key, value });
}

/**
 * 모든 설정을 Record로 반환. 미저장 key는 default 채움.
 */
export async function getAllSettings(): Promise<Record<SettingKey, unknown>> {
  const rows = await db.appSettings.toArray();
  const stored = new Map<string, unknown>();
  for (const row of rows) {
    stored.set(row.key, row.value);
  }

  const result = { ...SETTING_DEFAULTS };
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    if (stored.has(key)) {
      result[key] = stored.get(key);
    }
  }
  return result;
}

/**
 * 설정 단일 삭제 (default로 되돌림).
 */
export async function clearSetting(key: SettingKey): Promise<void> {
  await db.appSettings.delete(key);
}
