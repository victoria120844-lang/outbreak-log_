import { useState } from 'react';
import { KIND_DEFAULT_TRUST, formatTrust, stageOf } from '@/data/relationships';
import { useStore } from '@/store';
import type { RelationshipPatch } from '@/store/relationshipsSlice';
import type { RelationshipKind } from '@/types';
import KindChips from './KindChips';
import TrustSlider from './TrustSlider';
import type { RelationshipPair } from './pairs';

/** `null` edits both directions at once, which is the default. */
type Direction = 'forward' | 'backward' | null;

export interface RelationshipRowProps {
  pair: RelationshipPair;
  isOpen: boolean;
  onToggle: () => void;
}

export default function RelationshipRow({
  pair,
  isOpen,
  onToggle,
}: RelationshipRowProps) {
  const updateRelationship = useStore((state) => state.updateRelationship);
  const updatePair = useStore((state) => state.updatePair);
  const [direction, setDirection] = useState<Direction>(null);

  const { a, b, forward, backward, isAsymmetric, isClosed } = pair;
  const edited = direction === 'backward' ? backward : forward;

  const apply = (patch: RelationshipPatch): void => {
    if (isClosed) return;
    if (direction === 'forward') updateRelationship(forward.id, patch);
    else if (direction === 'backward') updateRelationship(backward.id, patch);
    else updatePair(forward.id, backward.id, patch);
  };

  // Picking a kind reseeds trust; the slider can still override it after.
  const selectKind = (kind: RelationshipKind): void => {
    apply({ kind, trust: KIND_DEFAULT_TRUST[kind] });
  };

  const directionButton = (
    target: Exclude<Direction, null>,
    label: string,
    trust: number,
  ) => {
    const isActive = direction === target;
    return (
      <button
        type="button"
        aria-pressed={isActive}
        onClick={() => setDirection(isActive ? null : target)}
        className={`flex flex-1 items-baseline justify-between gap-2 rounded border px-2 py-1 ${
          isActive
            ? 'border-blood bg-ash-700 text-bone'
            : 'border-panel bg-ash-800 text-fog'
        }`}
      >
        <span className="type-label truncate">{label}</span>
        <span className="type-data shrink-0 text-xs">
          {formatTrust(trust)}
        </span>
      </button>
    );
  };

  return (
    <li
      className={`flex flex-col gap-2 border border-oxblood p-2 ${
        isClosed ? 'opacity-[0.35]' : ''
      }`}
    >
      <button
        type="button"
        onClick={isClosed ? undefined : onToggle}
        aria-expanded={isOpen}
        disabled={isClosed}
        className="flex flex-col gap-1 text-left"
      >
        <span className="flex flex-wrap items-baseline gap-1.5">
          <span className="type-display text-base text-bone">{a.name}</span>
          <span className="type-data text-xs text-fog">
            {/* A blood 가족 row also sits at trust 150, which is the 부부 rung
                — reading the ladder there would label a parent and child as a
                married couple. The kind wins whenever it says 가족. */}
            —[
            {forward.kind === '가족'
              ? '가족'
              : stageOf(Math.min(forward.trust, backward.trust)).label}
            ]—
          </span>
          <span className="type-display text-base text-bone">{b.name}</span>
          {isAsymmetric && (
            <span className="type-data border border-panel px-1 text-xs text-fog">
              비대칭
            </span>
          )}
          {isClosed && (
            <span className="type-label border border-blood-hot px-1 text-blood-hot">
              관계 종료
            </span>
          )}
        </span>
        <span className="type-data text-xs text-fog">
          {a.name}→{b.name} {formatTrust(forward.trust)} · {b.name}→{a.name}{' '}
          {formatTrust(backward.trust)}
        </span>
      </button>

      {isOpen && !isClosed && (
        <div className="flex flex-col gap-2 border-t border-oxblood pt-2">
          <div className="flex gap-1">
            {directionButton(
              'forward',
              `${a.name} → ${b.name}`,
              forward.trust,
            )}
            {directionButton(
              'backward',
              `${b.name} → ${a.name}`,
              backward.trust,
            )}
          </div>
          <p className="type-label">
            {direction === null ? '양쪽 동시 수정' : '한쪽만 수정'}
          </p>

          <KindChips
            value={edited.kind}
            disabled={false}
            onSelect={selectKind}
          />
          <TrustSlider
            value={edited.trust}
            disabled={false}
            onChange={(trust) => apply({ trust })}
          />
        </div>
      )}
    </li>
  );
}
