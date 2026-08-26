import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import Panel from '@/components/Panel';
import { formatDay } from '@/features/simulation';
import { useStore } from '@/store';
import { LOG_WINDOW } from '@/store/logSlice';
import DamageLayer from './DamageLayer';
import LogControls from './LogControls';
import LogEntryRow from './LogEntryRow';
import { damagedBorder, runDamage } from './damage';
import { groupByDay } from './entryTime';
import { buildSummary, copyText, exportPng } from './exportLog';
import { useTypewriter } from './useTypewriter';

const PINNED_THRESHOLD = 48;
const NOTICE_MS = 2400;

export default function LogPanel() {
  const log = useStore((state) => state.log);
  const survivors = useStore((state) => state.survivors);
  const sim = useStore((state) => state.sim);
  const advanceOneDay = useStore((state) => state.advanceOneDay);
  const setPhase = useStore((state) => state.setPhase);

  const scrollRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isPinned = useRef(true);
  const noticeTimer = useRef<number | null>(null);

  const [showJump, setShowJump] = useState(false);
  const [tickKey, setTickKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const damage = useMemo(() => runDamage(log), [log]);
  const living = survivors.filter((survivor) => survivor.alive).length;
  const canAdvance =
    living > 0 && sim.phase !== 'ended' && sim.pendingChoice === null;
  const isAuto = sim.phase === 'running';

  const { revealed, typing } = useTypewriter(log);
  const visible = useMemo(
    () => log.slice(0, typing === null ? revealed : revealed + 1),
    [log, revealed, typing],
  );
  // Windowed: only the tail is mounted, so a 200-day run stays responsive.
  const windowed = useMemo(
    () => (visible.length > LOG_WINDOW ? visible.slice(-LOG_WINDOW) : visible),
    [visible],
  );
  const hiddenCount = visible.length - windowed.length;
  const groups = useMemo(() => groupByDay(windowed), [windowed]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const advance = useCallback(() => {
    advanceOneDay();
    setTickKey((current) => current + 1);
  }, [advanceOneDay]);

  // Auto-run drives the same action the button does.
  useEffect(() => {
    if (sim.phase !== 'running') return;
    if (living === 0) {
      setPhase('paused');
      return;
    }

    const timer = window.setInterval(advance, sim.tickMs);
    return () => window.clearInterval(timer);
  }, [advance, living, setPhase, sim.phase, sim.tickMs]);

  // Follow the tail unless the reader has scrolled away from it.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !isPinned.current) return;
    container.scrollTop = container.scrollHeight;
  }, [visible, typing]);

  const handleScroll = (): void => {
    const container = scrollRef.current;
    if (!container) return;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isPinned.current = distance < PINNED_THRESHOLD;
    setShowJump(!isPinned.current);
  };

  const jumpToLatest = (): void => {
    const container = scrollRef.current;
    if (!container) return;
    isPinned.current = true;
    setShowJump(false);
    container.scrollTop = container.scrollHeight;
  };

  const handleCopy = (): void => {
    void copyText(
      buildSummary({ runSeed: sim.runSeed, day: sim.day, survivors, log }),
    ).then((ok) =>
      flash(ok ? '요약을 복사했습니다.' : '복사가 차단되었습니다.'),
    );
  };

  const handleExport = (): void => {
    const node = exportRef.current;
    if (!node) return;
    flash('이미지를 만드는 중입니다…');
    void exportPng(node, `outbreak-log-${sim.runSeed}.png`).then((ok) =>
      flash(ok ? '기록을 저장했습니다.' : '이미지 저장이 차단되었습니다.'),
    );
  };

  return (
    <Panel
      eyebrow="04 / LOG"
      title="생존 일지"
      counter={`${log.length}건`}
      style={{ borderColor: damagedBorder(damage) }}
      overlay={<DamageLayer damage={damage} />}
    >
      <div className="relative z-20 flex h-full min-h-0 flex-col gap-3">
        {/* 상태: how badly this run has gone. */}
        <div className="h-0.5 w-full shrink-0 bg-ash-700">
          <div
            className="h-0.5 bg-blood"
            style={{ width: `${Math.round(damage * 100)}%` }}
          />
        </div>

        <LogControls
          canAdvance={canAdvance}
          isAuto={isAuto}
          tickKey={tickKey}
          tickMs={sim.tickMs}
          onAdvance={advance}
          onToggleAuto={() => setPhase(isAuto ? 'paused' : 'running')}
          onExportPng={handleExport}
          onCopyText={handleCopy}
          notice={notice}
        />

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            // `additions` keeps it to the entry that just arrived; announcing
            // the whole list on every tick would be unusable.
            aria-live="polite"
            aria-relevant="additions"
            aria-atomic="false"
            aria-label="생존 일지"
            className="scroll-thin -mx-4 h-full overflow-y-auto px-4"
          >
            {hiddenCount > 0 && (
              <p className="type-data py-1 text-xs text-fog">
                앞선 {hiddenCount}건은 화면에서 접혔다. 저장된 기록에는 남아 있다.
              </p>
            )}
            {groups.length === 0 ? (
              <EmptyState message="기록이 시작되지 않았습니다." />
            ) : (
              groups.map((group) => (
                <section key={group.day}>
                  <div className="sticky top-0 z-10 flex items-center gap-2 bg-ash-800 py-1">
                    <span className="h-px flex-1 bg-oxblood" />
                    <span className="type-display text-base tracking-label text-fog">
                      DAY {formatDay(group.day)}
                    </span>
                    <span className="h-px flex-1 bg-oxblood" />
                  </div>
                  <ul className="flex flex-col gap-1.5 py-1.5">
                    {group.entries.map((entry, index) => {
                      const isLastVisible =
                        entry.id === windowed[windowed.length - 1]?.id;
                      return (
                        <LogEntryRow
                          key={entry.id}
                          entry={entry}
                          time={group.times[index] ?? '--:--'}
                          survivors={survivors}
                          partialText={
                            isLastVisible && typing !== null ? typing : null
                          }
                        />
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>

          {showJump && (
            <button
              type="button"
              onClick={jumpToLatest}
              className="type-label absolute bottom-2 left-1/2 -translate-x-1/2 rounded border border-blood bg-ash-700 px-3 py-1 text-bone"
            >
              최신 기록으로
            </button>
          )}
        </div>
      </div>

      {/* Off-screen render target for the PNG export. */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden="true">
        <div
          ref={exportRef}
          style={{
            width: 1200,
            height: 1600,
            backgroundColor: 'var(--ash-900)',
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div className="type-display text-2xl text-bone">OUTBREAK LOG</div>
          <div className="type-data text-sm text-fog">
            DAY {formatDay(sim.day)} · 생존 {living} · 기록 {log.length}건
          </div>
          <div className="flex-1 overflow-hidden">
            {log.slice(-46).map((entry) => (
              <p
                key={entry.id}
                className="type-data leading-[1.7]"
                style={{
                  color:
                    entry.severity === 'death'
                      ? 'var(--blood-hot)'
                      : 'var(--bone)',
                }}
              >
                <span className="text-fog">
                  DAY {formatDay(entry.day)}{' '}
                </span>
                {entry.message}
              </p>
            ))}
          </div>
          <div className="type-data text-sm text-fog">SEED {sim.runSeed}</div>
        </div>
      </div>
    </Panel>
  );
}
