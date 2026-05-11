import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('content public API (barrel)', () => {
  it('타입·상수 노출', () => {
    expect(PublicApi.PARTS_OF_SPEECH).toBeDefined();
    expect(PublicApi.PARTS_OF_SPEECH).toContain('noun');
    expect(PublicApi.PARTS_OF_SPEECH).toContain('verb');
  });

  it('loader 함수 노출', () => {
    expect(typeof PublicApi.loadWords).toBe('function');
    expect(typeof PublicApi.loadSentences).toBe('function');
    expect(typeof PublicApi.loadManifest).toBe('function');
    expect(typeof PublicApi.resetContentCache).toBe('function');
  });

  it('cloze 헬퍼 노출 (M2)', () => {
    expect(typeof PublicApi.parseCloze).toBe('function');
    expect(typeof PublicApi.fillCloze).toBe('function');
    expect(typeof PublicApi.maskCloze).toBe('function');
  });

  it('public API 심볼 명시 검증', () => {
    expect(Object.keys(PublicApi).sort()).toEqual([
      'PARTS_OF_SPEECH',
      'fillCloze',
      'loadManifest',
      'loadSentences',
      'loadWords',
      'maskCloze',
      'parseCloze',
      'resetContentCache',
    ]);
  });
});
