import { toPng } from 'html-to-image';
import type { LogEntry, Survivor } from '@/types';

export const EXPORT_WIDTH = 1200;
export const EXPORT_HEIGHT = 1600;

export interface RunSummary {
  runSeed: number;
  day: number;
  survivors: readonly Survivor[];
  log: readonly LogEntry[];
}

/** Short enough to paste anywhere, specific enough to be worth pasting. */
export const buildSummary = (summary: RunSummary): string => {
  const living = summary.survivors.filter((survivor) => survivor.alive).length;
  const lastLine = summary.log[summary.log.length - 1]?.message ?? '기록 없음';

  return [
    'OUTBREAK LOG',
    `시드 ${summary.runSeed}`,
    `${summary.day}일 생존 · 남은 인원 ${living}명 / ${summary.survivors.length}명`,
    `"${lastLine}"`,
  ].join('\n');
};

/** Clipboard API first, then the old textarea trick for locked-down frames. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the manual path.
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
};

export const exportPng = async (
  node: HTMLElement,
  fileName: string,
): Promise<boolean> => {
  try {
    const dataUrl = await toPng(node, {
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: '#0B0D10',
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
    return true;
  } catch {
    return false;
  }
};
