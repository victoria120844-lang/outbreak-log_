import { mulberry32 } from '@/features/simulation';

/**
 * Cracks in a 0-100 square that the SVG scales to cover the viewport.
 *
 * Every crack is a filled polygon, not a stroke. A stroke has one width for
 * its whole length; a real fracture is a wedge — wide where it was struck and
 * a point where it ran out of energy. That wedge is what gives the pattern
 * depth, so the geometry has to carry it.
 *
 * Generated once from a fixed seed, so the opening looks the same every time.
 */

export const IMPACT = { x: 50, y: 46 };
const SEED = 20260901;
const MAIN_CRACKS = 15;

export interface Crack {
  /** Polygon outline, ready for `points`. */
  points: string;
  opacity: number;
  /** Stagger in ms after the impact. */
  delay: number;
}

interface Point {
  x: number;
  y: number;
}

const toPoints = (points: readonly Point[]): string =>
  points
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ');

/**
 * Walks outward in mostly-straight runs with the occasional sharp turn. Glass
 * does not curve — it goes straight until something deflects it.
 */
const walk = (
  random: () => number,
  from: Point,
  angle: number,
  reach: number,
  steps: number,
): Point[] => {
  const spine: Point[] = [from];
  let heading = angle;
  let current = from;

  for (let step = 1; step <= steps; step += 1) {
    // Mostly straight, but every few segments it kinks hard.
    heading += random() < 0.3 ? (random() - 0.5) * 0.7 : (random() - 0.5) * 0.12;
    const segment = (reach / steps) * (0.7 + random() * 0.7);
    current = {
      x: current.x + Math.cos(heading) * segment,
      y: current.y + Math.sin(heading) * segment,
    };
    spine.push(current);
  }

  return spine;
};

/**
 * Turns a spine into a wedge: `width` at the root, nothing at the tip. The
 * outline runs down one side and back up the other.
 */
const ribbon = (
  spine: readonly Point[],
  width: number,
  power = 1.7,
): Point[] => {
  const left: Point[] = [];
  const right: Point[] = [];
  const last = spine.length - 1;

  spine.forEach((point, index) => {
    const previous = spine[Math.max(0, index - 1)] ?? point;
    const next = spine[Math.min(last, index + 1)] ?? point;
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    // Perpendicular to the direction of travel.
    const nx = -dy / length;
    const ny = dx / length;
    const half = (width / 2) * (1 - index / last) ** power;

    left.push({ x: point.x + nx * half, y: point.y + ny * half });
    right.push({ x: point.x - nx * half, y: point.y - ny * half });
  });

  return [...left, ...right.reverse()];
};

export const buildCracks = (): Crack[] => {
  const random = mulberry32(SEED);
  const cracks: Crack[] = [];
  const angles: number[] = [];

  for (let index = 0; index < MAIN_CRACKS; index += 1) {
    const angle = (index / MAIN_CRACKS) * Math.PI * 2 + (random() - 0.5) * 0.42;
    const reach = 36 + random() * 48;
    const spine = walk(random, IMPACT, angle, reach, 7);
    angles.push(angle);

    cracks.push({
      points: toPoints(ribbon(spine, 1.5 + random() * 1.9)),
      opacity: 0.82 + random() * 0.18,
      delay: Math.round(random() * 70),
    });

    // Forks. In the reference these split off close to the centre and taper
    // just as hard as the parent.
    const forks = random() < 0.65 ? 2 : 1;
    for (let fork = 0; fork < forks; fork += 1) {
      const at = 2 + Math.floor(random() * 3);
      const anchor = spine[at];
      if (!anchor) continue;

      const side = random() < 0.5 ? -1 : 1;
      const branch = walk(
        random,
        anchor,
        angle + side * (0.35 + random() * 0.55),
        14 + random() * 26,
        5,
      );

      cracks.push({
        points: toPoints(ribbon(branch, 0.5 + random() * 0.9)),
        opacity: 0.6 + random() * 0.3,
        delay: 50 + Math.round(random() * 110),
      });
    }
  }

  // Straight chords between neighbouring radials — angular, never arcs. This
  // is what closes the pattern into shards instead of a starburst.
  const sorted = [...angles].sort((left, right) => left - right);
  [8, 14, 21, 30].forEach((radius, ring) => {
    sorted.forEach((angle, index) => {
      const next = sorted[(index + 1) % sorted.length];
      if (next === undefined) return;
      if (random() < 0.3) return;

      const at = (a: number, r: number): Point => ({
        x: IMPACT.x + Math.cos(a) * r * (0.88 + random() * 0.24),
        y: IMPACT.y + Math.sin(a) * r * (0.88 + random() * 0.24),
      });

      // Two straight runs with one kink, so the chord reads as snapped glass.
      const start = at(angle, radius);
      const end = at(next, radius);
      const middle = {
        x: (start.x + end.x) / 2 + (random() - 0.5) * radius * 0.22,
        y: (start.y + end.y) / 2 + (random() - 0.5) * radius * 0.22,
      };

      // Chords taper from both ends, so build them symmetrically.
      const width = 0.5 + random() * 0.7;
      const spine = [start, middle, end];
      const shape = [
        ...ribbon(spine, width, 0.9).slice(0, spine.length),
        ...ribbon([...spine].reverse(), width, 0.9).slice(0, spine.length),
      ];

      cracks.push({
        points: toPoints(shape),
        opacity: 0.5 + random() * 0.3,
        delay: 40 + ring * 40 + Math.round(random() * 50),
      });
    });
  });

  return cracks;
};

/**
 * The impact itself: a ragged mass where the glass gave up entirely. In the
 * reference this is the heaviest shape on the page, and everything else reads
 * as radiating from it.
 */
export const buildCore = (): string => {
  const random = mulberry32(SEED + 3);
  const spikes = 11;
  const points: Point[] = [];

  for (let index = 0; index < spikes * 2; index += 1) {
    const angle = (index / (spikes * 2)) * Math.PI * 2;
    // Alternating long and short gives the star its bite.
    const radius =
      index % 2 === 0 ? 3.4 + random() * 3.2 : 1.1 + random() * 1.1;
    points.push({
      x: IMPACT.x + Math.cos(angle) * radius,
      y: IMPACT.y + Math.sin(angle) * radius,
    });
  }

  return toPoints(points);
};

/*
 * No loose debris here on purpose. Free-floating chips rendered as little
 * arrowheads and read as symbols rather than glass, and the reference has
 * nothing like them — every mark in it connects back to the impact.
 */
