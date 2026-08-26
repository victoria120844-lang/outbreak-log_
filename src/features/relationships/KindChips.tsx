import { RELATIONSHIP_KINDS } from '@/data/relationships';
import type { RelationshipKind } from '@/types';

export interface KindChipsProps {
  value: RelationshipKind;
  disabled: boolean;
  onSelect: (kind: RelationshipKind) => void;
}

export default function KindChips({
  value,
  disabled,
  onSelect,
}: KindChipsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {RELATIONSHIP_KINDS.map((kind) => {
        const isSelected = kind === value;
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onSelect(kind)}
            className={`rounded border px-2 py-1 text-xs ${
              isSelected
                ? 'border-blood bg-ash-700 text-bone'
                : 'border-panel bg-ash-700 text-fog'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            {kind}
          </button>
        );
      })}
    </div>
  );
}
