import { MBTI_DESCRIPTIONS, isMbtiType } from '@/data/mbti';
import type { MbtiAxis, MbtiAxisState, MbtiType } from '@/types';

/**
 * One column per axis, two stacked letters each — a 4x2 grid that composes a
 * type string instead of offering 16 items in a dropdown.
 *
 * Each column carries its own typed updater so the state never needs a
 * computed key or a cast.
 */
const AXIS_COLUMNS: ReadonlyArray<{
  key: MbtiAxis;
  options: readonly [string, string];
  read: (state: MbtiAxisState) => string | null;
  apply: (state: MbtiAxisState, slot: 0 | 1) => MbtiAxisState;
}> = [
  {
    key: 'ei',
    options: ['E', 'I'],
    read: (state) => state.ei,
    apply: (state, slot) => ({ ...state, ei: slot === 0 ? 'E' : 'I' }),
  },
  {
    key: 'ns',
    options: ['N', 'S'],
    read: (state) => state.ns,
    apply: (state, slot) => ({ ...state, ns: slot === 0 ? 'N' : 'S' }),
  },
  {
    key: 'tf',
    options: ['T', 'F'],
    read: (state) => state.tf,
    apply: (state, slot) => ({ ...state, tf: slot === 0 ? 'T' : 'F' }),
  },
  {
    key: 'jp',
    options: ['J', 'P'],
    read: (state) => state.jp,
    apply: (state, slot) => ({ ...state, jp: slot === 0 ? 'J' : 'P' }),
  },
];

export const EMPTY_AXES: MbtiAxisState = {
  ei: null,
  ns: null,
  tf: null,
  jp: null,
};

/** Returns the composed type, or null while any axis is unset. */
export const composeMbti = (axes: MbtiAxisState): MbtiType | null => {
  const { ei, ns, tf, jp } = axes;
  if (ei === null || ns === null || tf === null || jp === null) return null;
  const code = `${ei}${ns}${tf}${jp}`;
  return isMbtiType(code) ? code : null;
};

export interface MbtiSelectorProps {
  value: MbtiAxisState;
  onChange: (next: MbtiAxisState) => void;
}

export default function MbtiSelector({ value, onChange }: MbtiSelectorProps) {
  const code = composeMbti(value);
  const preview = `${value.ei ?? '·'}${value.ns ?? '·'}${value.tf ?? '·'}${
    value.jp ?? '·'
  }`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1">
          {AXIS_COLUMNS.map((column) => {
            const current = column.read(value);
            return (
              <div
                key={column.key}
                role="group"
                aria-label={`${column.options[0]} 또는 ${column.options[1]}`}
                className="flex flex-col gap-1"
              >
                {column.options.map((letter, index) => {
                  const slot: 0 | 1 = index === 0 ? 0 : 1;
                  const isSelected = current === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onChange(column.apply(value, slot))}
                      className={`type-data rounded border py-1 text-center ${
                        isSelected
                          ? 'border-blood bg-ash-700 text-bone'
                          : 'border-panel bg-ash-800 text-fog'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <output
          className={`type-display shrink-0 text-xl tabular-nums ${
            code === null ? 'text-fog' : 'text-bone'
          }`}
        >
          {preview}
        </output>
      </div>

      {code !== null && (
        <p className="text-sm leading-snug text-fog">
          {MBTI_DESCRIPTIONS[code]}
        </p>
      )}
    </div>
  );
}
