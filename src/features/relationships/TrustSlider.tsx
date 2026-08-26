import {
  TRUST_MAX,
  TRUST_MIN,
  TRUST_STEP,
  describeTrust,
  formatTrust,
} from '@/data/relationships';

export interface TrustSliderProps {
  value: number;
  disabled: boolean;
  onChange: (next: number) => void;
}

export default function TrustSlider({
  value,
  disabled,
  onChange,
}: TrustSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <input
          type="range"
          className="trust-slider flex-1"
          min={TRUST_MIN}
          max={TRUST_MAX}
          step={TRUST_STEP}
          value={value}
          disabled={disabled}
          aria-label="신뢰도"
          // Reads the interpretation line rather than a bare number.
          aria-valuetext={`${formatTrust(value)}. ${describeTrust(value)}`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output className="type-data w-11 shrink-0 text-right text-lg text-bone">
          {formatTrust(value)}
        </output>
      </div>
      <p className="text-xs leading-snug text-fog">{describeTrust(value)}</p>
    </div>
  );
}
