import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Caught ERP exception:', error, errorInfo);
        // Here we can report to a logging service or Sentry in the future
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertOctagon className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Unexpected Error</h1>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                            Something went wrong while rendering this section. Our team has been notified. Please try refreshing or returning to the dashboard.
                        </p>
                        {this.state.error && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left border border-gray-100 font-mono text-xs text-red-500 max-h-40 overflow-y-auto custom-scrollbar">
                                {this.state.error.stack || this.state.error.message}
                            </div>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md shadow-primary/10 hover:bg-primary/95 transition-all text-sm"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retry Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
export default ErrorBoundary;
