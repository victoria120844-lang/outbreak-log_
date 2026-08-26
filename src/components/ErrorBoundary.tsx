import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearPersistedState } from '@/store/persistence';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * A corrupt save or a bad render should read as part of the world, not as a
 * stack trace. The only way out is to start the run over.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // No analytics in this product; the console is the only report.
    console.error('OUTBREAK LOG crashed', error, info.componentStack);
  }

  private readonly restart = (): void => {
    clearPersistedState();
    window.location.reload();
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="panel flex max-w-sm flex-col gap-4 p-6">
          <p className="type-display text-xl text-blood-hot">기록 손상</p>
          <p className="text-sm leading-relaxed text-bone">
            기록이 손상되었습니다. 처음부터 다시 시작하시겠습니까?
          </p>
          <p className="type-data text-xs text-fog">
            저장된 명단과 일지는 복구할 수 없습니다.
          </p>
          <button
            type="button"
            onClick={this.restart}
            className="type-display w-full rounded bg-blood py-2.5 text-base tracking-label text-bone"
          >
            처음부터 시작
          </button>
        </div>
      </div>
    );
  }
}
