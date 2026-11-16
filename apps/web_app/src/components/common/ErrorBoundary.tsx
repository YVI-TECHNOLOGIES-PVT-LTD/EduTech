import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Home,
  WifiOff,
  FileQuestion,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export const isChunkLoadError = (error?: Error | null): boolean => {
  if (!error) return false;
  const msg = error.message || '';
  return (
    error.name === 'ChunkLoadError' ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk')
  );
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Component Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/app';
  };

  public handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/app';
    }
  };

  public render() {
    if (this.state.hasError) {
      const isChunk = isChunkLoadError(this.state.error);

      if (isChunk) {
        return (
          <div className="min-h-[320px] w-full flex flex-col items-center justify-center p-8 text-center bg-card border border-border/50 rounded-2xl shadow-premium-sm my-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <WifiOff className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 mb-2">
              Network / Version Update
            </span>
            <h2 className="text-xl font-bold text-foreground mb-2">
              New Application Version Available
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              A newer version of this module has been deployed or your connection was interrupted.
              Please reload the page to load the latest bundle.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="default"
                onClick={this.handleReload}
                className="gap-2 shadow-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2 font-semibold">
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[320px] w-full flex flex-col items-center justify-center p-8 text-center bg-card border border-destructive/20 rounded-2xl shadow-premium-sm my-4">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-destructive/10 text-destructive mb-2">
            Rendering Error
          </span>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {this.props.fallbackTitle || 'Unable to Load View'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-lg">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              'An unexpected rendering error occurred while loading this section.'}
          </p>

          {/* Collapsible Technical Details for Diagnostics */}
          {this.state.error && (
            <details className="text-left w-full max-w-lg mb-6 bg-muted/50 p-3 rounded-xl border border-border/40 text-xs font-mono text-muted-foreground">
              <summary className="cursor-pointer font-sans font-semibold text-foreground/80 hover:text-foreground">
                View Error Details
              </summary>
              <div className="mt-2 overflow-x-auto whitespace-pre-wrap max-h-36 overflow-y-auto text-[11px] leading-relaxed">
                {this.state.error.name}: {this.state.error.message}
                {this.state.error.stack && `\n${this.state.error.stack}`}
              </div>
            </details>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              onClick={this.handleReset}
              className="gap-2 shadow-sm font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            {(this.props.showBackButton ?? true) && (
              <Button variant="outline" onClick={this.handleGoBack} className="gap-2 font-semibold">
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
            )}
            {(this.props.showHomeButton ?? true) && (
              <Button variant="ghost" onClick={this.handleGoHome} className="gap-2 font-semibold">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * RouteErrorBoundary
 * Wraps route content inside AppShell so that route-level rendering errors
 * never unmount the topbar or sidebar.
 */
export const RouteErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallbackTitle="Section Rendering Interrupted"
    fallbackMessage="This page encountered an unexpected issue while rendering. You can retry loading it or return to your dashboard."
    showBackButton={true}
    showHomeButton={true}
  >
    {children}
  </ErrorBoundary>
);

export const GlobalErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallbackTitle="Application Rendering Error"
    fallbackMessage="A critical error occurred while loading the application interface."
  >
    {children}
  </ErrorBoundary>
);

export const LayoutErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallbackTitle="Workspace Layout Interrupted"
    fallbackMessage="Unable to load the current workspace layout. Please try refreshing your session."
  >
    {children}
  </ErrorBoundary>
);

export const FeatureErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallbackTitle="Feature Loading Error"
    fallbackMessage="Failed to display feature content."
  >
    {children}
  </ErrorBoundary>
);

// ─── Standard View Components (404, 403, 500) ────────────────────────────────

export interface ErrorViewProps {
  title?: string;
  description?: string;
  path?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const NotFoundView: React.FC<ErrorViewProps> = ({
  title = 'Page Not Found',
  description = "The page you are looking for doesn't exist, has been removed, or has moved to a new destination.",
  path,
  actionLabel = 'Go to Dashboard',
  onAction,
}) => {
  const handleGoHome = () => {
    if (onAction) onAction();
    else window.location.href = '/app';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-card border border-border/50 rounded-3xl shadow-premium-sm my-6 max-w-2xl mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 shadow-inner">
        <FileQuestion className="w-8 h-8" />
      </div>
      <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-primary/10 text-primary mb-3">
        Error 404
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">{description}</p>
      {path && (
        <div className="mb-6 px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-muted-foreground border border-border/50 max-w-md truncate">
          Route: <span className="font-semibold text-foreground">{path}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="default"
          onClick={handleGoHome}
          className="gap-2 shadow-sm font-semibold rounded-xl"
        >
          <Home className="w-4 h-4" />
          {actionLabel}
        </Button>
        <Button variant="outline" onClick={handleGoBack} className="gap-2 font-semibold rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
};

export const ForbiddenView: React.FC<ErrorViewProps> = ({
  title = 'Access Restricted',
  description = 'You do not have the required permissions or role assignments to access this area of the ERP.',
  path,
  actionLabel = 'Go to Dashboard',
  onAction,
}) => {
  const handleGoHome = () => {
    if (onAction) onAction();
    else window.location.href = '/app';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-card border border-amber-500/20 rounded-3xl shadow-premium-sm my-6 max-w-2xl mx-auto animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <span className="px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mb-3">
        Error 403 Forbidden
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-4 max-w-md leading-relaxed">{description}</p>
      {path && (
        <div className="mb-6 px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-muted-foreground border border-border/50 max-w-md truncate">
          Attempted Path: <span className="font-semibold text-foreground">{path}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="default"
          onClick={handleGoHome}
          className="gap-2 shadow-sm font-semibold rounded-xl"
        >
          <Home className="w-4 h-4" />
          {actionLabel}
        </Button>
        <Button variant="outline" onClick={handleGoBack} className="gap-2 font-semibold rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
};
