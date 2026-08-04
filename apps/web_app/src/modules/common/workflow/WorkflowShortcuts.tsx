import React from 'react';
import { Zap } from 'lucide-react';
import type { WorkflowStep } from '../types';

interface WorkflowShortcutsProps {
    steps: (WorkflowStep & { completed?: boolean })[];
    onSelect: (step: WorkflowStep) => void;
}

export function WorkflowShortcuts({ steps, onSelect }: WorkflowShortcutsProps) {
    const pending = steps.filter(s => !s.completed);

    if (pending.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 w-full">
                <Zap className="w-3 h-3" /> Quick Steps
            </span>
            {pending.slice(0, 3).map(step => (
                <button
                    key={step.id}
                    type="button"
                    onClick={() => onSelect(step)}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20"
                >
                    {step.label}
                </button>
            ))}
        </div>
    );
}
