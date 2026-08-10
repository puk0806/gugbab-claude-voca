import { describe, expect, it } from 'vitest';
import { buildChatRequestBody, buildEnglishTutorSystemPrompt, MAX_HISTORY } from './chatRequest';

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
    expect(body.systemPrompt).toBe(buildEnglishTutorSystemPrompt('both'));
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello!' }]);
  });

  it('mode 를 넘기면 해당 모드의 systemPrompt 로 조립한다', () => {
    const body = buildChatRequestBody([{ role: 'user', content: 'Hi' }], 'none');
    expect(body.systemPrompt).toBe(buildEnglishTutorSystemPrompt('none'));
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
});

describe('buildEnglishTutorSystemPrompt', () => {
  it('모든 모드에 교정·회화 튜터 공통 지침이 들어 있다', () => {
    for (const mode of ['none', 'translation', 'expressions', 'both'] as const) {
      const prompt = buildEnglishTutorSystemPrompt(mode);
      expect(prompt).toMatch(/English/);
      expect(prompt).toMatch(/correct/i);
      expect(prompt).toContain('follow-up question');
    }
  });

  it('both: 한국어 해석 + 핵심 표현 블록 지침이 모두 들어 있다', () => {
    const prompt = buildEnglishTutorSystemPrompt('both');
    expect(prompt).toMatch(/Korean translation/);
    expect(prompt).toContain('(한국어 해석)');
    expect(prompt).toContain('📌 핵심 표현');
    expect(prompt).toContain('- <expression> — <Korean meaning>');
  });

  it('translation: 해석 블록만 있고 핵심 표현 블록은 없다', () => {
    const prompt = buildEnglishTutorSystemPrompt('translation');
    expect(prompt).toContain('(한국어 해석)');
    expect(prompt).not.toContain('📌 핵심 표현');
  });

  it('expressions: 핵심 표현 블록만 있고 해석 블록은 없다', () => {
    const prompt = buildEnglishTutorSystemPrompt('expressions');
    expect(prompt).toContain('📌 핵심 표현');
    expect(prompt).not.toContain('(한국어 해석)');
    expect(prompt).not.toMatch(/Korean translation/);
  });

  it('none: 부가 블록 지침이 전혀 없고 한국어는 교정 노트에만 허용된다', () => {
    const prompt = buildEnglishTutorSystemPrompt('none');
    expect(prompt).not.toContain('(한국어 해석)');
    expect(prompt).not.toContain('📌 핵심 표현');
    expect(prompt).toContain('Only the correction note may use Korean.');
  });

  it('mode 생략 시 both 와 동일하다 (기본값)', () => {
    expect(buildEnglishTutorSystemPrompt()).toBe(buildEnglishTutorSystemPrompt('both'));
  });
});
