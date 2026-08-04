import React from 'react';
import { Check } from 'lucide-react';
import type { WorkflowStep } from '../types';

interface WorkflowProgressProps {
    steps: (WorkflowStep & { completed?: boolean })[];
    activeIndex: number;
}

export function WorkflowProgress({ steps, activeIndex }: WorkflowProgressProps) {
    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {steps.map((step, idx) => (
                <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center min-w-[80px]">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${
                                step.completed
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : idx === activeIndex
                                      ? 'border-primary text-primary bg-primary/10'
                                      : 'border-border text-muted-foreground'
                            }`}
                        >
                            {step.completed ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className="text-[10px] font-bold mt-1 text-center line-clamp-2">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                        <div className={`h-0.5 w-8 shrink-0 ${step.completed ? 'bg-emerald-500' : 'bg-border'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
