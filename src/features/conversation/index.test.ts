import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('features/conversation public API (barrel)', () => {
  it('public API 심볼 명시 검증', () => {
    expect(Object.keys(PublicApi).sort()).toEqual([
      'ENGLISH_TUTOR_SYSTEM_PROMPT',
      'MAX_HISTORY',
      'buildChatRequestBody',
      'createRecognizer',
      'isRecognitionSupported',
      'useConversation',
    ]);
  });
});
