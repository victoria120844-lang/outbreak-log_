import { useMemo, useState } from 'react';
import { formatDay } from '@/features/simulation';
import { useStore } from '@/store';

/**
 * The wall the group writes on. Everything here is already in the log, but a
 * hundred days of journal buries it — the point of a memorial is that you can
 * find it again.
 */
export default function MemorialButton() {
  const survivors = useStore((state) => state.survivors);
  const log = useStore((state) => state.log);
  const [isOpen, setIsOpen] = useState(false);

  const dead = useMemo(
    // Only the dead get a memorial. Somebody who has turned is still a
    // problem in the building, not yet a person to be remembered.
    () => survivors.filter((survivor) => survivor.status === '사망'),
    [survivors],
  );

  const wordsFor = useMemo(() => {
    const map = new Map<string, { speaker: string; message: string }[]>();
    log.forEach((entry) => {
      if (entry.memorialFor === undefined) return;
      const speaker = survivors.find(
        (survivor) => survivor.id === entry.speakerId,
      );
      const said = map.get(entry.memorialFor) ?? [];
      said.push({ speaker: speaker?.name ?? '누군가', message: entry.message });
      map.set(entry.memorialFor, said);
    });
    return map;
  }, [log, survivors]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={dead.length === 0}
        title="떠난 사람들에게 남긴 말"
        className={`type-label shrink-0 rounded border px-2 py-1 ${
          dead.length === 0
            ? 'cursor-not-allowed border-panel bg-ash-700 text-fog opacity-50'
            : 'border-panel bg-ash-700 text-fog hover:text-bone'
        }`}
      >
        추모 {dead.length > 0 ? dead.length : ''}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="추모"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--ash-900) 88%, transparent)',
            }}
          />

          <section className="panel scroll-thin relative flex max-h-[80vh] w-full max-w-lg flex-col gap-4 overflow-y-auto p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="type-display text-xl text-bone">추모</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="type-label text-fog hover:text-bone"
              >
                닫기
              </button>
            </div>

            <ul className="flex flex-col gap-5">
              {dead.map((survivor) => {
                const words = wordsFor.get(survivor.id) ?? [];
                return (
                  <li key={survivor.id} className="flex flex-col gap-2">
                    <div className="flex items-baseline gap-2 border-b border-oxblood pb-1">
                      <span className="type-display text-base text-blood-hot">
                        {survivor.name}
                      </span>
                      <span className="type-data text-xs text-fog">
                        {survivor.age}세
                      </span>
                      <span className="type-data ml-auto text-xs text-fog">
                        DAY {formatDay(survivor.joinedDay)} –{' '}
                        {survivor.diedDay === undefined
                          ? '???'
                          : formatDay(survivor.diedDay)}
                      </span>
                    </div>

                    {words.length === 0 ? (
                      <p className="text-sm text-fog">
                        아무도 아무 말도 하지 않았다.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {words.map((said, index) => (
                          <li key={`${survivor.id}-${index}`}>
                            <span className="type-data text-xs text-fog">
                              {said.speaker}
                            </span>
                            <span className="type-data text-sm leading-[1.7] text-bone">
                              {' '}
                              “{said.message}”
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
