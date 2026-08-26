import { ABILITY_KEYS, ABILITY_LABELS } from '@/data/abilities';
import { GESTATION_DAYS } from '@/data/birth';
import { getJobLabel } from '@/data/jobs';
import { CARD_STAT_KEYS, STAT_LABELS } from '@/data/stats';
import { getTraitLabels } from '@/data/traits';
import { formatDay } from '@/features/simulation/formatDay';
import type { Survivor, SurvivorStatus } from '@/types';
import StatBar from './StatBar';

const STATUS_CLASS: Record<SurvivorStatus, string> = {
  생존: 'border-panel text-fog',
  부상: 'border-blood text-bone',
  감염: 'border-bile text-bone',
  // Turned, not gone. --bile is the infection token and this is where the
  // infection ended up, so it stays on that side of the palette.
  좀비: 'border-bile bg-ash-700 text-bile',
  사망: 'border-blood-hot text-blood-hot',
};

export interface SurvivorCardProps {
  survivor: Survivor;
  /** Today, so a pregnancy can be shown as progress rather than a start date. */
  day: number;
  /** Removal is only offered before the simulation starts. */
  canRemove: boolean;
  /** Set while this survivor's name is hovered in the log. */
  isHighlighted: boolean;
  /** Who this survivor is committed to, and what that bond is now called. */
  bond: { label: string; name: string } | null;
  /** Names of the two who are raising this one, for a survivor born into the run. */
  parents: string[];
  onRemove: (id: string) => void;
}

export default function SurvivorCard({
  survivor,
  day,
  canRemove,
  isHighlighted,
  bond,
  parents,
  onRemove,
}: SurvivorCardProps) {
  const isTurned = survivor.status === '좀비';
  // Someone who turned is off the roster but not struck through — they are
  // still in the building, and the card should not read as an obituary yet.
  const isDead = survivor.status === '사망';
  const traitLabels = getTraitLabels(survivor.traits);

  return (
    <li
      data-survivor-id={survivor.id}
      className={`flex flex-col gap-2 border p-2 ${
        isHighlighted ? 'border-blood bg-ash-700' : 'border-oxblood'
      } ${isDead ? 'opacity-[0.35]' : ''} ${isTurned ? 'opacity-70' : ''}`}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={`type-display min-w-0 truncate text-base text-bone ${
            isDead ? 'line-through' : ''
          }`}
        >
          {survivor.name}
        </span>
        <span className="type-data shrink-0 text-xs text-fog">
          {survivor.mbti}
        </span>
        <span className="shrink-0 text-xs text-fog">
          {survivor.age}세 · {getJobLabel(survivor.job)}
        </span>

        <span
          className={`type-label ml-auto shrink-0 rounded border px-1.5 py-0.5 ${
            STATUS_CLASS[survivor.status]
          }`}
        >
          {survivor.status}
        </span>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(survivor.id)}
            aria-label={`${survivor.name} 제거`}
            className="type-label shrink-0 text-fog hover:text-bone"
          >
            제거
          </button>
        )}
      </div>

      {/* Who they ended up with. The log announces it once and then scrolls
          away; the roster is where the player looks it back up. */}
      {bond !== null && (
        <p className="type-data text-xs text-blood-hot">
          {bond.label} · {bond.name}
        </p>
      )}

      {parents.length > 0 && (
        <p className="type-data text-xs text-bone">
          부모 · {parents.join(' · ')}
        </p>
      )}

      {/* Abilities: what they are capable of, fixed at registration. */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        {ABILITY_KEYS.map((key) => (
          <span key={key} className="flex items-baseline gap-1">
            <span className="type-label">{ABILITY_LABELS[key]}</span>
            <span className="type-data text-xs text-bone">
              {survivor.abilities[key]}
            </span>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {traitLabels.map((label) => (
          <span
            key={label}
            className="border border-panel bg-ash-700 px-1.5 py-0.5 text-xs text-fog"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {CARD_STAT_KEYS.map((key) => (
          <StatBar
            key={key}
            label={STAT_LABELS[key]}
            value={survivor.stats[key]}
          />
        ))}
        {survivor.stats.infection > 0 && (
          <StatBar
            label={STAT_LABELS.infection}
            value={survivor.stats.infection}
            tone="infection"
          />
        )}
      </div>

      {survivor.pregnantSince !== undefined && survivor.alive && (
        <p className="type-data text-xs text-bone">
          임신 {day - survivor.pregnantSince}일째 / {GESTATION_DAYS}일
        </p>
      )}

      {isTurned && survivor.turnedDay !== undefined && (
        <p className="type-data text-xs text-bile">
          DAY {formatDay(survivor.turnedDay)} 감염 완료
          {survivor.contained === true ? ' · 창고에 갇혀 있다' : ''}
        </p>
      )}

      {isDead && survivor.diedDay !== undefined && (
        <p className="type-data text-xs text-blood-hot">
          DAY {formatDay(survivor.diedDay)} 사망
        </p>
      )}
    </li>
  );
}
