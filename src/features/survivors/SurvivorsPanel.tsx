import { useState } from 'react';
import Panel from '@/components/Panel';
import { useStore } from '@/store';
import SurvivorForm from './SurvivorForm';
import SurvivorList from './SurvivorList';

export default function SurvivorsPanel() {
  const survivors = useStore((state) => state.survivors);
  const [focusId, setFocusId] = useState<string | null>(null);

  return (
    <Panel
      eyebrow="01 / SURVIVORS"
      title="생존자 등록"
      counter={`${survivors.length}명`}
    >
      <div className="flex flex-col gap-4">
        <SurvivorForm onRegistered={setFocusId} />
        <div className="h-px shrink-0 bg-oxblood" />
        <SurvivorList focusId={focusId} />
      </div>
    </Panel>
  );
}
