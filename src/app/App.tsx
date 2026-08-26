import { useState } from 'react';
import ShatterIntro from '@/components/ShatterIntro';
import ChoicePrompt from '@/features/log/ChoicePrompt';
import MobileTabBar, { type MobileTab } from '@/components/MobileTabBar';
import TopBar from '@/components/TopBar';
import InventoryPanel from '@/features/inventory/InventoryPanel';
import LogPanel from '@/features/log/LogPanel';
import RelationshipsPanel from '@/features/relationships/RelationshipsPanel';
import SurvivorsPanel from '@/features/survivors/SurvivorsPanel';

/**
 * App shell.
 *
 * Breakpoints match Tailwind defaults: mobile < 768, tablet 768-1279 (`md`),
 * desktop >= 1280 (`xl`).
 *
 * Desktop uses three columns. The center/right wrapper becomes `display:
 * contents` at `xl`, so inventory and log promote to sibling grid columns
 * while staying stacked in one column at tablet width.
 *
 * The shell itself never scrolls; each panel body scrolls on its own.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState<MobileTab>('survivors');
  const isSurvivorsTab = activeTab === 'survivors';

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-4">
      <TopBar />

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 gap-2 md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(380px,1fr)_420px]">
        {/* Left column: survivors over relationships, at every width. */}
        <div
          className={`min-h-0 flex-col gap-2 md:flex ${
            isSurvivorsTab ? 'flex' : 'hidden'
          }`}
        >
          <div className="min-h-0 flex-1">
            <SurvivorsPanel />
          </div>
          <div className="min-h-0 flex-1">
            <RelationshipsPanel />
          </div>
        </div>

        {/* Second column at tablet; splits into columns 2 and 3 at desktop. */}
        <div
          className={`min-h-0 flex-col gap-2 md:flex xl:contents ${
            isSurvivorsTab ? 'hidden' : 'flex'
          }`}
        >
          <div
            className={`min-h-0 flex-1 md:block ${
              activeTab === 'inventory' ? 'block' : 'hidden'
            }`}
          >
            <InventoryPanel />
          </div>
          <div
            className={`min-h-0 flex-1 md:block ${
              activeTab === 'log' ? 'block' : 'hidden'
            }`}
          >
            <LogPanel />
          </div>
        </div>
      </div>

      <MobileTabBar
        active={activeTab}
        onChange={setActiveTab}
        className="md:hidden"
      />

      {/* Halts the run, so it sits above every panel. */}
      <ChoicePrompt />

      {/* Mounted last: the app underneath is already live and interactive. */}
      <ShatterIntro />
    </div>
  );
}
