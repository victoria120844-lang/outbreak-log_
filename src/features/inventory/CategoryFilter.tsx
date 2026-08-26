import { ITEM_CATEGORIES } from '@/data/items';
import type { ItemCategory } from '@/types';

export type CategoryFilterValue = ItemCategory | '전체';

export const CATEGORY_FILTERS: readonly CategoryFilterValue[] = [
  '전체',
  ...ITEM_CATEGORIES,
];

export interface CategoryFilterProps {
  value: CategoryFilterValue;
  counts: Record<CategoryFilterValue, number>;
  onChange: (next: CategoryFilterValue) => void;
}

export default function CategoryFilter({
  value,
  counts,
  onChange,
}: CategoryFilterProps) {
  return (
    <div role="group" aria-label="분류 필터" className="flex flex-wrap gap-1">
      {CATEGORY_FILTERS.map((category) => {
        const isActive = category === value;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(category)}
            className={`flex items-baseline gap-1.5 rounded border px-2 py-1 ${
              isActive
                ? 'border-blood bg-ash-700 text-bone'
                : 'border-panel bg-ash-700 text-fog'
            }`}
          >
            <span className="text-xs">{category}</span>
            <span className="type-data text-xs">{counts[category]}</span>
          </button>
        );
      })}
    </div>
  );
}
