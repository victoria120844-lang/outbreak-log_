import type { ReactNode } from 'react';
import { STAT_LABELS } from '@/data/stats';
import { useStore } from '@/store';
import type { LogEntry, StatChange, Survivor } from '@/types';
import { ACCENT_BORDER, accentOf } from './damage';

const escapeForRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface LogEntryRowProps {
  entry: LogEntry;
  time: string;
  survivors: readonly Survivor[];
  /** Partial text while the entry is still being typed. */
  partialText: string | null;
}

export default function LogEntryRow({
  entry,
  time,
  survivors,
  partialText,
}: LogEntryRowProps) {
  const setHoveredSurvivor = useStore((state) => state.setHoveredSurvivor);
  const accent = accentOf(entry, survivors);
  const isDeath = entry.severity === 'death';
  const text = partialText ?? entry.message;

  const speaker =
    entry.speakerId === undefined
      ? null
      : (survivors.find((survivor) => survivor.id === entry.speakerId) ?? null);

  const named = entry.actorIds
    .map((id) => survivors.find((survivor) => survivor.id === id))
    .filter((survivor): survivor is Survivor => survivor !== undefined)
    // Longest first so a name that contains another still matches whole.
    .sort((left, right) => right.name.length - left.name.length);

  const renderText = (): ReactNode => {
    if (named.length === 0) return text;

    const pattern = new RegExp(
      `(${named.map((survivor) => escapeForRegex(survivor.name)).join('|')})`,
      'g',
    );

    return text.split(pattern).map((piece, index) => {
      const survivor = named.find((candidate) => candidate.name === piece);
      if (!survivor) return piece;

      return (
        <span
          key={`${entry.id}-${index}`}
          onMouseEnter={() => setHoveredSurvivor(survivor.id)}
          onMouseLeave={() => setHoveredSurvivor(null)}
          className={`cursor-default underline decoration-dotted underline-offset-2 ${
            isDeath ? 'text-blood-hot' : 'text-bone'
          }`}
        >
          {piece}
        </span>
      );
    });
  };

  /**
   * What the line cost, in numbers. Playtesting kept asking why a bar had
   * dropped — the answer was always the sentence above it, but never in the
   * sentence itself. Grouped by person so one row reads as one person's day.
   */
  const renderChanges = (): ReactNode => {
    const changes = entry.changes ?? [];
    if (changes.length === 0 || partialText !== null) return null;

    const byPerson = new Map<string, StatChange[]>();
    changes.forEach((change) => {
      const existing = byPerson.get(change.survivorId) ?? [];
      existing.push(change);
      byPerson.set(change.survivorId, existing);
    });

    return (
      <p className="type-data mt-0.5 flex flex-wrap gap-x-3 text-xs text-fog">
        {[...byPerson.entries()].map(([survivorId, list]) => {
          const who = survivors.find((person) => person.id === survivorId);
          if (!who) return null;

          return (
            <span key={`${entry.id}-${survivorId}`} className="whitespace-nowrap">
              {who.name}
              {list.map((change) => (
                <span key={change.key}>
                  {' '}
                  {STAT_LABELS[change.key]}{' '}
                  <span
                    className={change.delta < 0 ? 'text-blood-hot' : 'text-bone'}
                  >
                    {change.delta > 0 ? `+${change.delta}` : change.delta}
                  </span>
                </span>
              ))}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <li style={isDeath ? { marginTop: 4, marginBottom: 4 } : undefined}>
      {isDeath && (
        <p className="type-display pl-3 text-sm tracking-label text-blood-hot">
          손실
        </p>
      )}
      <div
        className="flex gap-2 border-l-2 pl-2"
        style={{ borderLeftColor: ACCENT_BORDER[accent] }}
      >
        {/* The log is the thing people actually read for a hundred days, so it
            sits a step up the scale from the stat readouts: 15px body, 11px
            timestamp. At 13px on this background it was reported unreadable. */}
        <span className="type-data shrink-0 pt-1 text-xs text-fog">
          {speaker === null ? time : ''}
        </span>

        {speaker === null ? (
          <p className="type-data min-w-0 flex-1 text-base leading-[1.75] text-bone">
            {renderText()}
            {partialText !== null && (
              <span className="text-fog" aria-hidden="true">
                ▌
              </span>
            )}
            {renderChanges()}
          </p>
        ) : (
          // Speech, not narration: indented, quoted, with the speaker named.
          <p className="min-w-0 flex-1 pl-3 leading-[1.75]">
            <span
              onMouseEnter={() => setHoveredSurvivor(speaker.id)}
              onMouseLeave={() => setHoveredSurvivor(null)}
              className="type-data cursor-default text-sm text-fog underline decoration-dotted underline-offset-2"
            >
              {speaker.name}
            </span>
            <span className="type-data text-base text-bone"> “{text}”</span>
            {partialText !== null && (
              <span className="type-data text-base text-fog" aria-hidden="true">
                ▌
              </span>
            )}
          </p>
        )}
      </div>
    </li>
  );
}
