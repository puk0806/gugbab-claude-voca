import { describe, expect, it } from 'vitest';
import { buildChatRequestBody, ENGLISH_TUTOR_SYSTEM_PROMPT, MAX_HISTORY } from './chatRequest';

function makeMessages(n: number): { role: 'user' | 'assistant'; content: string }[] {
  // user/assistant 교대, 짝수 인덱스 = user. n 이 홀수면 마지막이 user.
  return Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
    content: `m${i}`,
  }));
}

describe('buildChatRequestBody', () => {
  it('app=english + systemPrompt + messages 로 relay 요청 본문을 만든다', () => {
    const body = buildChatRequestBody([{ role: 'user', content: 'Hello!' }]);
    expect(body.app).toBe('english');
    expect(body.systemPrompt).toBe(ENGLISH_TUTOR_SYSTEM_PROMPT);
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello!' }]);
  });

  it(`히스토리는 최근 ${MAX_HISTORY}개 이하로 제한되고 마지막 메시지는 유지된다`, () => {
    const body = buildChatRequestBody(makeMessages(41)); // 마지막 m40 = user
    expect(body.messages.length).toBeLessThanOrEqual(MAX_HISTORY);
    expect(body.messages.at(-1)?.content).toBe('m40');
    expect(body.messages.at(-1)?.role).toBe('user');
  });

  it('절단 후 첫 메시지가 user 가 되도록 앞쪽 assistant 를 제거한다 (relay 스키마 요구)', () => {
    const body = buildChatRequestBody(makeMessages(41)); // slice 후 선두 m21 = assistant
    expect(body.messages[0]?.role).toBe('user');
  });

  it('systemPrompt 에 교정·회화 튜터 지침이 들어 있다', () => {
    expect(ENGLISH_TUTOR_SYSTEM_PROMPT).toMatch(/English/);
    expect(ENGLISH_TUTOR_SYSTEM_PROMPT).toMatch(/correct/i);
  });
});
