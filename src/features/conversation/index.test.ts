import { describe, expect, it } from 'vitest';
import * as PublicApi from './index';

describe('features/conversation public API (barrel)', () => {
  it('public API 심볼 명시 검증', () => {
    expect(Object.keys(PublicApi).sort()).toEqual([
      'DEFAULT_REPLY_AID_MODE',
      'MAX_HISTORY',
      'REPLY_AID_MODES',
      'REPLY_AID_MODE_LABELS',
      'buildChatRequestBody',
      'buildEnglishTutorSystemPrompt',
      'loadReplyAidMode',
      'saveReplyAidMode',
      'useConversation',
    ]);
  });
});
