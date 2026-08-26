import { useStore } from '@/store';

/**
 * 순애 모드. On, a survivor who is already committed cannot climb to 연인 with
 * anybody else — every other bond they have stops one rung short. Off, the
 * ladder behaves the way it always did.
 *
 * Sits beside the other two switches so all three run-level toggles are in one
 * place, rather than buried in a settings panel this app does not have.
 */
export default function PureLoveToggle() {
  const pureLove = useStore((state) => state.sim.pureLove);
  const setPureLove = useStore((state) => state.setPureLove);

  return (
    <button
      type="button"
      aria-pressed={pureLove}
      onClick={() => setPureLove(!pureLove)}
      title={
        pureLove
          ? '한 사람은 한 사람만 사랑합니다. 끄면 양다리가 다시 가능해집니다.'
          : '지금은 여러 명과 동시에 연인이 될 수 있습니다.'
      }
      className={`type-label shrink-0 rounded border px-2 py-1 ${
        pureLove
          ? 'border-blood bg-ash-700 text-bone'
          : 'border-panel bg-ash-700 text-fog hover:text-bone'
      }`}
    >
      순애
    </button>
  );
}
