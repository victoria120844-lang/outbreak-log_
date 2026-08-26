import { describe, expect, it } from 'vitest';
import { applyTemplate, chooseParticle } from './text';

describe('chooseParticle', () => {
  it('picks 가 after an open syllable and 이 after a closed one', () => {
    expect(chooseParticle('민수', '가')).toBe('가');
    expect(chooseParticle('지연', '가')).toBe('이');
  });

  it('handles 을/를, 은/는 and 와/과', () => {
    expect(chooseParticle('통조림', '를')).toBe('을');
    expect(chooseParticle('생수', '를')).toBe('를');
    expect(chooseParticle('지연', '는')).toBe('은');
    expect(chooseParticle('민수', '는')).toBe('는');
    expect(chooseParticle('지연', '와')).toBe('과');
    expect(chooseParticle('민수', '와')).toBe('와');
  });

  it('treats ㄹ as open for 으로/로', () => {
    expect(chooseParticle('연필', '로')).toBe('로');
    expect(chooseParticle('손도끼', '로')).toBe('로');
    expect(chooseParticle('식칼', '로')).toBe('로');
    expect(chooseParticle('공구함', '로')).toBe('으로');
  });

  it('leaves non-Hangul names readable', () => {
    expect(chooseParticle('Kay', '가')).toBe('가');
  });
});

describe('applyTemplate', () => {
  it('fills slots and corrects the particle after each', () => {
    expect(
      applyTemplate('{생존자}가 {아이템}을 가지고 나왔다.', {
        생존자: '지연',
        아이템: '생수',
      }),
    ).toBe('지연이 생수를 가지고 나왔다.');
  });

  it('fills two survivors in one line', () => {
    expect(
      applyTemplate('{생존자}와 {상대}가 다퉜다.', {
        생존자: '민수',
        상대: '지연',
      }),
    ).toBe('민수와 지연이 다퉜다.');
  });

  it('leaves a slot alone when it has no value', () => {
    expect(applyTemplate('{상대}가 왔다.', {})).toBe('{상대}가 왔다.');
  });

  it('handles a slot with no trailing particle', () => {
    expect(applyTemplate('기록: {생존자}', { 생존자: '지연' })).toBe(
      '기록: 지연',
    );
  });
});
