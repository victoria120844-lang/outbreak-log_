import { useState } from 'react';
import { useStore } from '@/store';

export interface LogControlsProps {
  canAdvance: boolean;
  isAuto: boolean;
  tickKey: number;
  tickMs: number;
  onAdvance: () => void;
  onToggleAuto: () => void;
  onExportPng: () => void;
  onCopyText: () => void;
  notice: string | null;
}

export default function LogControls({
  canAdvance,
  isAuto,
  tickKey,
  tickMs,
  onAdvance,
  onToggleAuto,
  onExportPng,
  onCopyText,
  notice,
}: LogControlsProps) {
  const runSeed = useStore((state) => state.sim.runSeed);
  const [seedCopied, setSeedCopied] = useState(false);

  const copySeed = (): void => {
    void navigator.clipboard
      ?.writeText(String(runSeed))
      .then(() => setSeedCopied(true))
      .catch(() => setSeedCopied(false));
  };

  return (
    <div className="flex flex-col gap-2 border-b border-oxblood pb-3">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onAdvance}
          disabled={!canAdvance}
          className={`type-display flex-1 rounded py-2.5 text-base tracking-label ${
            canAdvance
              ? 'bg-blood text-bone'
              : 'cursor-not-allowed bg-ash-700 text-fog'
          }`}
        >
          하루 진행
        </button>
        <button
          type="button"
          onClick={onToggleAuto}
          disabled={!canAdvance && !isAuto}
          aria-pressed={isAuto}
          className={`type-label rounded border px-3 ${
            isAuto
              ? 'border-blood bg-ash-700 text-bone'
              : 'border-panel bg-ash-700 text-fog'
          }`}
        >
          자동 진행
        </button>
      </div>

      {/* Hairline tick under the button; restarts on every advance. */}
      <div className="h-px w-full bg-ash-700">
        <div
          key={tickKey}
          className="h-px bg-blood"
          style={{
            width: isAuto ? '100%' : '0%',
            transition: isAuto ? `width ${tickMs}ms linear` : 'none',
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onExportPng}
          className="type-label rounded border border-panel bg-ash-700 px-2 py-1 text-fog hover:text-bone"
        >
          기록 저장
        </button>
        <button
          type="button"
          onClick={onCopyText}
          className="type-label rounded border border-panel bg-ash-700 px-2 py-1 text-fog hover:text-bone"
        >
          텍스트 복사
        </button>

        <button
          type="button"
          onClick={copySeed}
          title="클릭하면 시드가 복사됩니다"
          className="type-data ml-auto text-[10px] text-fog hover:text-bone"
        >
          SEED {runSeed}
          {seedCopied ? ' ✓' : ''}
        </button>
      </div>

      {notice !== null && (
        <p className="type-data text-[10px] text-fog">{notice}</p>
      )}
    </div>
  );
}
