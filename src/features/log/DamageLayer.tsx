/**
 * Pre-authored spatter, confined to 32px strips along the panel edges so it can
 * never sit under a line of text. Strips fade in as the run goes wrong.
 */

const MAX_OPACITY = 0.22;

const SPATTER: Record<string, string> = {
  top: 'M6 9 q4-7 9-4 t7 2 q3-5 8-2 t6 4 q5-6 9-1 M34 8 q3-6 7-3 t4 5 M58 10 q5-8 10-3 t8 4 q4-5 8 0 M78 7 q4-6 8-2 t6 5 q3-4 6-1',
  bottom:
    'M4 2 q5 7 10 3 t8-3 q4 6 9 2 M30 4 q4 6 8 1 t5-4 M52 2 q6 8 11 3 t7-4 q5 5 9 1 M80 5 q4 5 8 0 t6-3',
  left: 'M9 6 q-7 4-4 9 t2 7 q-5 3-2 8 t4 6 q-6 5-1 9 M8 34 q-6 3-3 7 t5 4 M10 58 q-8 5-3 10 t4 8 q-5 4 0 8 M7 78 q-6 4-2 8 t5 6',
  right:
    'M2 4 q7 5 3 10 t-3 8 q6 4 2 9 M4 30 q6 4 1 8 t-4 5 M2 52 q8 6 3 11 t-4 7 q5 5 1 9 M5 80 q5 4 0 8 t-3 6',
};

const STRIP_THRESHOLD: Record<string, number> = {
  top: 0,
  right: 0.2,
  bottom: 0.45,
  left: 0.7,
};

const opacityFor = (damage: number, threshold: number): number => {
  const ramp = Math.min(1, Math.max(0, (damage - threshold) / 0.3));
  return ramp * MAX_OPACITY;
};

export interface DamageLayerProps {
  damage: number;
}

export default function DamageLayer({ damage }: DamageLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <svg
        className="absolute inset-x-0 top-0 h-8 w-full"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={SPATTER['top']}
          fill="var(--oxblood)"
          opacity={opacityFor(damage, STRIP_THRESHOLD['top'] ?? 0)}
        />
      </svg>

      <svg
        className="absolute inset-x-0 bottom-0 h-8 w-full"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={SPATTER['bottom']}
          fill="var(--oxblood)"
          opacity={opacityFor(damage, STRIP_THRESHOLD['bottom'] ?? 0)}
        />
      </svg>

      <svg
        className="absolute inset-y-0 left-0 h-full w-8"
        viewBox="0 0 12 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={SPATTER['left']}
          fill="var(--oxblood)"
          opacity={opacityFor(damage, STRIP_THRESHOLD['left'] ?? 0)}
        />
      </svg>

      <svg
        className="absolute inset-y-0 right-0 h-full w-8"
        viewBox="0 0 12 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={SPATTER['right']}
          fill="var(--oxblood)"
          opacity={opacityFor(damage, STRIP_THRESHOLD['right'] ?? 0)}
        />
      </svg>
    </div>
  );
}
