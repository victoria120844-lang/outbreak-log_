import { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import Panel from '@/components/Panel';
import { ITEMS } from '@/data/items';
import { useStore } from '@/store';
import CategoryFilter, { type CategoryFilterValue } from './CategoryFilter';
import ItemCard from './ItemCard';
import SupplyControls from './SupplyControls';
import SupplySummary from './SupplySummary';
import {
  assignmentOf,
  countByCategory,
  quantityOf,
  summarize,
} from './supply';

const FLASH_MS = 600;

export default function InventoryPanel() {
  const inventory = useStore((state) => state.inventory);
  const survivors = useStore((state) => state.survivors);
  const changeQuantity = useStore((state) => state.changeQuantity);
  const addItems = useStore((state) => state.addItems);
  const assignItem = useStore((state) => state.assignItem);
  const useItemOn = useStore((state) => state.useItemOn);
  const devMode = useStore((state) => state.devMode);

  const [category, setCategory] = useState<CategoryFilterValue>('전체');
  const [heldOnly, setHeldOnly] = useState(false);
  const [flashIds, setFlashIds] = useState<readonly string[]>([]);
  const flashTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const living = useMemo(
    () => survivors.filter((survivor) => survivor.alive),
    [survivors],
  );
  const summary = useMemo(
    () => summarize(inventory, living.length),
    [inventory, living.length],
  );
  const counts = useMemo(() => countByCategory(inventory), [inventory]);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    survivors.forEach((survivor) => map.set(survivor.id, survivor.name));
    return map;
  }, [survivors]);

  const visibleItems = useMemo(
    () =>
      ITEMS.filter((item) => {
        if (category !== '전체' && item.category !== category) return false;
        if (heldOnly && quantityOf(inventory, item.id) === 0) return false;
        return true;
      }),
    [category, heldOnly, inventory],
  );

  const handleAdd = (
    additions: ReadonlyArray<{ itemId: string; quantity: number }>,
  ): void => {
    if (additions.length === 0) return;
    addItems(additions);

    setFlashIds(additions.map((addition) => addition.itemId));
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashIds([]), FLASH_MS);
  };

  return (
    <Panel
      eyebrow="03 / SUPPLIES"
      title="보급품"
      counter={`${inventory.length}종`}
      tone={summary.isCritical ? 'critical' : 'default'}
    >
      <div className="flex min-h-full flex-col gap-3">
        {devMode && <SupplyControls onAdd={handleAdd} />}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <CategoryFilter
            value={category}
            counts={counts}
            onChange={setCategory}
          />
          <button
            type="button"
            aria-pressed={heldOnly}
            onClick={() => setHeldOnly(!heldOnly)}
            className={`type-label rounded border px-2 py-1 ${
              heldOnly ? 'border-blood text-bone' : 'border-panel text-fog'
            }`}
          >
            보유 항목만
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <EmptyState message="보급품이 없습니다. 이 상태로는 사흘을 넘기기 어렵습니다." />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {visibleItems.map((item) => {
              const assignedTo = assignmentOf(inventory, item.id);
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantity={quantityOf(inventory, item.id)}
                  assignedTo={assignedTo}
                  assignableSurvivors={living}
                  assigneeName={
                    assignedTo === null
                      ? null
                      : (nameById.get(assignedTo) ?? null)
                  }
                  isFlashing={flashIds.includes(item.id)}
                  canEditQuantity={devMode}
                  onChangeQuantity={(amount) => changeQuantity(item.id, amount)}
                  onUse={(survivorId) => useItemOn(item.id, survivorId)}
                  onAssign={(survivorId) => assignItem(item.id, survivorId)}
                />
              );
            })}
          </ul>
        )}

        <SupplySummary summary={summary} />
      </div>
    </Panel>
  );
}
