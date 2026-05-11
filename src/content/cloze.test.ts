import { describe, expect, it } from 'vitest';
import { fillCloze, maskCloze, parseCloze } from './cloze';

describe('parseCloze', () => {
  it('단일 마커 파싱', () => {
    const result = parseCloze('I {go} to school.');
    expect(result.parts).toEqual(['I ', ' to school.']);
    expect(result.markers).toEqual(['go']);
  });

  it('다중 마커 파싱', () => {
    const result = parseCloze('I {go} to {school} every {day}.');
    expect(result.parts).toEqual(['I ', ' to ', ' every ', '.']);
    expect(result.markers).toEqual(['go', 'school', 'day']);
  });

  it('마커 없으면 빈 markers + 원문 한 조각', () => {
    const result = parseCloze('No markers here.');
    expect(result.markers).toEqual([]);
    expect(result.parts).toEqual(['No markers here.']);
  });

  it('빈 문자열', () => {
    const result = parseCloze('');
    expect(result.markers).toEqual([]);
    expect(result.parts).toEqual(['']);
  });

  it('parts.length === markers.length + 1 보장', () => {
    const result = parseCloze('a {b} c {d} e');
    expect(result.parts.length).toBe(result.markers.length + 1);
  });
});

describe('fillCloze', () => {
  it('replacements 없으면 마커 단어 그대로 사용 (TTS 발화용)', () => {
    expect(fillCloze('I {go} to school.')).toBe('I go to school.');
    expect(fillCloze('I {go} to {school}.')).toBe('I go to school.');
  });

  it('replacements 지정 시 인덱스 순서대로 치환', () => {
    expect(fillCloze('I {go} to {school}.', ['walked', 'work'])).toBe('I walked to work.');
  });

  it('replacements 부족 시 부족분은 마커 폴백', () => {
    expect(fillCloze('I {go} to {school}.', ['walked'])).toBe('I walked to school.');
  });

  it('마커 없는 문장은 원문 그대로', () => {
    expect(fillCloze('Hello world.')).toBe('Hello world.');
  });
});

describe('maskCloze', () => {
  it('마커를 placeholder로 치환', () => {
    expect(maskCloze('I {go} to school.')).toBe('I _____ to school.');
  });

  it('다중 마커 모두 치환', () => {
    expect(maskCloze('I {go} to {school}.')).toBe('I _____ to _____.');
  });

  it('placeholder 커스터마이징', () => {
    expect(maskCloze('I {go}.', '___')).toBe('I ___.');
  });
});
