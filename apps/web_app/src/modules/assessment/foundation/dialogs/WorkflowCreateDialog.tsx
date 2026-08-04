import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useCreateWorkflow, useUpdateWorkflow } from '../hooks/useWorkflows';
import { useToast } from '../../../../components/ui/use-toast';

interface WorkflowCreateDialogProps {
    open: boolean;
    onClose: () => void;
    editingWorkflow: any | null;
}

export function WorkflowCreateDialog({ open, onClose, editingWorkflow }: WorkflowCreateDialogProps) {
    const { mutateAsync: createWorkflow, isPending: isCreating } = useCreateWorkflow();
    const { mutateAsync: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [steps, setSteps] = useState<any[]>([]);
    const [transitions, setTransitions] = useState<any[]>([]);

    useEffect(() => {
        if (editingWorkflow) {
            setName(editingWorkflow.name);
            setDescription(editingWorkflow.description || '');
            setIsActive(editingWorkflow.is_active);
            setSteps(editingWorkflow.steps || []);
            setTransitions(editingWorkflow.transitions || []);
        } else {
            setName('');
            setDescription('');
            setIsActive(true);
            setSteps([{ step_name: 'Department Review', role_required: 'DEPT_HEAD', sort_order: 1 }]);
            setTransitions([]);
        }
    }, [editingWorkflow, open]);

    const handleAddStep = () => {
        setSteps([
            ...steps,
            { step_name: '', role_required: 'TEACHER', sort_order: steps.length + 1 }
        ]);
    };

    const handleRemoveStep = (index: number) => {
        const updated = steps.filter((_, idx) => idx !== index).map((s, idx) => ({
            ...s,
            sort_order: idx + 1
        }));
        setSteps(updated);
    };

    const handleStepChange = (index: number, field: string, value: any) => {
        const updated = [...steps];
        updated[index] = { ...updated[index], [field]: value };
        setSteps(updated);
    };

    const handleAddTransition = () => {
        setTransitions([
            ...transitions,
            { from_status: 'DRAFT', to_status: 'REVIEW', rule_condition: '' }
        ]);
    };

    const handleRemoveTransition = (index: number) => {
        setTransitions(transitions.filter((_, idx) => idx !== index));
    };

    const handleTransitionChange = (index: number, field: string, value: any) => {
        const updated = [...transitions];
        updated[index] = { ...updated[index], [field]: value };
        setTransitions(updated);
    };

    const handleSave = async () => {
        if (!name) {
            toast({ variant: 'destructive', title: 'Error', description: 'Workflow name is required.' });
            return;
        }

        const stepValidation = steps.some(s => !s.step_name || !s.role_required);
        if (stepValidation) {
            toast({ variant: 'destructive', title: 'Error', description: 'All steps must have a name and role.' });
            return;
        }

        const payload = {
            name,
            description,
            is_active: isActive,
            steps,
            transitions
        };

        try {
            if (editingWorkflow) {
                await updateWorkflow({ id: editingWorkflow.id, payload });
                toast({ title: 'Success', description: 'Workflow updated successfully.' });
            } else {
                await createWorkflow(payload);
                toast({ title: 'Success', description: 'Workflow created successfully.' });
            }
            onClose();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to save workflow.'
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white">
                <DialogHeader>
                    <DialogTitle className="text-sm font-black text-gray-900">
                        {editingWorkflow ? 'Modify Approval Workflow' : 'Build Approval Workflow'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400">
                        Construct routing step configurations for template validations.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Workflow Name</Label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Dean Term Approval Cycle"
                            className="rounded-xl border-gray-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-700">Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe workflow scoping..."
                            className="rounded-xl border-gray-200 min-h-[60px]"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="is_active"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                        />
                        <Label htmlFor="is_active" className="text-xs font-bold text-gray-700 cursor-pointer">Active Workflow</Label>
                    </div>

                    {/* STEPS LIST */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-xs font-black text-gray-900">Approval Steps Hierarchy</span>
                            <Button
                                type="button"
                                onClick={handleAddStep}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-black border-dashed flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Step
                            </Button>
                        </div>

                        {steps.map((step, index) => (
                            <div key={index} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 w-5">#{step.sort_order}</span>
                                <Input
                                    type="text"
                                    value={step.step_name}
                                    onChange={(e) => handleStepChange(index, 'step_name', e.target.value)}
                                    placeholder="Step Name"
                                    className="h-8 text-xs rounded-lg border-gray-200 bg-white"
                                />
                                <select
                                    value={step.role_required}
                                    onChange={(e) => handleStepChange(index, 'role_required', e.target.value)}
                                    className="h-8 px-2 border border-gray-200 rounded-lg text-xs font-bold bg-white text-gray-700"
                                >
                                    <option value="TEACHER">Teacher</option>
                                    <option value="DEPT_HEAD">Dept Head</option>
                                    <option value="DEAN">Dean</option>
                                    <option value="EXAM_CELL">Exam Cell</option>
                                    <option value="ADMIN">Academic Admin</option>
                                </select>
                                <Button
                                    type="button"
                                    onClick={() => handleRemoveStep(index)}
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg border-gray-200 hover:bg-red-50 text-red-500 flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* TRANSITIONS LIST */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-xs font-black text-gray-900">Valid Transitions Rules (Optional)</span>
                            <Button
                                type="button"
                                onClick={handleAddTransition}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-black border-dashed flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Transition
                            </Button>
                        </div>

                        {transitions.map((trans, index) => (
                            <div key={index} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <Input
                                    type="text"
                                    value={trans.from_status}
                                    onChange={(e) => handleTransitionChange(index, 'from_status', e.target.value)}
                                    placeholder="From Status"
                                    className="h-8 text-xs rounded-lg border-gray-200 bg-white"
                                />
                                <span className="text-[10px] text-gray-400 font-bold">→</span>
                                <Input
                                    type="text"
                                    value={trans.to_status}
                                    onChange={(e) => handleTransitionChange(index, 'to_status', e.target.value)}
                                    placeholder="To Status"
                                    className="h-8 text-xs rounded-lg border-gray-200 bg-white"
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleRemoveTransition(index)}
                                    variant="outline"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg border-gray-200 hover:bg-red-50 text-red-500 flex-shrink-0"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="mt-6 border-t border-gray-50 pt-4 flex gap-2">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="outline"
                        className="rounded-xl border-gray-200 text-xs font-bold"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isCreating || isUpdating}
                        className="bg-primary text-white rounded-xl text-xs font-black flex items-center gap-1.5 px-4"
                    >
                        {isCreating || isUpdating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" /> Save Workflow
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
export default WorkflowCreateDialog;
