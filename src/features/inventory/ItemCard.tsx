import { useState } from 'react';
import { isUsableOnSurvivor } from '@/data/items';
import type { Item, Survivor } from '@/types';

export interface ItemCardProps {
  item: Item;
  quantity: number;
  assignedTo: string | null;
  /** Only the living can carry anything. */
  assignableSurvivors: readonly Survivor[];
  assigneeName: string | null;
  isFlashing: boolean;
  /** Hand-editing the count is a dev-mode affordance, not a play action. */
  canEditQuantity: boolean;
  onChangeQuantity: (amount: number) => void;
  /** Spends one unit on the chosen survivor. */
  onUse: (survivorId: string) => void;
  onAssign: (survivorId: string | null) => void;
}

export default function ItemCard({
  item,
  quantity,
  assignedTo,
  assignableSurvivors,
  assigneeName,
  isFlashing,
  canEditQuantity,
  onChangeQuantity,
  onUse,
  onAssign,
}: ItemCardProps) {
  const [isChoosingTarget, setIsChoosingTarget] = useState(false);
  const isEmpty = quantity === 0;
  const canUse = isUsableOnSurvivor(item);

  return (
    <li
      className={`group flex flex-col gap-1 border p-2 ${
        isFlashing ? 'border-blood' : 'border-oxblood'
      } ${isEmpty ? 'opacity-30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="type-label">{item.category}</span>
          <span className="type-display truncate text-base text-bone">
            {item.name}
          </span>
        </div>
        <span className="type-data shrink-0 text-xl text-bone">{quantity}</span>
      </div>

      <p className="text-xs leading-snug text-fog">{item.flavor}</p>

      {assigneeName !== null && (
        <span className="type-data w-fit border border-panel px-1 text-[10px] text-fog">
          {assigneeName}
        </span>
      )}

      {/* Spending an item on someone is the main thing a player does between
          days, so it is a first-class control rather than a hover affordance. */}
      {canUse && !isEmpty && assignableSurvivors.length > 0 && (
        <div className="flex flex-col gap-1">
          {isChoosingTarget ? (
            <>
              <span className="type-label">누구에게?</span>
              <div className="flex flex-wrap gap-1">
                {assignableSurvivors.map((survivor) => (
                  <button
                    key={survivor.id}
                    type="button"
                    onClick={() => {
                      onUse(survivor.id);
                      setIsChoosingTarget(false);
                    }}
                    className="rounded border border-blood bg-ash-700 px-2 py-1 text-xs text-bone"
                  >
                    {survivor.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsChoosingTarget(false)}
                  className="type-label px-1 text-fog hover:text-bone"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsChoosingTarget(true)}
              className="type-label w-full rounded border border-panel bg-ash-700 py-1.5 text-fog hover:border-blood hover:text-bone"
            >
              사용
            </button>
          )}
        </div>
      )}

      {/* Controls stay visible on touch, and reveal on hover/focus at md+. */}
      <div className="mt-auto flex items-center gap-1 pt-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        {canEditQuantity && (
          <>
            <button
              type="button"
              onClick={() => onChangeQuantity(-1)}
              disabled={isEmpty}
              aria-label={`${item.name} 하나 줄이기`}
              className={`type-data h-6 w-6 rounded border border-panel bg-ash-700 ${
                isEmpty ? 'cursor-not-allowed text-fog' : 'text-bone'
              }`}
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onChangeQuantity(1)}
              aria-label={`${item.name} 하나 늘리기`}
              className="type-data h-6 w-6 rounded border border-panel bg-ash-700 text-bone"
            >
              +
            </button>
          </>
        )}

        <select
          value={assignedTo ?? ''}
          aria-label={`${item.name} 담당자`}
          onChange={(event) =>
            onAssign(event.target.value === '' ? null : event.target.value)
          }
          className="min-w-0 flex-1 rounded border border-panel bg-ash-700 px-1 py-0.5 text-[10px] text-fog"
        >
          <option value="">공용</option>
          {assignableSurvivors.map((survivor) => (
            <option key={survivor.id} value={survivor.id}>
              {survivor.name}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}
