import { useState } from 'react';
import { WorkflowStep, WorkflowTransition } from '../services/assessment.api';

export function useWorkflowBuilder() {
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
    const [history, setHistory] = useState<{ steps: WorkflowStep[]; transitions: WorkflowTransition[] }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [zoom, setZoom] = useState(1);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);

    const updateState = (newSteps: WorkflowStep[], newTransitions: WorkflowTransition[]) => {
        setSteps(newSteps);
        setTransitions(newTransitions);

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ steps: newSteps, transitions: newTransitions });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setSteps(prev.steps);
            setTransitions(prev.transitions);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setSteps(next.steps);
            setTransitions(next.transitions);
            setHistoryIndex(historyIndex + 1);
        }
    };

    const addStep = (stepName: string, roleRequired: string) => {
        const nextOrder = steps.length + 1;
        const newStep: WorkflowStep = {
            id: `temp_${Date.now()}`,
            step_name: stepName,
            role_required: roleRequired,
            sort_order: nextOrder
        };
        updateState([...steps, newStep], transitions);
    };

    const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
        const newSteps = steps.map(s => (s.id === id ? { ...s, ...updates } : s));
        updateState(newSteps, transitions);
    };

    const deleteStep = (id: string) => {
        const newSteps = steps.filter(s => s.id !== id).map((s, idx) => ({ ...s, sort_order: idx + 1 }));
        const stepToDelete = steps.find(s => s.id === id);
        
        // Remove associated transitions
        const newTransitions = transitions.filter(
            t => t.from_status !== stepToDelete?.step_name && t.to_status !== stepToDelete?.step_name
        );
        updateState(newSteps, newTransitions);
    };

    const addTransition = (from: string, to: string, condition?: string) => {
        const newTransition: WorkflowTransition = {
            id: `temp_trans_${Date.now()}`,
            from_status: from,
            to_status: to,
            rule_condition: condition || null
        };
        updateState(steps, [...transitions, newTransition]);
    };

    const updateTransition = (id: string, updates: Partial<WorkflowTransition>) => {
        const newTransitions = transitions.map(t => (t.id === id ? { ...t, ...updates } : t));
        updateState(steps, newTransitions);
    };

    const deleteTransition = (id: string) => {
        const newTransitions = transitions.filter(t => t.id !== id);
        updateState(steps, newTransitions);
    };

    const validateWorkflow = (): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];
        if (steps.length === 0) {
            errors.push('At least one step is required in the review path.');
        }

        // Check if steps have unique names
        const names = steps.map(s => s.step_name.toLowerCase());
        const hasDuplicates = names.some((name, idx) => names.indexOf(name) !== idx);
        if (hasDuplicates) {
            errors.push('All workflow step names must be unique.');
        }

        // Validate transitions point to existing statuses/steps
        const validStatuses = new Set(['draft', 'review', 'approved', 'published', 'archived', ...names]);
        transitions.forEach(t => {
            if (!validStatuses.has(t.from_status.toLowerCase())) {
                errors.push(`Transition source "${t.from_status}" is invalid.`);
            }
            if (!validStatuses.has(t.to_status.toLowerCase())) {
                errors.push(`Transition destination "${t.to_status}" is invalid.`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    };

    return {
        steps,
        transitions,
        zoom,
        setZoom,
        selectedStepId,
        setSelectedStepId,
        selectedTransitionId,
        setSelectedTransitionId,
        setInitialState: (initSteps: WorkflowStep[], initTrans: WorkflowTransition[]) => {
            setSteps(initSteps);
            setTransitions(initTrans);
            setHistory([{ steps: initSteps, transitions: initTrans }]);
            setHistoryIndex(0);
        },
        addStep,
        updateStep,
        deleteStep,
        addTransition,
        updateTransition,
        deleteTransition,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        validateWorkflow
    };
}
export default useWorkflowBuilder;
