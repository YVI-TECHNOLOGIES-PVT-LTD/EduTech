import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { BulkOperationResult } from '../types';

interface BulkResultProps {
    result: BulkOperationResult;
    onDismiss?: () => void;
}

export function BulkResult({ result, onDismiss }: BulkResultProps) {
    const hasErrors = result.failed > 0;

    return (
        <div
            className={`p-6 rounded-2xl border ${
                hasErrors ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'
            }`}
        >
            <div className="flex items-start gap-3">
                {hasErrors ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold">
                        {result.success} succeeded, {result.failed} failed
                    </p>
                    {result.errors.length > 0 && (
                        <ul className="space-y-1 max-h-32 overflow-y-auto">
                            {result.errors.map(err => (
                                <li key={err.id} className="text-xs flex items-center gap-2 text-muted-foreground">
                                    <XCircle className="w-3 h-3 text-destructive shrink-0" />
                                    <span>
                                        {err.id}: {err.message}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {onDismiss && (
                        <button
                            type="button"
                            onClick={onDismiss}
                            className="text-xs font-bold text-primary hover:underline"
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
