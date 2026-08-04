import React from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { WorkflowStep } from '../types';

interface WorkflowActionsProps {
    step?: WorkflowStep & { completed?: boolean };
    onExecute: () => void;
}

export function WorkflowActions({ step, onExecute }: WorkflowActionsProps) {
    const navigate = useNavigate();

    if (!step) return null;

    return (
        <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-xl">
            <div className="flex-1">
                <p className="text-sm font-bold">{step.label}</p>
                {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
            </div>
            {step.route ? (
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => navigate(step.route!)}>
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                </Button>
            ) : (
                <Button size="sm" className="gap-1 text-xs" onClick={onExecute} disabled={step.completed}>
                    <Play className="w-3.5 h-3.5" />
                    {step.completed ? 'Done' : 'Execute'}
                </Button>
            )}
        </div>
    );
}
