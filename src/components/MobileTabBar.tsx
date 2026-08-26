export type MobileTab = 'survivors' | 'inventory' | 'log';

const TABS: ReadonlyArray<{ id: MobileTab; label: string }> = [
  { id: 'survivors', label: '생존자' },
  { id: 'inventory', label: '보급품' },
  { id: 'log', label: '일지' },
];

export interface MobileTabBarProps {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
  className?: string;
}

export default function MobileTabBar({
  active,
  onChange,
  className = '',
}: MobileTabBarProps) {
  return (
    <nav
      role="tablist"
      aria-label="화면 전환"
      className={`flex shrink-0 border border-panel bg-ash-800 ${className}`}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`type-display flex-1 border-t-2 py-3 text-xs tracking-label ${
              isActive
                ? 'border-t-blood bg-ash-700 text-bone'
                : 'border-t-transparent text-fog'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
