import type { CSSProperties, ReactNode } from 'react';

export type PanelTone = 'default' | 'critical';

export interface PanelProps {
  /** Decoration pinned to the panel frame, outside the scrolling body. */
  overlay?: ReactNode;
  /** Escape hatch for a continuously interpolated border color. */
  style?: CSSProperties;
  /** 11px uppercase marker, e.g. "01 / SURVIVORS". */
  eyebrow: string;
  /** Korean panel title, rendered in display type. */
  title: string;
  /** Optional right-aligned count, e.g. "3명". */
  counter?: ReactNode;
  /** `critical` tints the top border to signal a failing state. */
  tone?: PanelTone;
  /** Extra classes for grid/flex placement by the parent. */
  className?: string;
  children: ReactNode;
}

export default function Panel({
  eyebrow,
  title,
  counter,
  tone = 'default',
  className = '',
  overlay,
  style,
  children,
}: PanelProps) {
  const toneClass = tone === 'critical' ? 'border-t-blood-hot' : '';

  return (
    <section
      style={style}
      className={`panel relative flex h-full min-h-0 flex-col ${toneClass} ${className}`}
    >
      {overlay}
      <header className="flex shrink-0 items-baseline gap-3 px-4 py-3">
        <span className="type-label shrink-0">{eyebrow}</span>
        <h2 className="type-display min-w-0 truncate text-lg text-bone">
          {title}
        </h2>
        {counter !== undefined && (
          <span className="type-data ml-auto shrink-0 text-fog">{counter}</span>
        )}
      </header>

      {/* Hairline divider under the header. */}
      <div className="h-px shrink-0 bg-oxblood" />

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </section>
  );
}
