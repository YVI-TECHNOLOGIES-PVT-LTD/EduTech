import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { GitCommit, Trash2 } from 'lucide-react';
import { WorkflowStep, WorkflowTransition } from '../services/assessment.api';

interface TransitionEditorProps {
    open: boolean;
    onClose: () => void;
    steps: WorkflowStep[];
    transitions: WorkflowTransition[];
    onSave: (transitions: WorkflowTransition[]) => void;
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
    open,
    onClose,
    steps,
    transitions,
    onSave
}) => {
    const [localTransitions, setLocalTransitions] = useState<WorkflowTransition[]>([]);

    useEffect(() => {
        setLocalTransitions(transitions);
    }, [transitions, open]);

    const stepStatuses = [
        'DRAFT',
        'REVIEW',
        'APPROVED',
        'PUBLISHED',
        'ARCHIVED',
        ...steps.map(s => s.step_name.toUpperCase())
    ];

    const handleAdd = () => {
        setLocalTransitions([
            ...localTransitions,
            {
                id: `temp_t_${Date.now()}`,
                from_status: stepStatuses[0] || 'DRAFT',
                to_status: stepStatuses[1] || 'REVIEW',
                rule_condition: ''
            }
        ]);
    };

    const handleRemove = (index: number) => {
        setLocalTransitions(localTransitions.filter((_, idx) => idx !== index));
    };

    const handleChange = (index: number, field: string, value: any) => {
        const updated = [...localTransitions];
        updated[index] = { ...updated[index], [field]: value };
        setLocalTransitions(updated);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl rounded-3xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                        <GitCommit className="w-5 h-5 text-primary animate-pulse" /> Configure Transition Vectors
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400">
                        Define allowable lifecycle flow conditions between steps and review states.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 py-2">
                    {localTransitions.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-gray-100 rounded-2xl">
                            <p className="text-xs text-gray-400 font-bold">No transition parameters set. Click Add to define vectors.</p>
                        </div>
                    ) : (
                        localTransitions.map((t, idx) => (
                            <div key={t.id || idx} className="grid grid-cols-12 gap-3 items-center border border-gray-50 bg-gray-50/30 p-4 rounded-2xl relative group">
                                <div className="col-span-5 space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">From State</Label>
                                    <Select
                                        value={t.from_status}
                                        onValueChange={(val) => handleChange(idx, 'from_status', val)}
                                    >
                                        <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stepStatuses.map(status => (
                                                <SelectItem key={status} value={status} className="text-xs font-bold">
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-5 space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">To State</Label>
                                    <Select
                                        value={t.to_status}
                                        onValueChange={(val) => handleChange(idx, 'to_status', val)}
                                    >
                                        <SelectTrigger className="h-9 rounded-xl text-xs font-bold bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stepStatuses.map(status => (
                                                <SelectItem key={status} value={status} className="text-xs font-bold">
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-11 mt-1 space-y-1">
                                    <Label className="text-[10px] font-black text-gray-400 uppercase">Conditions / Rule Metadata (Optional)</Label>
                                    <Input
                                        placeholder="e.g. min_score >= 80, role == 'DEAN'"
                                        value={t.rule_condition || ''}
                                        onChange={(e) => handleChange(idx, 'rule_condition', e.target.value)}
                                        className="h-9 rounded-xl text-xs bg-white border-gray-200"
                                    />
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemove(idx)}
                                    className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white hover:bg-destructive/5 text-gray-400 hover:text-destructive shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-between items-center pt-2">
                    <Button
                        variant="outline"
                        onClick={handleAdd}
                        className="rounded-xl border-gray-200 text-xs font-black"
                    >
                        + Add Transition Link
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl text-xs font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onSave(localTransitions)}
                            className="bg-primary text-white rounded-xl text-xs font-black px-6 shadow-premium-sm"
                        >
                            Apply Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
export default TransitionEditor;
