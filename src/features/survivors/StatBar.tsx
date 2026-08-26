import { STAT_MAX, clampStat } from '@/data/stats';

export interface StatBarProps {
  label: string;
  value: number;
  /** `infection` switches the fill to bile; nothing else may use that color. */
  tone?: 'default' | 'infection';
}

export default function StatBar({
  label,
  value,
  tone = 'default',
}: StatBarProps) {
  const clamped = clampStat(value);
  const ratio = (clamped / STAT_MAX) * 100;

  return (
    <div className="flex items-center gap-2">
      <span className="type-label w-9 shrink-0">{label}</span>
      <div
        className="h-[3px] flex-1 bg-ash-700"
        role="meter"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={STAT_MAX}
      >
        <div
          className={`h-full ${tone === 'infection' ? 'bg-bile' : 'bg-blood'}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
      <span className="type-data w-6 shrink-0 text-right text-fog">
        {clamped}
      </span>
    </div>
  );
}
