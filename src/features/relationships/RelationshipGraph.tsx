import type { Survivor } from '@/types';
import type { RelationshipPair } from './pairs';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 100;
const NODE_RADIUS = 14;

/** |trust| 0-100 maps to a 0.5-4px stroke. */
const strokeWidth = (trust: number): number =>
  0.5 + (Math.min(100, Math.abs(trust)) / 100) * 3.5;

const strokeColor = (trust: number): string =>
  trust < 0 ? 'var(--blood)' : 'var(--bone)';

interface Point {
  x: number;
  y: number;
}

const placeNodes = (count: number): Point[] =>
  Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  });

const firstCharacter = (name: string): string => Array.from(name)[0] ?? '?';

export interface RelationshipGraphProps {
  survivors: readonly Survivor[];
  pairs: readonly RelationshipPair[];
}

/**
 * No force layout: survivors sit on a circle in registration order. Each pair
 * is drawn as two segments meeting at the midpoint, so an asymmetric pair
 * reads as one thick half and one thin half.
 */
export default function RelationshipGraph({
  survivors,
  pairs,
}: RelationshipGraphProps) {
  const points = placeNodes(survivors.length);
  const positionOf = new Map<string, Point>();
  survivors.forEach((survivor, index) => {
    const point = points[index];
    if (point) positionOf.set(survivor.id, point);
  });

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-auto w-full"
      role="img"
      aria-label="생존자 관계도"
    >
      {pairs.map((pair) => {
        const from = positionOf.get(pair.a.id);
        const to = positionOf.get(pair.b.id);
        if (!from || !to) return null;

        const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
        const dimmed = pair.isClosed ? 0.35 : 1;

        return (
          <g key={pair.key} opacity={dimmed}>
            <line
              x1={from.x}
              y1={from.y}
              x2={middle.x}
              y2={middle.y}
              stroke={strokeColor(pair.forward.trust)}
              strokeWidth={strokeWidth(pair.forward.trust)}
            />
            <line
              x1={middle.x}
              y1={middle.y}
              x2={to.x}
              y2={to.y}
              stroke={strokeColor(pair.backward.trust)}
              strokeWidth={strokeWidth(pair.backward.trust)}
            />
          </g>
        );
      })}

      {survivors.map((survivor) => {
        const point = positionOf.get(survivor.id);
        if (!point) return null;
        return (
          <g key={survivor.id} opacity={survivor.alive ? 1 : 0.35}>
            <circle
              cx={point.x}
              cy={point.y}
              r={NODE_RADIUS}
              fill="var(--ash-700)"
              stroke="var(--panel-border)"
            />
            <text
              x={point.x}
              y={point.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="type-display"
              fontSize="13"
              fill="var(--bone)"
            >
              {firstCharacter(survivor.name)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
