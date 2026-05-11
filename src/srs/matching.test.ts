import { describe, expect, it } from 'vitest';
import { isAllCorrect, isCorrect, normalize } from './matching';

describe('normalize', () => {
  it('앞뒤 공백 제거', () => {
    expect(normalize('  hello  ')).toBe('hello');
  });

  it('대소문자 통일 (lowercase)', () => {
    expect(normalize('Apple')).toBe('apple');
    expect(normalize('HELLO')).toBe('hello');
  });

  it('기본 구두점 제거 (.,?!;:\'")', () => {
    expect(normalize('Apple.')).toBe('apple');
    expect(normalize('How are you?')).toBe('how are you');
    expect(normalize('"quoted"')).toBe('quoted');
    expect(normalize("it's")).toBe('its');
  });

  it('내부 공백은 보존 (단어 사이 띄어쓰기)', () => {
    expect(normalize('how are you')).toBe('how are you');
  });

  it('빈 문자열·공백만 → 빈 문자열', () => {
    expect(normalize('')).toBe('');
    expect(normalize('   ')).toBe('');
  });
});

describe('isCorrect (단일 입력 매칭)', () => {
  it('정확 일치는 정답', () => {
    expect(isCorrect('apple', 'apple')).toBe(true);
  });

  it('대소문자 차이는 정답', () => {
    expect(isCorrect('APPLE', 'apple')).toBe(true);
    expect(isCorrect('Apple', 'apple')).toBe(true);
  });

  it('앞뒤 공백 차이는 정답', () => {
    expect(isCorrect('  apple ', 'apple')).toBe(true);
  });

  it('구두점 차이는 정답 (Apple. ≅ apple)', () => {
    expect(isCorrect('Apple.', 'apple')).toBe(true);
    expect(isCorrect('How are you?', 'how are you')).toBe(true);
  });

  it('오타는 오답 (Levenshtein 미적용)', () => {
    expect(isCorrect('appel', 'apple')).toBe(false);
    expect(isCorrect('aple', 'apple')).toBe(false);
  });

  it('완전 다른 단어는 오답', () => {
    expect(isCorrect('orange', 'apple')).toBe(false);
  });
});

describe('isAllCorrect (다중 빈칸 매칭, 클로즈 모드)', () => {
  it('모든 빈칸 정답 → true', () => {
    expect(isAllCorrect(['go', 'school'], ['go', 'school'])).toBe(true);
  });

  it('하나라도 오답 → false', () => {
    expect(isAllCorrect(['go', 'wrong'], ['go', 'school'])).toBe(false);
  });

  it('대소문자·구두점 차이는 정답으로 인정', () => {
    expect(isAllCorrect(['Go.', 'School'], ['go', 'school'])).toBe(true);
  });

  it('길이 불일치 → false', () => {
    expect(isAllCorrect(['go'], ['go', 'school'])).toBe(false);
    expect(isAllCorrect(['go', 'school', 'extra'], ['go', 'school'])).toBe(false);
  });

  it('단일 빈칸도 처리', () => {
    expect(isAllCorrect(['go'], ['go'])).toBe(true);
    expect(isAllCorrect(['no'], ['go'])).toBe(false);
  });
});
