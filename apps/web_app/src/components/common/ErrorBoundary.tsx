import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@edutrack/ui';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Component Error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[250px] flex flex-col items-center justify-center p-6 text-center bg-red-50/50 border border-red-200 rounded-lg m-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-sm text-red-600 mb-4 max-w-md">
            {this.props.fallbackMessage || this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <Button variant="outline" onClick={this.handleReset}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    fallbackTitle="Layout Error"
    fallbackMessage="Unable to render this section of the workspace."
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
