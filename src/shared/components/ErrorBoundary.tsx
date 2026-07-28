import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** When this value changes while an error is shown, the boundary resets — e.g. pass
   * the current route's pathname so navigating to a different page recovers automatically
   * instead of leaving the user stuck on the error state for the rest of the session. */
  resetKey?: unknown;
  title?: string;
  description?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors in its subtree instead of leaving them uncaught. Without this,
 * an error thrown while rendering a page (e.g. an API response shaped unexpectedly)
 * propagates all the way up with nothing to stop it — which can leave the page looking
 * "stuck" on whatever last rendered successfully while the URL/nav state has already
 * moved on, since those live in React Router context and update independently of a
 * crashed subtree.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught a render error:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-bg-dark">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          <AlertTriangle size={22} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">{this.props.title ?? 'Something went wrong'}</h2>
          <p className="max-w-sm text-sm text-gray-400">
            {this.props.description ?? 'This page hit an unexpected error. Try again, or head back to the dashboard.'}
          </p>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-1 max-w-lg overflow-auto rounded-lg bg-red-500/5 p-3 text-left text-xs text-red-400">
            {error.message}
          </pre>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-border-dark dark:text-gray-300 dark:hover:bg-white/5"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/dashboard')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}
