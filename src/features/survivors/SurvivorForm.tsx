import { useId, useState, type FormEvent } from 'react';
import { rollAbilities } from '@/data/abilities';
import {
  DEFAULT_JOB,
  JOB_CATEGORIES,
  getJob,
  isJobId,
  jobsByCategory,
} from '@/data/jobs';
import { ROMANCE_MIN_AGE } from '@/data/relationships';
import { useStore } from '@/store';
import type { Gender, JobId, TraitId } from '@/types';
import AbilityPicker from './AbilityPicker';
import MbtiSelector, { EMPTY_AXES, composeMbti } from './MbtiSelector';
import TraitPicker, { REQUIRED_TRAITS } from './TraitPicker';
import { createSurvivor } from './createSurvivor';
import { rollSurvivorDraft } from './randomDraft';

const GENDERS: readonly Gender[] = ['남성', '여성', '비공개'];
const NAME_MAX = 8;
// Children are registerable. The romance ladder refuses to pair anyone under
// ROMANCE_MIN_AGE regardless of 순애 모드, so the low end costs nothing.
const MIN_AGE = 1;
const MAX_AGE = 90;
const DEFAULT_AGE = 30;

export interface SurvivorFormProps {
  /** Called with the new survivor's id so the list can scroll to it. */
  onRegistered: (id: string) => void;
}

export default function SurvivorForm({ onRegistered }: SurvivorFormProps) {
  const survivors = useStore((state) => state.survivors);
  const addSurvivor = useStore((state) => state.addSurvivor);
  const day = useStore((state) => state.sim.day);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [job, setJob] = useState<JobId>(DEFAULT_JOB);
  // Held as text so a half-typed number is never rewritten under the cursor.
  const [ageText, setAgeText] = useState(String(DEFAULT_AGE));
  const [axes, setAxes] = useState(EMPTY_AXES);
  const [traits, setTraits] = useState<TraitId[]>([]);
  const [abilities, setAbilities] = useState(() => rollAbilities());

  const rollEverything = (): void => {
    const draft = rollSurvivorDraft(survivors.map((entry) => entry.name));
    setName(draft.name);
    setGender(draft.gender);
    setAgeText(String(draft.age));
    setJob(draft.job);
    setAxes(draft.axes);
    setTraits(draft.traits);
    setAbilities(draft.abilities);
  };

  const nameErrorId = useId();
  const trimmedName = name.trim();
  const isDuplicate =
    trimmedName.length > 0 &&
    survivors.some((survivor) => survivor.name === trimmedName);
  const isNameValid =
    trimmedName.length > 0 && trimmedName.length <= NAME_MAX && !isDuplicate;

  const parsedAge = Number.parseInt(ageText, 10);
  const isAgeValid =
    Number.isFinite(parsedAge) && parsedAge >= MIN_AGE && parsedAge <= MAX_AGE;

  const mbti = composeMbti(axes);
  const canSubmit =
    isNameValid &&
    isAgeValid &&
    gender !== null &&
    mbti !== null &&
    traits.length === REQUIRED_TRAITS;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    // Re-checked so TypeScript narrows the nullable fields.
    if (!isNameValid || !isAgeValid || gender === null || mbti === null) return;
    if (traits.length !== REQUIRED_TRAITS) return;

    const survivor = createSurvivor({
      name: trimmedName,
      gender,
      age: parsedAge,
      job,
      mbti,
      traits,
      joinedDay: day,
      abilities,
    });
    addSurvivor(survivor);

    setName('');
    setGender(null);
    setAgeText(String(DEFAULT_AGE));
    setJob(DEFAULT_JOB);
    setAxes(EMPTY_AXES);
    setTraits([]);
    setAbilities(rollAbilities());
    onRegistered(survivor.id);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <button
        type="button"
        onClick={rollEverything}
        className="type-label w-full rounded border border-panel bg-ash-700 py-2 text-fog hover:text-bone"
      >
        무작위로 만들기
      </button>

      <div className="flex flex-col gap-1.5">
        <label className="type-label" htmlFor={`${nameErrorId}-name`}>
          이름
        </label>
        <input
          id={`${nameErrorId}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_MAX}
          autoComplete="off"
          aria-invalid={isDuplicate}
          aria-describedby={isDuplicate ? nameErrorId : undefined}
          className="rounded border border-panel bg-ash-700 px-2 py-1.5 text-sm text-bone outline-none placeholder:text-fog"
          placeholder="최대 8자"
        />
        {isDuplicate && (
          <p id={nameErrorId} className="type-data text-xs text-blood-hot">
            이미 등록된 이름입니다.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="type-label">성별</span>
        <div className="grid grid-cols-3 gap-1">
          {GENDERS.map((option) => {
            const isSelected = gender === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setGender(option)}
                className={`rounded border py-1.5 text-sm ${
                  isSelected
                    ? 'border-blood bg-ash-700 text-bone'
                    : 'border-panel bg-ash-800 text-fog'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="type-label" htmlFor={`${nameErrorId}-age`}>
          나이
        </label>
        {/* Typed, not clicked. Clamping on every keystroke made this unusable:
            typing "45" snapped to the minimum the moment "4" was entered, and
            clearing the field refilled it. The value is only tidied on blur. */}
        <input
          id={`${nameErrorId}-age`}
          type="text"
          inputMode="numeric"
          value={ageText}
          maxLength={3}
          autoComplete="off"
          aria-invalid={!isAgeValid}
          onChange={(event) =>
            setAgeText(event.target.value.replace(/[^0-9]/g, ''))
          }
          onBlur={() => {
            if (isAgeValid) return;
            const parsed = Number.parseInt(ageText, 10);
            const settled = Number.isFinite(parsed)
              ? Math.min(MAX_AGE, Math.max(MIN_AGE, parsed))
              : DEFAULT_AGE;
            setAgeText(String(settled));
          }}
          className="type-data w-24 rounded border border-panel bg-ash-700 px-2 py-1.5 text-bone outline-none"
        />
        {!isAgeValid && (
          <p className="type-data text-xs text-blood-hot">
            {MIN_AGE}에서 {MAX_AGE} 사이로 입력해 주세요.
          </p>
        )}
        <p className="text-xs leading-snug text-fog">
          나이 차가 두 살 이상이면 서로를 형·누나·오빠·언니로 부릅니다.{' '}
          {ROMANCE_MIN_AGE}세 미만은 연인 관계로 발전하지 않습니다.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="type-label" htmlFor={`${nameErrorId}-job`}>
          직업
        </label>
        <select
          id={`${nameErrorId}-job`}
          value={job}
          onChange={(event) => {
            const next = event.target.value;
            if (isJobId(next)) setJob(next);
          }}
          className="rounded border border-panel bg-ash-700 px-2 py-1.5 text-sm text-bone"
        >
          {JOB_CATEGORIES.map((category) => (
            <optgroup key={category} label={category}>
              {jobsByCategory(category).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs leading-snug text-fog">
          {getJob(job)?.flavor ?? ''}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="type-label">MBTI</span>
        <MbtiSelector value={axes} onChange={setAxes} />
      </div>

      <AbilityPicker
        value={abilities}
        job={job}
        onChange={setAbilities}
        onRoll={() => setAbilities(rollAbilities())}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="type-label">성격 키워드</span>
          <span className="type-data text-xs text-fog">
            {traits.length} / {REQUIRED_TRAITS}
          </span>
        </div>
        <TraitPicker selected={traits} onChange={setTraits} />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={`type-display w-full rounded py-2.5 text-base tracking-label ${
          canSubmit
            ? 'bg-blood text-bone'
            : 'cursor-not-allowed bg-ash-700 text-fog'
        }`}
      >
        생존자 등록
      </button>
    </form>
  );
}
