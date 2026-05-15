/**
 * vitest 환경에서 virtual:pwa-register 모듈을 대체하는 mock.
 *
 * vite-plugin-pwa가 prod 빌드 시 virtual:pwa-register 모듈을 자동 주입하지만,
 * vitest는 virtual: 접두사 모듈을 resolve하지 못함. vitest.config.ts의 resolve.alias로
 * 이 파일을 매핑하여 import를 성공시킨다.
 */

interface RegisterSWOptions {
  immediate?: boolean;
  onRegisteredSW?: (swUrl: string) => void;
  onRegisterError?: (error: unknown) => void;
}

export function registerSW(_options?: RegisterSWOptions): () => Promise<void> {
  // 테스트 환경에서는 SW 등록 부작용 없이 호출 사실만 보존.
  return () => Promise.resolve();
}
