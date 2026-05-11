/**
 * navigator.storage 영속화 권한 요청.
 *
 * PWA 설치 후 첫 학습 완료 시점에 호출 (UI에서 결정).
 * 본 함수는 *순수 wrapper* — 미지원 브라우저면 false 반환.
 *
 * @returns persist 권한 부여 여부
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * 현재 영속 권한 보유 여부 조회.
 */
export async function isPersistent(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persisted) {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch {
    return false;
  }
}

/**
 * 저장 사용량 조회 (PWA 설정·디버그 화면용).
 */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }
  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}
