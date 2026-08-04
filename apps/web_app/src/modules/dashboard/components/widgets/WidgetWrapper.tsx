import React, { memo, Suspense } from 'react';
import { LoadingSkeleton } from '../feedback/LoadingSkeleton';
import { ErrorState } from '../feedback/ErrorState';
import { EmptyState } from '../feedback/EmptyState';
import { isWidgetVisible, DashboardWidgetV2, WidgetValidationContext } from '../../registry/WidgetRegistry';

interface WidgetWrapperProps {
    widget: DashboardWidgetV2;
    visibilityCtx: WidgetValidationContext;
    hasData?: boolean;
    isLoading?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    children: React.ReactNode;
    /** Optional custom empty state props */
    emptyTitle?: string;
    emptyMessage?: string;
}

/**
 * Sprint 3.3.9 — Performance-optimized, memoized widget container.
 * - Validates visibility via WidgetRegistry 2.0
 * - Wraps children in React.Suspense with skeleton fallback
 * - Renders EmptyState / ErrorState based on data/error props
 * - Memoized to prevent re-renders when parent re-renders without prop changes
 */
const WidgetWrapperInner: React.FC<WidgetWrapperProps> = ({
    widget,
    visibilityCtx,
    hasData = true,
    isLoading = false,
    isError = false,
    onRetry,
    children,
    emptyTitle,
    emptyMessage
}) => {
    // Registry visibility gate — silently unmounts if not permitted
    if (!isWidgetVisible(widget, { ...visibilityCtx, hasData })) {
        return null;
    }

    // Error state
    if (isError) {
        return (
            <ErrorState
                title="Widget Error"
                message={`Failed to load ${widget.title}. Please refresh.`}
                onRetry={onRetry}
            />
        );
    }

    // Loading state
    if (isLoading) {
        return <LoadingSkeleton type="list" />;
    }

    // Empty state
    if (!hasData) {
        return (
            <EmptyState
                title={emptyTitle ?? `No ${widget.title} Data`}
                message={emptyMessage ?? 'No data is available for this widget in the current context.'}
                compact
            />
        );
    }

    // Full content wrapped in Suspense for any lazy sub-components
    return (
        <Suspense fallback={<LoadingSkeleton type="list" />}>
            {children}
        </Suspense>
    );
};

export const WidgetWrapper = memo(WidgetWrapperInner);
export default WidgetWrapper;
