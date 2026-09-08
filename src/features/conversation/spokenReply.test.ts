import { describe, expect, it } from 'vitest';
import { extractSpokenEnglish } from './spokenReply';

describe('extractSpokenEnglish', () => {
  it('순수 영어 답변은 그대로 반환한다 (줄바꿈은 공백으로)', () => {
    expect(extractSpokenEnglish('That sounds fun!\nWhat did you do next?')).toBe(
      'That sounds fun! What did you do next?',
    );
  });

  it('해석 블록과 핵심 표현 블록을 제거한다 (both 모드 전체 형식)', () => {
    const content = [
      'That sounds like a fun weekend! What did you cook?',
      '',
      '(정말 재밌는 주말이었겠네요! 뭘 요리했어요?)',
      '',
      '📌 핵심 표현',
      '- sounds like — ~인 것 같다',
      '- cook dinner — 저녁을 요리하다',
    ].join('\n');
    expect(extractSpokenEnglish(content)).toBe(
      'That sounds like a fun weekend! What did you cook?',
    );
  });

  it('✏️ 교정 라인과 🗣️ 표현 안내 라인을 제거한다', () => {
    const corr = '✏️ I went to the park. — 과거형은 went 를 씁니다\nNice! What did you see there?';
    expect(extractSpokenEnglish(corr)).toBe('Nice! What did you see there?');

    const howTo = '🗣️ "Can I get a refund?" — 환불 요청 표현\nTry saying it! When would you use it?';
    expect(extractSpokenEnglish(howTo)).toBe('Try saying it! When would you use it?');
  });

  it('형식 이탈 방어: 📌 헤더 없이 한글 섞인 라인만 있어도 걸러진다', () => {
    const content = 'Great job!\nsounds like — ~인 것 같다\nKeep going!';
    expect(extractSpokenEnglish(content)).toBe('Great job! Keep going!');
  });

  it('빈 문자열·전부 한국어 블록이면 빈 문자열을 반환한다', () => {
    expect(extractSpokenEnglish('')).toBe('');
    expect(extractSpokenEnglish('(한국어 해석만 있는 경우)')).toBe('');
  });
});
