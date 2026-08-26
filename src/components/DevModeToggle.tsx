import { useStore } from '@/store';

/**
 * Sits in the left corner and unlocks the supply editor. Everything it exposes
 * is authoring, not play — a normal run finds its supplies in the world.
 */
export default function DevModeToggle() {
  const devMode = useStore((state) => state.devMode);
  const setDevMode = useStore((state) => state.setDevMode);

  return (
    <button
      type="button"
      aria-pressed={devMode}
      onClick={() => setDevMode(!devMode)}
      title="보급품을 직접 편집할 수 있게 합니다"
      className={`type-label shrink-0 rounded border px-2 py-1 ${
        devMode
          ? 'border-blood bg-ash-700 text-bone'
          : 'border-panel bg-ash-700 text-fog hover:text-bone'
      }`}
    >
      개발자 모드
    </button>
  );
}
