/**
 * The handful of values a fork would want to change. Everything else is
 * content or design tokens.
 */
export const SITE = {
  /** Shown in the top bar and in the exported image footer. */
  authorHandle: '@your-handle',
  title: 'OUTBREAK LOG — 좀비 아포칼립스 생존 시뮬레이터',
  description:
    'MBTI와 성격, 관계와 보급품으로 생존자들의 하루를 굴린다. 기록은 시드로 재현되고, 그대로 공유된다.',
  /** Absolute URL of the deployed site; used for Open Graph tags. */
  url: 'https://your-handle.github.io/outbreak-log/',
} as const;
