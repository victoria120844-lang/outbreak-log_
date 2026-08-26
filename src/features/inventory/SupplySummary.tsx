import { formatWeight, type InventorySummary } from './supply';

const CRITICAL_DAYS = 2;

interface ReadoutProps {
  label: string;
  days: number | null;
}

function Readout({ label, days }: ReadoutProps) {
  const isCritical = days !== null && days < CRITICAL_DAYS;
  return (
    <span className="flex items-baseline gap-1">
      <span className="type-label">{label}</span>
      <span
        className={`type-data ${isCritical ? 'text-blood-hot' : 'text-bone'}`}
      >
        {days === null ? '—' : `${days}일`}
      </span>
    </span>
  );
}

export interface SupplySummaryProps {
  summary: InventorySummary;
}

/** Pinned to the bottom of the scrolling panel body. */
export default function SupplySummary({ summary }: SupplySummaryProps) {
  return (
    <div className="sticky bottom-0 -mx-4 -mb-4 mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-oxblood bg-ash-800 px-4 py-2">
      <span className="flex items-baseline gap-1">
        <span className="type-label">총 중량</span>
        <span className="type-data text-bone">
          {formatWeight(summary.totalWeight)}
        </span>
      </span>
      <Readout label="식량 잔여" days={summary.foodDays} />
      <Readout label="식수 잔여" days={summary.waterDays} />
    </div>
  );
}
