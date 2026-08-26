import { TRAITS, getTrait } from '@/data/traits';
import type { TraitId } from '@/types';

export const REQUIRED_TRAITS = 3;

export interface TraitPickerProps {
  selected: TraitId[];
  onChange: (next: TraitId[]) => void;
}

export default function TraitPicker({ selected, onChange }: TraitPickerProps) {
  const isFull = selected.length >= REQUIRED_TRAITS;

  const toggle = (id: TraitId): void => {
    if (selected.includes(id)) {
      onChange(selected.filter((traitId) => traitId !== id));
      return;
    }
    if (isFull) return;
    onChange([...selected, id]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label={`성격 키워드, ${REQUIRED_TRAITS}개 선택`}
        className="flex flex-wrap gap-1"
      >
        {TRAITS.map((trait) => {
          const isSelected = selected.includes(trait.id);
          const isLocked = isFull && !isSelected;
          return (
            <button
              key={trait.id}
              type="button"
              disabled={isLocked}
              aria-pressed={isSelected}
              onClick={() => toggle(trait.id)}
              className={`rounded border px-2 py-1 text-xs ${
                isSelected
                  ? 'border-blood bg-ash-700 text-bone'
                  : 'border-panel bg-ash-700 text-fog'
              } ${isLocked ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {trait.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {selected.map((id) => {
            const trait = getTrait(id);
            if (!trait) return null;
            return (
              <li key={id} className="text-xs leading-snug text-fog">
                <span className="text-bone">{trait.label}</span> — {trait.flavor}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
