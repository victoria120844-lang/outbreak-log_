import { useState } from 'react';
import { ITEMS } from '@/data/items';
import { rollSupply } from './supply';

const MAX_MANUAL_QUANTITY = 99;

export interface SupplyControlsProps {
  onAdd: (additions: ReadonlyArray<{ itemId: string; quantity: number }>) => void;
}

export default function SupplyControls({ onAdd }: SupplyControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const canSubmit = itemId !== '' && quantity >= 1;

  const submit = (): void => {
    if (!canSubmit) return;
    onAdd([{ itemId, quantity }]);
    setItemId('');
    setQuantity(1);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="type-label flex-1 rounded border border-panel bg-ash-700 py-2 text-fog hover:text-bone"
        >
          보급품 추가
        </button>
        <button
          type="button"
          onClick={() => onAdd(rollSupply())}
          className="type-label flex-1 rounded bg-blood py-2 text-bone"
        >
          무작위 보급
        </button>
      </div>

      {isOpen && (
        <div className="flex items-center gap-1 border border-oxblood p-2">
          <select
            value={itemId}
            aria-label="추가할 보급품"
            onChange={(event) => setItemId(event.target.value)}
            className="min-w-0 flex-1 rounded border border-panel bg-ash-700 px-2 py-1.5 text-sm text-bone"
          >
            <option value="">품목 선택</option>
            {ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {item.effect}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            max={MAX_MANUAL_QUANTITY}
            value={quantity}
            aria-label="수량"
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(
                Number.isFinite(next)
                  ? Math.min(MAX_MANUAL_QUANTITY, Math.max(1, Math.floor(next)))
                  : 1,
              );
            }}
            className="type-data w-14 shrink-0 rounded border border-panel bg-ash-700 px-2 py-1.5 text-bone"
          />

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={`type-label shrink-0 rounded px-3 py-2 ${
              canSubmit
                ? 'bg-blood text-bone'
                : 'cursor-not-allowed bg-ash-700 text-fog'
            }`}
          >
            추가
          </button>
        </div>
      )}
    </div>
  );
}
