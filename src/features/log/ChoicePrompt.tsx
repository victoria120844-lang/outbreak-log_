import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

/**
 * A decision stops the whole run, so it takes the whole screen. Options show
 * their odds up front — a blind pick is a coin toss, and a coin toss is not a
 * decision.
 */
export default function ChoicePrompt() {
  const pending = useStore((state) => state.sim.pendingChoice);
  const chooseOption = useStore((state) => state.chooseOption);
  const firstOption = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pending !== null) firstOption.current?.focus();
  }, [pending]);

  if (pending === null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="선택"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Scrim: the run is halted, and the panels should read as halted too. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--ash-900) 82%, transparent)',
        }}
      />

      <section className="panel relative flex w-full max-w-xl flex-col gap-4 border-blood p-6">
        <span className="type-label text-bone">선택</span>

        <p className="type-data text-base leading-[1.8] text-bone">
          {pending.prompt}
        </p>

        <ul className="flex flex-col gap-2">
          {pending.options.map((option, index) => (
            <li key={option.id}>
              <button
                ref={index === 0 ? firstOption : undefined}
                type="button"
                onClick={() => chooseOption(option.id)}
                className="flex w-full items-center justify-between gap-4 rounded border border-panel bg-ash-700 px-4 py-3 text-left hover:border-blood"
              >
                <span className="min-w-0 text-base text-bone">
                  {option.label}
                </span>
                <span className="type-data shrink-0 text-sm text-fog">
                  {option.abilityLabel === null
                    ? '확정'
                    : `${option.abilityLabel} ${Math.round(option.chance * 100)}%`}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="type-data text-[10px] text-fog">
          고르기 전에는 다음 날로 넘어가지 않습니다.
        </p>
      </section>
    </div>
  );
}
