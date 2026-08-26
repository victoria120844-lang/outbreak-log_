import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/types';

export const MS_PER_CHARACTER = 14;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface TypewriterState {
  /** Entries before this index are fully written. */
  revealed: number;
  /** Partial text for the entry at `revealed`, or null when nothing is typing. */
  typing: string | null;
}

/**
 * Reveals new entries one at a time, character by character, so a day arrives
 * as a sequence rather than a wall. History loaded from storage is never
 * retyped, and reduced motion skips the effect entirely.
 */
export const useTypewriter = (entries: readonly LogEntry[]): TypewriterState => {
  // Whatever was already on screen at mount counts as written.
  const [revealed, setRevealed] = useState(entries.length);
  const [typing, setTyping] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (revealed > entries.length) setRevealed(entries.length);
  }, [entries.length, revealed]);

  useEffect(() => {
    const next = entries[revealed];
    if (!next) {
      setTyping(null);
      return;
    }

    if (prefersReducedMotion()) {
      setTyping(null);
      setRevealed(entries.length);
      return;
    }

    let index = 0;
    setTyping('');

    const step = (): void => {
      index += 1;
      if (index >= next.message.length) {
        setTyping(null);
        setRevealed((current) => current + 1);
        return;
      }
      setTyping(next.message.slice(0, index));
      timer.current = window.setTimeout(step, MS_PER_CHARACTER);
    };

    timer.current = window.setTimeout(step, MS_PER_CHARACTER);

    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [entries, revealed]);

  return { revealed, typing };
};
