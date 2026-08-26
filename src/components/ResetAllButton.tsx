import { useEffect, useRef, useState } from 'react';
import { resetStore } from '@/store';

const CONFIRM_TIMEOUT_MS = 4000;

/**
 * Wipes the whole run — roster, relationships, supplies and log. Two steps,
 * because there is no undo, and the confirm lapses on its own so a stray click
 * never leaves a live destructive button sitting in the corner.
 */
export default function ResetAllButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const timer = useRef<number | null>(null);

  const clearTimer = (): void => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const arm = (): void => {
    setIsConfirming(true);
    clearTimer();
    timer.current = window.setTimeout(
      () => setIsConfirming(false),
      CONFIRM_TIMEOUT_MS,
    );
  };

  const confirm = (): void => {
    clearTimer();
    setIsConfirming(false);
    resetStore();
  };

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={arm}
        title="생존자, 관계, 보급품, 일지를 모두 지웁니다"
        className="type-label shrink-0 rounded border border-panel bg-ash-700 px-2 py-1 text-fog hover:text-bone"
      >
        전체 초기화
      </button>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <span className="type-data hidden text-[10px] text-blood-hot sm:inline">
        전부 지웁니다
      </span>
      <button
        type="button"
        onClick={confirm}
        className="type-label rounded bg-blood-hot px-2 py-1 text-ash-900"
      >
        확인
      </button>
      <button
        type="button"
        onClick={() => {
          clearTimer();
          setIsConfirming(false);
        }}
        className="type-label rounded border border-panel px-2 py-1 text-fog hover:text-bone"
      >
        취소
      </button>
    </span>
  );
}
