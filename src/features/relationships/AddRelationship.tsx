import { useState } from 'react';
import { useStore } from '@/store';
import type { Survivor } from '@/types';
import { hasPair } from './pairs';

export interface AddRelationshipProps {
  survivors: readonly Survivor[];
}

export default function AddRelationship({ survivors }: AddRelationshipProps) {
  const relationships = useStore((state) => state.relationships);
  const addRelationshipPair = useStore((state) => state.addRelationshipPair);
  const [isOpen, setIsOpen] = useState(false);
  const [aId, setAId] = useState('');
  const [bId, setBId] = useState('');

  const isDuplicate = aId !== '' && bId !== '' && hasPair(relationships, aId, bId);
  const canSubmit = aId !== '' && bId !== '' && aId !== bId && !isDuplicate;

  const submit = (): void => {
    if (!canSubmit) return;
    addRelationshipPair(aId, bId);
    setAId('');
    setBId('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="type-label w-full rounded border border-panel bg-ash-700 py-2 text-fog hover:text-bone"
      >
        관계 추가
      </button>
    );
  }

  const selectClass =
    'flex-1 rounded border border-panel bg-ash-700 px-2 py-1.5 text-sm text-bone';

  return (
    <div className="flex flex-col gap-2 border border-oxblood p-2">
      <div className="flex items-center gap-1">
        <select
          className={selectClass}
          value={aId}
          aria-label="관계의 한쪽"
          onChange={(event) => setAId(event.target.value)}
        >
          <option value="">선택</option>
          {survivors.map((survivor) => (
            <option key={survivor.id} value={survivor.id}>
              {survivor.name}
            </option>
          ))}
        </select>
        <span className="type-data shrink-0 text-xs text-fog">↔</span>
        <select
          className={selectClass}
          value={bId}
          aria-label="관계의 다른 쪽"
          onChange={(event) => setBId(event.target.value)}
        >
          <option value="">선택</option>
          {survivors.map((survivor) => (
            <option key={survivor.id} value={survivor.id}>
              {survivor.name}
            </option>
          ))}
        </select>
      </div>

      {isDuplicate && (
        <p className="type-data text-xs text-blood-hot">
          이미 정의된 관계입니다.
        </p>
      )}

      <div className="flex gap-1">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={`type-label flex-1 rounded py-2 ${
            canSubmit
              ? 'bg-blood text-bone'
              : 'cursor-not-allowed bg-ash-700 text-fog'
          }`}
        >
          추가
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="type-label rounded border border-panel px-3 text-fog hover:text-bone"
        >
          취소
        </button>
      </div>
    </div>
  );
}
