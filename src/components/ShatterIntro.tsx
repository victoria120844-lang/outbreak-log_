import { useEffect, useState, type AnimationEvent, type CSSProperties } from 'react';
import { IMPACT, buildCore, buildCracks } from './shatterCracks';

const SESSION_KEY = 'outbreak-log:intro-played';
const EASING = 'cubic-bezier(.22,.61,.36,1)';

const EXIT_ANIMATION = 'intro-exit';
const REDUCED_ANIMATION = 'intro-reduced';

/** The wordmark holds alone until this, then the glass goes. */
export const IMPACT_AT = 3000;
export const DRAW_DURATION = 420;
const FLASH_DURATION = 220;
const SHAKE_DURATION = 460;
const EXIT_DELAY = 4000;
const EXIT_DURATION = 1000;

const CRACKS = buildCracks();
const CORE = buildCore();

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Plays once per session. `?intro=1` forces it back for development, and a new
 * visit gets it again because sessionStorage does not outlive the tab.
 */
export const shouldPlayIntro = (
  search: string,
  played: string | null,
): boolean =>
  new URLSearchParams(search).get('intro') === '1' || played === null;

const shouldPlay = (): boolean => {
  try {
    return shouldPlayIntro(
      window.location.search,
      window.sessionStorage.getItem(SESSION_KEY),
    );
  } catch {
    return true;
  }
};

const markPlayed = (): void => {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // Nothing to do; the intro simply plays again next time.
  }
};

/** The name field is the first thing anyone needs after the intro. */
const focusFirstInput = (): void => {
  const input = document.querySelector<HTMLInputElement>(
    'form input:not([type="number"]):not([type="range"])',
  );
  input?.focus();
};

/** Everything grows out of the impact, so they all share one origin. */
const GROW_FROM: CSSProperties = {
  transformBox: 'view-box',
  transformOrigin: `${IMPACT.x}px ${IMPACT.y}px`,
};

export default function ShatterIntro() {
  const [isPlaying, setIsPlaying] = useState(shouldPlay);
  const [reduced] = useState(() => prefersReducedMotion());

  const dismiss = (): void => {
    setIsPlaying(false);
    markPlayed();
    focusFirstInput();
  };

  useEffect(() => {
    if (!isPlaying) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!isPlaying) return null;

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) return;
    if (
      event.animationName !== EXIT_ANIMATION &&
      event.animationName !== REDUCED_ANIMATION
    ) {
      return;
    }
    dismiss();
  };

  const overlayStyle: CSSProperties = reduced
    ? { animation: `${REDUCED_ANIMATION} 700ms linear forwards` }
    : {
        animation: `${EXIT_ANIMATION} ${EXIT_DURATION}ms ${EASING} ${EXIT_DELAY}ms forwards`,
      };

  return (
    <div
      onAnimationEnd={handleAnimationEnd}
      role="presentation"
      style={overlayStyle}
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {/* The same layered ground the page already stands on. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'var(--ash-900)',
          backgroundImage:
            'radial-gradient(120% 70% at 50% -8%, color-mix(in srgb, var(--oxblood) 18%, transparent) 0%, transparent 68%), linear-gradient(180deg, var(--ash-900) 0%, var(--page-bottom) 100%)',
        }}
      />

      {/* Everything the impact moves lives inside the shake. */}
      <div
        className="absolute inset-0"
        style={{
          animation: reduced
            ? undefined
            : `shatter-shake ${SHAKE_DURATION}ms linear ${IMPACT_AT}ms both`,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: reduced
              ? undefined
              : `intro-wordmark-in 600ms ${EASING} both`,
          }}
        >
          <span className="type-display text-2xl text-bone">OUTBREAK LOG</span>
        </div>

        {!reduced && (
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            {/* Filled wedges, not strokes: wide at the impact, a point at the
                tip. Each one grows outward from the same origin, which is how
                a fracture actually travels. */}
            {CRACKS.map((crack, index) => (
              <polygon
                key={`crack-${index}`}
                points={crack.points}
                fill="var(--bone)"
                style={{
                  ...GROW_FROM,
                  opacity: crack.opacity,
                  transform: 'scale(0.02)',
                  animation: `shatter-grow ${DRAW_DURATION}ms ${EASING} ${
                    IMPACT_AT + crack.delay
                  }ms forwards`,
                }}
              />
            ))}

            {/* The impact: the heaviest mark on the screen. */}
            <polygon
              points={CORE}
              fill="var(--bone)"
              style={{
                ...GROW_FROM,
                transform: 'scale(0.02)',
                animation: `shatter-grow 260ms ${EASING} ${IMPACT_AT}ms forwards`,
              }}
            />
          </svg>
        )}
      </div>

      {/* The hit itself: one bright frame from the point of impact. */}
      {!reduced && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0,
            backgroundImage: `radial-gradient(circle at ${IMPACT.x}% ${IMPACT.y}%, var(--bone) 0%, transparent 42%)`,
            animation: `shatter-flash ${FLASH_DURATION}ms linear ${IMPACT_AT}ms forwards`,
          }}
        />
      )}

      {/* Nothing but the wordmark until the glass goes. Escape still works
          the whole time for anyone who wants out early. */}
      <button
        type="button"
        onClick={dismiss}
        style={{
          animation: `intro-fade-in 240ms linear ${
            reduced ? 0 : IMPACT_AT + 120
          }ms both`,
        }}
        className="type-data pointer-events-auto absolute bottom-4 right-4 text-xs text-fog hover:text-bone"
      >
        건너뛰기
      </button>
    </div>
  );
}
