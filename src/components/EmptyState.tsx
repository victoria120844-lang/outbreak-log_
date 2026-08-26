export interface EmptyStateProps {
  /** Korean sentence explaining what is missing and what to do about it. */
  message: string;
}

export default function EmptyState({ message }: EmptyStateProps) {
  return (
    <p className="max-w-[34ch] text-sm leading-relaxed text-fog">{message}</p>
  );
}
