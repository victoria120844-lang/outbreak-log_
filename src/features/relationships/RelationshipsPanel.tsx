import { useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import Panel from '@/components/Panel';
import { useStore } from '@/store';
import AddRelationship from './AddRelationship';
import RelationshipGraph from './RelationshipGraph';
import RelationshipRow from './RelationshipRow';
import { buildPairs } from './pairs';

const MIN_SURVIVORS = 2;

export default function RelationshipsPanel() {
  const survivors = useStore((state) => state.survivors);
  const relationships = useStore((state) => state.relationships);
  const [view, setView] = useState<'list' | 'graph'>('list');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const pairs = useMemo(
    () => buildPairs(survivors, relationships),
    [survivors, relationships],
  );
  const isReady = survivors.length >= MIN_SURVIVORS;

  return (
    <Panel
      eyebrow="02 / RELATIONS"
      title="관계 설정"
      counter={
        <span className="flex items-center gap-2">
          <span>{pairs.length}쌍</span>
          {isReady && (
            <button
              type="button"
              aria-pressed={view === 'graph'}
              onClick={() => setView(view === 'graph' ? 'list' : 'graph')}
              className={`type-label rounded border px-1.5 py-0.5 ${
                view === 'graph'
                  ? 'border-blood text-bone'
                  : 'border-panel text-fog'
              }`}
            >
              관계도
            </button>
          )}
        </span>
      }
    >
      {!isReady && (
        <EmptyState message="생존자가 2명 이상일 때 관계를 설정할 수 있습니다." />
      )}

      {/* 0fr -> 1fr animates the height. globals.css collapses the duration
          under prefers-reduced-motion, so this switches instantly there. */}
      <div
        className={`grid transition-[grid-template-rows] duration-[320ms] ease-out ${
          isReady ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3">
            <p className="type-data text-xs text-fog">
              새로운 관계를 정의할 수 있습니다.
            </p>

            {view === 'graph' ? (
              <RelationshipGraph survivors={survivors} pairs={pairs} />
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {pairs.map((pair) => (
                    <RelationshipRow
                      key={pair.key}
                      pair={pair}
                      isOpen={openKey === pair.key}
                      onToggle={() =>
                        setOpenKey(openKey === pair.key ? null : pair.key)
                      }
                    />
                  ))}
                </ul>
                <AddRelationship survivors={survivors} />
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
