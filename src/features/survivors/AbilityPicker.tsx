import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  ABILITY_MAX,
  ABILITY_MIN,
  abilityTotal,
  clampAbility,
} from '@/data/abilities';
import { getJob } from '@/data/jobs';
import type { AbilityKey, JobId, SurvivorAbilities } from '@/types';

export interface AbilityPickerProps {
  value: SurvivorAbilities;
  /** Shown as a preview: the job's training is added on registration. */
  job: JobId;
  onChange: (next: SurvivorAbilities) => void;
  onRoll: () => void;
}

export default function AbilityPicker({
  value,
  job,
  onChange,
  onRoll,
}: AbilityPickerProps) {
  const bonus = getJob(job)?.abilityBonus;

  const step = (key: AbilityKey, amount: number): void => {
    onChange({ ...value, [key]: clampAbility(value[key] + amount) });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="type-label">능력치</span>
        <span className="flex items-baseline gap-2">
          <span className="type-data text-xs text-fog">
            합계 {abilityTotal(value)}
          </span>
          <button
            type="button"
            onClick={onRoll}
            className="type-label text-fog hover:text-bone"
          >
            무작위
          </button>
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {ABILITY_KEYS.map((key) => {
          const gain = bonus?.[key] ?? 0;
          const score = value[key];
          return (
            <li key={key} className="flex items-center gap-2">
              <span className="type-label w-9 shrink-0">
                {ABILITY_LABELS[key]}
              </span>

              <button
                type="button"
                onClick={() => step(key, -1)}
                disabled={score <= ABILITY_MIN}
                aria-label={`${ABILITY_LABELS[key]} 낮추기`}
                className={`type-data h-6 w-6 shrink-0 rounded border border-panel bg-ash-700 ${
                  score <= ABILITY_MIN
                    ? 'cursor-not-allowed text-fog'
                    : 'text-bone'
                }`}
              >
                −
              </button>

              <span className="type-data w-6 shrink-0 text-center text-bone">
                {score}
              </span>

              <button
                type="button"
                onClick={() => step(key, 1)}
                disabled={score >= ABILITY_MAX}
                aria-label={`${ABILITY_LABELS[key]} 올리기`}
                className={`type-data h-6 w-6 shrink-0 rounded border border-panel bg-ash-700 ${
                  score >= ABILITY_MAX
                    ? 'cursor-not-allowed text-fog'
                    : 'text-bone'
                }`}
              >
                +
              </button>

              {/* A thin readout so the distribution is visible at a glance. */}
              <span className="h-[3px] flex-1 bg-ash-700">
                <span
                  className="block h-full bg-blood"
                  style={{ width: `${(score / ABILITY_MAX) * 100}%` }}
                />
              </span>

              {gain !== 0 && (
                <span className="type-data w-8 shrink-0 text-right text-xs text-fog">
                  {gain > 0 ? `+${gain}` : gain}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {bonus !== undefined && (
        <p className="type-data text-[10px] text-fog">
          직업 보정은 등록할 때 더해집니다. 최대 {ABILITY_MAX}.
        </p>
      )}
    </div>
  );
}
