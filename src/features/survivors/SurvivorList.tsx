import { useEffect, useMemo, useRef } from 'react';
import EmptyState from '@/components/EmptyState';
import {
  LOVER_THRESHOLD,
  MARRIAGE_THRESHOLD,
  BREAKUP_TRUST,
} from '@/data/relationships';
import { useStore } from '@/store';
import SurvivorCard from './SurvivorCard';

export interface SurvivorListProps {
  /** Newest registration; the list scrolls to it once. */
  focusId: string | null;
}

export default function SurvivorList({ focusId }: SurvivorListProps) {
  const survivors = useStore((state) => state.survivors);
  const removeSurvivor = useStore((state) => state.removeSurvivor);
  const phase = useStore((state) => state.sim.phase);
  const day = useStore((state) => state.sim.day);
  const hoveredSurvivorId = useStore((state) => state.hoveredSurvivorId);
  const relationships = useStore((state) => state.relationships);
  const listRef = useRef<HTMLUListElement>(null);

  /**
   * The one relationship worth surfacing on a card. A person has at most one
   * romance, but they can have several exes, so the strongest feeling wins and
   * ties break on the partner's name to keep the render stable.
   */
  const bonds = useMemo(() => {
    const byName = new Map(
      survivors.map((survivor) => [survivor.id, survivor.name]),
    );
    const result = new Map<string, { label: string; name: string }>();

    const ranked = relationships
      .filter((relationship) => {
        if (!byName.has(relationship.toId)) return false;
        if (relationship.kind === '연인') return relationship.trust >= LOVER_THRESHOLD;
        if (relationship.kind === '원한') return relationship.trust <= BREAKUP_TRUST;
        return false;
      })
      .sort(
        (left, right) =>
          Math.abs(right.trust) - Math.abs(left.trust) ||
          left.toId.localeCompare(right.toId),
      );

    ranked.forEach((relationship) => {
      if (result.has(relationship.fromId)) return;
      const name = byName.get(relationship.toId);
      if (name === undefined) return;
      result.set(relationship.fromId, {
        label:
          relationship.kind === '원한'
            ? '헤어짐'
            : relationship.trust >= MARRIAGE_THRESHOLD
              ? '배우자'
              : '연인',
        name,
      });
    });

    return result;
  }, [relationships, survivors]);

  useEffect(() => {
    if (focusId === null) return;
    const card = listRef.current?.querySelector(
      `[data-survivor-id="${focusId}"]`,
    );
    if (!(card instanceof HTMLElement)) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    card.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [focusId]);

  if (survivors.length === 0) {
    return (
      <EmptyState message="아직 아무도 등록되지 않았습니다. 첫 생존자를 추가하세요." />
    );
  }

  return (
    <ul ref={listRef} className="flex flex-col gap-2">
      {survivors.map((survivor) => (
        <SurvivorCard
          key={survivor.id}
          survivor={survivor}
          day={day}
          canRemove={phase === 'setup'}
          isHighlighted={survivor.id === hoveredSurvivorId}
          bond={bonds.get(survivor.id) ?? null}
          parents={(survivor.parentIds ?? [])
            .map((id) => survivors.find((person) => person.id === id)?.name)
            .filter((name): name is string => name !== undefined)}
          onRemove={removeSurvivor}
        />
      ))}
    </ul>
  );
}
