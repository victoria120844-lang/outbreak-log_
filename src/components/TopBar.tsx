import DevModeToggle from '@/components/DevModeToggle';
import MemorialButton from '@/components/MemorialButton';
import PureLoveToggle from '@/components/PureLoveToggle';
import ResetAllButton from '@/components/ResetAllButton';
import { SITE } from '@/config';
import { formatDay } from '@/features/simulation';
import { useStore } from '@/store';

interface StatChipProps {
  label: string;
  value: string;
  isCritical?: boolean;
}

function StatChip({ label, value, isCritical = false }: StatChipProps) {
  return (
    <div className="flex items-baseline gap-1.5 border border-panel bg-ash-700 px-2 py-1">
      <span className="type-data text-xs text-fog">{label}</span>
      <span
        className={`type-data ${isCritical ? 'text-blood-hot' : 'text-bone'}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function TopBar() {
  const survivors = useStore((state) => state.survivors);
  const day = useStore((state) => state.sim.day);

  const alive = survivors.filter((survivor) => survivor.alive).length;
  const turned = survivors.filter((s) => s.status === '좀비').length;
  const dead = survivors.filter((s) => s.status === '사망').length;

  return (
    <header className="panel flex h-12 shrink-0 items-center justify-between gap-4 px-4">
      <div className="flex min-w-0 items-center gap-2">
        {/* Truncates rather than pushing the chips off-screen at 320px. */}
        <span className="type-display min-w-0 truncate text-base text-bone sm:text-lg">
          OUTBREAK LOG
        </span>
        <DevModeToggle />
        <PureLoveToggle />
        <MemorialButton />
      </div>

      <div className="flex min-w-0 shrink items-center gap-1.5">
        <span className="type-data hidden truncate text-[10px] text-fog lg:inline">
          제작 · {SITE.authorHandle}
        </span>
        <StatChip label="DAY" value={formatDay(day)} />
        <StatChip label="생존" value={String(alive)} />
        {turned > 0 && <StatChip label="좀비" value={String(turned)} isCritical />}
        <StatChip label="사망" value={String(dead)} isCritical={dead > 0} />
        <ResetAllButton />
      </div>
    </header>
  );
}
