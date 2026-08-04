import React, { useState } from 'react';
import { WorkflowProgress } from './WorkflowProgress';
import { WorkflowActions } from './WorkflowActions';
import { WorkflowHistory } from './WorkflowHistory';
import { WorkflowShortcuts } from './WorkflowShortcuts';
import { getWorkflowSteps } from './workflowSteps.config';
import type { WorkflowStep } from '../types';

interface WorkflowLauncherProps {
    workflowId: string;
    entityId?: string;
    entityLabel?: string;
    onStepAction?: (step: WorkflowStep) => void | Promise<void>;
    completedStepIds?: string[];
}

export function WorkflowLauncher({
    workflowId,
    entityId,
    entityLabel,
    onStepAction,
    completedStepIds = [],
}: WorkflowLauncherProps) {
    const steps = getWorkflowSteps(workflowId);
    const [activeStep, setActiveStep] = useState(0);
    const [history, setHistory] = useState<{ step: string; timestamp: string; status: string }[]>([]);

    const handleAction = async (step: WorkflowStep) => {
        if (onStepAction) await onStepAction(step);
        setHistory(prev => [
            { step: step.label, timestamp: new Date().toISOString(), status: 'completed' },
            ...prev,
        ]);
        setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const enrichedSteps = steps.map(s => ({
        ...s,
        completed: completedStepIds.includes(s.id) || history.some(h => h.step === s.label),
    }));

    return (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Workflow</h3>
                {entityLabel && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {entityLabel}{entityId ? ` · ${entityId}` : ''}
                    </p>
                )}
            </div>
            <WorkflowProgress steps={enrichedSteps} activeIndex={activeStep} />
            <WorkflowActions
                step={enrichedSteps[activeStep]}
                onExecute={() => enrichedSteps[activeStep] && handleAction(enrichedSteps[activeStep])}
            />
            <WorkflowShortcuts steps={enrichedSteps} onSelect={step => {
                const idx = enrichedSteps.findIndex(s => s.id === step.id);
                if (idx >= 0) setActiveStep(idx);
            }} />
            {history.length > 0 && <WorkflowHistory entries={history} />}
        </div>
    );
}
