import { describe, expect, it } from 'vitest';
import { buildProfile } from '@/features/simulation/profile';
import { makeSurvivor } from '@/features/simulation/testUtils';
import {
  DEFAULT_JOB,
  JOBS,
  JOB_CATEGORIES,
  getJob,
  getJobLabel,
  isJobId,
  jobsByCategory,
} from './jobs';

describe('job table', () => {
  it('carries five jobs in each of the seven categories', () => {
    expect(JOB_CATEGORIES).toHaveLength(7);
    JOB_CATEGORIES.forEach((category) => {
      expect(jobsByCategory(category)).toHaveLength(5);
    });
    expect(JOBS).toHaveLength(35);
  });

  it('uses unique ids and Korean labels', () => {
    expect(new Set(JOBS.map((job) => job.id)).size).toBe(JOBS.length);
    expect(new Set(JOBS.map((job) => job.label)).size).toBe(JOBS.length);
  });

  it('gives every job a flavor line', () => {
    JOBS.forEach((job) => expect(job.flavor.length).toBeGreaterThan(6));
  });

  it('has a default that actually exists', () => {
    expect(getJob(DEFAULT_JOB)).toBeDefined();
  });

  it('falls back rather than showing a blank label', () => {
    expect(getJobLabel(DEFAULT_JOB).length).toBeGreaterThan(0);
  });

  it('rejects an unknown id', () => {
    expect(isJobId('astronaut')).toBe(false);
    expect(isJobId('doctor')).toBe(true);
  });
});

describe('jobs feed the action profile', () => {
  it('makes a 의사 better at medicine than a 회사원', () => {
    const doctor = buildProfile(makeSurvivor('a', 'A', { job: 'doctor' }));
    const office = buildProfile(makeSurvivor('b', 'B', { job: 'officeWorker' }));
    expect(doctor.medical).toBeGreaterThan(office.medical);
  });

  it('makes a 용접공 better in a fight than a 사서', () => {
    const welder = buildProfile(makeSurvivor('a', 'A', { job: 'welder' }));
    const librarian = buildProfile(makeSurvivor('b', 'B', { job: 'librarian' }));
    expect(welder.combat).toBeGreaterThan(librarian.combat);
  });

  it('stacks with traits instead of replacing them', () => {
    const plain = buildProfile(makeSurvivor('a', 'A', { job: 'welder' }));
    const armed = buildProfile(
      makeSurvivor('b', 'B', { job: 'welder', traits: ['marksman'] }),
    );
    expect(armed.combat).toBeGreaterThan(plain.combat);
  });

  it('lets 응급구조사 raise the odds of dying for someone', () => {
    const paramedic = buildProfile(makeSurvivor('a', 'A', { job: 'paramedic' }));
    expect(paramedic.sacrifice).toBeGreaterThan(1);
  });
});
