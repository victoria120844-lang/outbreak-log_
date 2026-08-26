import { ABILITY_KEYS, clampAbility } from './abilities';
import type { Job, JobCategory, JobId, SurvivorAbilities } from '@/types';

export const JOB_CATEGORIES: readonly JobCategory[] = [
  '경영·사무·근무직',
  '연구·공학 기술직',
  '교육·법률·사회복지직',
  '보건·의료직',
  '예술·디자인·방송직',
  '설치·정비·생산직',
  '치안·군사직',
];

/**
 * What someone did before the outbreak. Modifiers are deliberately small next
 * to traits — a job tilts a run, it does not decide one.
 */
export const JOBS: readonly Job[] = [
  /* ------------------------------------------- 경영·사무·근무직 */
  {
    id: 'officeWorker',
    category: '경영·사무·근무직',
    label: '회사원',
    flavor: '버티는 데에는 이골이 나 있다.',
    abilityBonus: { endurance: 1, intellect: 1 },
    modifiers: { eventWeights: { cooperation: 1.15, morale: 1.05 } },
  },
  {
    id: 'manager',
    category: '경영·사무·근무직',
    label: '관리자',
    flavor: '누가 무엇을 맡을지 먼저 정한다.',
    abilityBonus: { intellect: 2 },
    modifiers: { eventWeights: { cooperation: 1.3, conflict: 0.85 } },
  },
  {
    id: 'accountant',
    category: '경영·사무·근무직',
    label: '회계사',
    flavor: '남은 것을 세는 일에는 실수가 없다.',
    abilityBonus: { intellect: 3 },
    modifiers: { stats: { hunger: -3 }, eventWeights: { scavenge: 1.1 } },
  },
  {
    id: 'salesperson',
    category: '경영·사무·근무직',
    label: '영업사원',
    flavor: '처음 보는 사람과도 오 분이면 말을 튼다.',
    abilityBonus: { luck: 2, intellect: 1 },
    modifiers: { eventWeights: { cooperation: 1.35, conflict: 0.9 } },
  },
  {
    id: 'logistics',
    category: '경영·사무·근무직',
    label: '물류 관리원',
    flavor: '어디에 무엇이 쌓여 있는지 기억한다.',
    abilityBonus: { intellect: 2, endurance: 1 },
    modifiers: { eventWeights: { scavenge: 1.25 } },
  },

  /* ------------------------------------------- 연구·공학 기술직 */
  {
    id: 'researcher',
    category: '연구·공학 기술직',
    label: '연구원',
    flavor: '증상을 기록부터 한다. 도움이 될지는 모른다.',
    abilityBonus: { intellect: 3 },
    modifiers: { eventWeights: { medical: 1.25, infection: 0.9 } },
  },
  {
    id: 'engineer',
    category: '연구·공학 기술직',
    label: '엔지니어',
    flavor: '고장난 것을 보면 손이 먼저 간다.',
    abilityBonus: { intellect: 2, strength: 1 },
    modifiers: { eventWeights: { scavenge: 1.3, accident: 0.8 } },
  },
  {
    id: 'programmer',
    category: '연구·공학 기술직',
    label: '프로그래머',
    flavor: '밤을 새우는 데에는 익숙하다.',
    abilityBonus: { intellect: 3, endurance: -1 },
    modifiers: { stats: { stamina: -3 }, eventWeights: { scavenge: 1.15 } },
  },
  {
    id: 'chemist',
    category: '연구·공학 기술직',
    label: '화학 기술자',
    flavor: '섞으면 안 되는 것을 안다.',
    abilityBonus: { intellect: 3 },
    modifiers: { eventWeights: { medical: 1.3, infection: 0.85 } },
  },
  {
    id: 'architect',
    category: '연구·공학 기술직',
    label: '건축가',
    flavor: '이 건물이 어디부터 무너질지 보인다.',
    abilityBonus: { intellect: 2, agility: 1 },
    modifiers: { eventWeights: { accident: 0.7, scavenge: 1.15 } },
  },

  /* --------------------------------------- 교육·법률·사회복지직 */
  {
    id: 'teacher',
    category: '교육·법률·사회복지직',
    label: '교사',
    flavor: '흩어지려는 사람들을 한자리에 앉힌다.',
    abilityBonus: { intellect: 2 },
    modifiers: { eventWeights: { cooperation: 1.3, morale: 1.15 } },
  },
  {
    id: 'lawyer',
    category: '교육·법률·사회복지직',
    label: '변호사',
    flavor: '누구의 말이 앞뒤가 안 맞는지 먼저 안다.',
    abilityBonus: { intellect: 3 },
    modifiers: { eventWeights: { conflict: 0.8, cooperation: 1.2 } },
  },
  {
    id: 'socialWorker',
    category: '교육·법률·사회복지직',
    label: '사회복지사',
    flavor: '무너진 사람을 먼저 알아본다.',
    abilityBonus: { intellect: 1, endurance: 1 },
    modifiers: {
      eventWeights: { morale: 1.3, cooperation: 1.2 },
      behavior: { shareMedicine: 1.3 },
    },
  },
  {
    id: 'counselor',
    category: '교육·법률·사회복지직',
    label: '상담사',
    flavor: '말을 시키는 법을 알고 있다.',
    abilityBonus: { intellect: 2 },
    modifiers: { stats: { morale: 3 }, eventWeights: { morale: 1.25 } },
  },
  {
    id: 'librarian',
    category: '교육·법률·사회복지직',
    label: '사서',
    flavor: '쓸모없어 보이는 것을 오래 간직한다.',
    abilityBonus: { intellect: 3, strength: -1 },
    modifiers: { eventWeights: { scavenge: 1.2, conflict: 0.85 } },
  },

  /* ------------------------------------------------- 보건·의료직 */
  {
    id: 'doctor',
    category: '보건·의료직',
    label: '의사',
    flavor: '살릴 수 있는 사람과 아닌 사람을 먼저 나눈다.',
    abilityBonus: { intellect: 3 },
    modifiers: {
      eventWeights: { medical: 1.5, infection: 0.85 },
      behavior: { shareMedicine: 1.2 },
    },
  },
  {
    id: 'nurse',
    category: '보건·의료직',
    label: '간호사',
    flavor: '손이 빠르고, 밤을 잘 견딘다.',
    abilityBonus: { intellect: 2, endurance: 1 },
    modifiers: { eventWeights: { medical: 1.35, cooperation: 1.2 } },
  },
  {
    id: 'paramedic',
    category: '보건·의료직',
    label: '응급구조사',
    flavor: '가장 먼저 도착하는 데 익숙하다.',
    abilityBonus: { agility: 2, endurance: 1 },
    modifiers: {
      eventWeights: { medical: 1.3, accident: 0.8 },
      behavior: { sacrifice: 1.2 },
    },
  },
  {
    id: 'pharmacist',
    category: '보건·의료직',
    label: '약사',
    flavor: '남은 약으로 며칠을 버틸지 계산한다.',
    abilityBonus: { intellect: 3 },
    modifiers: { eventWeights: { medical: 1.25, infection: 0.8 } },
  },
  {
    id: 'physicalTherapist',
    category: '보건·의료직',
    label: '물리치료사',
    flavor: '못 걷던 사람을 다시 걷게 한다.',
    abilityBonus: { strength: 1, endurance: 2 },
    modifiers: { stats: { stamina: 3 }, eventWeights: { medical: 1.15 } },
  },

  /* --------------------------------------- 예술·디자인·방송직 */
  {
    id: 'musician',
    category: '예술·디자인·방송직',
    label: '음악가',
    flavor: '소리 없는 밤을 가장 견디기 힘들어한다.',
    abilityBonus: { luck: 1, intellect: 1 },
    modifiers: { stats: { morale: 4 }, eventWeights: { morale: 1.3 } },
  },
  {
    id: 'designer',
    category: '예술·디자인·방송직',
    label: '디자이너',
    flavor: '없는 것으로 있는 것처럼 만든다.',
    abilityBonus: { intellect: 2 },
    modifiers: { eventWeights: { scavenge: 1.2, morale: 1.15 } },
  },
  {
    id: 'celebrity',
    category: '예술·디자인·방송직',
    label: '연예인',
    flavor: '아직도 알아보는 사람이 있다. 그게 도움이 될 때도 있다.',
    modifiers: { eventWeights: { cooperation: 1.35, morale: 1.25 } },
    abilityBonus: { luck: 2, intellect: 1 },
  },
  {
    id: 'broadcaster',
    category: '예술·디자인·방송직',
    label: '방송인',
    flavor: '침묵이 길어지면 먼저 입을 연다.',
    abilityBonus: { luck: 2 },
    modifiers: { eventWeights: { cooperation: 1.3, morale: 1.2 } },
  },
  {
    id: 'writer',
    category: '예술·디자인·방송직',
    label: '작가',
    flavor: '일지를 쓰자고 처음 말한 사람이다.',
    abilityBonus: { intellect: 2 },
    modifiers: { eventWeights: { morale: 1.15, conflict: 0.9 } },
  },

  /* --------------------------------------- 설치·정비·생산직 */
  {
    id: 'mechanic',
    category: '설치·정비·생산직',
    label: '정비공',
    flavor: '소리만 듣고도 어디가 고장인지 안다.',
    abilityBonus: { intellect: 2, strength: 1 },
    modifiers: { eventWeights: { scavenge: 1.35, accident: 0.8 } },
  },
  {
    id: 'electrician',
    category: '설치·정비·생산직',
    label: '전기기사',
    flavor: '정전이 되면 모두가 그를 본다.',
    abilityBonus: { intellect: 2, agility: 1 },
    modifiers: { eventWeights: { scavenge: 1.3, accident: 0.75 } },
  },
  {
    id: 'welder',
    category: '설치·정비·생산직',
    label: '용접공',
    flavor: '문을 잠그는 가장 확실한 방법을 안다.',
    abilityBonus: { strength: 2, endurance: 1 },
    modifiers: {
      stats: { hp: 3 },
      eventWeights: { combat: 1.15, accident: 0.85 },
    },
  },
  {
    id: 'carpenter',
    category: '설치·정비·생산직',
    label: '목수',
    flavor: '판자 몇 장으로 하룻밤을 벌어준다.',
    abilityBonus: { strength: 2, endurance: 1 },
    modifiers: { eventWeights: { scavenge: 1.25, accident: 0.85 } },
  },
  {
    id: 'factoryWorker',
    category: '설치·정비·생산직',
    label: '생산직 근로자',
    flavor: '같은 일을 오래 반복하는 데 강하다.',
    modifiers: {
      stats: { stamina: 4 },
      eventWeights: { cooperation: 1.15 },
    },
    abilityBonus: { endurance: 2, strength: 1 },
  },

  /* --------------------------------------------------- 치안·군사직 */
  {
    id: 'police',
    category: '치안·군사직',
    label: '경찰',
    flavor: '소리를 지르지 않고도 사람을 세운다.',
    modifiers: { eventWeights: { combat: 1.3, conflict: 0.8 } },
    abilityBonus: { strength: 2, intellect: 1 },
  },
  {
    id: 'soldier',
    category: '치안·군사직',
    label: '군인',
    flavor: '총소리에 몸이 먼저 반응한다.',
    modifiers: { eventWeights: { combat: 1.5, morale: 1.1 } },
    abilityBonus: { strength: 3, endurance: 1 },
  },
  {
    id: 'firefighter',
    category: '치안·군사직',
    label: '소방관',
    flavor: '무너진 쪽으로 먼저 들어간다.',
    modifiers: {
      eventWeights: { combat: 1.15, accident: 0.7, cooperation: 1.2 },
      behavior: { sacrifice: 1.35 },
    },
    abilityBonus: { endurance: 3, strength: 1 },
  },
  {
    id: 'securityGuard',
    category: '치안·군사직',
    label: '경비원',
    flavor: '밤에 깨어 있는 데에 익숙하다.',
    modifiers: { eventWeights: { combat: 1.15, scavenge: 1.1 } },
    abilityBonus: { endurance: 2, agility: 1 },
  },
  {
    id: 'bodyguard',
    category: '치안·군사직',
    label: '사설 경호원',
    flavor: '지켜야 할 사람을 먼저 정해두고 움직인다.',
    modifiers: {
      eventWeights: { combat: 1.35, cooperation: 1.1 },
      behavior: { sacrifice: 1.3 },
    },
    abilityBonus: { strength: 2, agility: 2 },
  },
];

const JOB_BY_ID = new Map<JobId, Job>(JOBS.map((job) => [job.id, job]));

export const getJob = (id: JobId): Job | undefined => JOB_BY_ID.get(id);

export const getJobLabel = (id: JobId): string =>
  JOB_BY_ID.get(id)?.label ?? '무직';

export const isJobId = (value: unknown): value is JobId =>
  typeof value === 'string' && JOB_BY_ID.has(value);

export const jobsByCategory = (category: JobCategory): Job[] =>
  JOBS.filter((job) => job.category === category);

export const DEFAULT_JOB: JobId = 'officeWorker';

/** Applies a job's ability bonus on top of the scores the player set. */
export const applyJobAbilityBonus = (
  abilities: SurvivorAbilities,
  jobId: JobId,
): SurvivorAbilities => {
  const bonus = getJob(jobId)?.abilityBonus;
  if (!bonus) return { ...abilities };

  const next = { ...abilities };
  ABILITY_KEYS.forEach((key) => {
    next[key] = clampAbility(next[key] + (bonus[key] ?? 0));
  });
  return next;
};
