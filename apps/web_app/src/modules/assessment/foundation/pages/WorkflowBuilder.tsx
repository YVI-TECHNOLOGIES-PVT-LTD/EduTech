import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWorkflowBuilder } from '../hooks/useWorkflowBuilder';
import { useWorkflowDetail, useCreateWorkflow, useUpdateWorkflow } from '../hooks/useWorkflows';
import { WorkflowToolbar } from '../components/WorkflowToolbar';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { TransitionEditor } from '../components/TransitionEditor';
import { WorkflowPreview } from '../components/WorkflowPreview';
import { useToast } from '../../../../components/ui/use-toast';
import { ArrowLeft, GitFork, Eye, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../components/ui/dialog';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { WorkflowStep } from '../services/assessment.api';

export const WorkflowBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [isTransitionEditorOpen, setIsTransitionEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    // Step configuration dialog state
    const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
    const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
    const [stepNameInput, setStepNameInput] = useState('');
    const [stepRoleInput, setStepRoleInput] = useState('TEACHER');

    const builder = useWorkflowBuilder();
    const { data: workflowDetail, isLoading } = useWorkflowDetail(id || '');
    const { mutateAsync: createWorkflow, isPending: isCreating } = useCreateWorkflow();
    const { mutateAsync: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();

    // Populate initial state if editing existing workflow
    useEffect(() => {
        if (id && workflowDetail) {
            setWorkflowName(workflowDetail.name);
            setDescription(workflowDetail.description || '');
            builder.setInitialState(workflowDetail.steps || [], workflowDetail.transitions || []);
        } else if (!id) {
            setWorkflowName('');
            setDescription('');
            builder.setInitialState(
                [{ id: '1', step_name: 'Department Review', role_required: 'DEPT_HEAD', sort_order: 1 }],
                []
            );
        }
    }, [id, workflowDetail]);

    const handleAddStepClick = () => {
        setEditingStep(null);
        setStepNameInput('');
        setStepRoleInput('TEACHER');
        setIsStepDialogOpen(true);
    };

    const handleEditStepClick = (step: WorkflowStep) => {
        setEditingStep(step);
        setStepNameInput(step.step_name);
        setStepRoleInput(step.role_required);
        setIsStepDialogOpen(true);
    };

    const handleSaveStepDialog = () => {
        if (!stepNameInput) {
            toast({ variant: 'destructive', title: 'Error', description: 'Step name is required.' });
            return;
        }

        if (editingStep) {
            builder.updateStep(editingStep.id!, {
                step_name: stepNameInput,
                role_required: stepRoleInput
            });
        } else {
            builder.addStep(stepNameInput, stepRoleInput);
        }
        setIsStepDialogOpen(false);
    };

    const handleValidate = () => {
        const validation = builder.validateWorkflow();
        if (validation.valid) {
            toast({
                title: 'Check Passed',
                description: 'Review workflow configuration satisfies all integrity rules.'
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Validation Errors',
                description: validation.errors.join(' | ')
            });
        }
    };

    const handleSaveAndDeploy = async () => {
        if (!workflowName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Workflow name is required.' });
            return;
        }

        const validation = builder.validateWorkflow();
        if (!validation.valid) {
            toast({
                variant: 'destructive',
                title: 'Cannot Deploy',
                description: validation.errors.join(' | ')
            });
            return;
        }

        const payload = {
            name: workflowName,
            description,
            is_active: true,
            steps: builder.steps,
            transitions: builder.transitions
        };

        try {
            if (id) {
                await updateWorkflow({ id, payload });
                toast({ title: 'Success', description: 'Workflow updated and deployed successfully.' });
            } else {
                await createWorkflow(payload);
                toast({ title: 'Success', description: 'New workflow created and deployed successfully.' });
            }
            navigate('/app/assessment/settings');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to save workflow.'
            });
        }
    };

    if (id && isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Loading workflow details...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/app/assessment/settings')}
                        className="rounded-xl border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            <GitFork className="w-6 h-6 text-primary" /> 
                            {id ? 'Refactor Review Workflow' : 'Build Custom Workflow'}
                        </h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Connect review steps, roles constraints, and transition rules.
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={() => setIsPreviewOpen(true)}
                    className="rounded-xl border-gray-200 text-xs font-black flex items-center gap-1.5"
                >
                    <Eye className="w-4 h-4" /> Preview Layout
                </Button>
            </div>

            {/* Workflow properties input */}
            <div className="bg-white dark:bg-card border border-gray-100 p-6 rounded-2xl shadow-premium-sm grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-[11px] font-black text-gray-400 uppercase">Workflow Name</Label>
                    <Input
                        placeholder="e.g. Dean Merit Verification"
                        value={workflowName}
                        onChange={(e) => setWorkflowName(e.target.value)}
                        className="rounded-xl border-gray-200 h-10 font-bold"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-[11px] font-black text-gray-400 uppercase">Description (Optional)</Label>
                    <Input
                        placeholder="Purpose of this validation chain"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-xl border-gray-200 h-10 font-bold"
                    />
                </div>
            </div>

            {/* Canvas toolbar */}
            <WorkflowToolbar
                onAddStep={handleAddStepClick}
                onUndo={builder.undo}
                onRedo={builder.redo}
                canUndo={builder.canUndo}
                canRedo={builder.canRedo}
                zoom={builder.zoom}
                onZoomIn={() => builder.setZoom(Math.min(builder.zoom + 0.1, 1.5))}
                onZoomOut={() => builder.setZoom(Math.max(builder.zoom - 0.1, 0.6))}
                onValidate={handleValidate}
                onSave={handleSaveAndDeploy}
                isSaving={isCreating || isUpdating}
            />

            {/* Flow canvas designer */}
            <WorkflowCanvas
                steps={builder.steps}
                transitions={builder.transitions}
                zoom={builder.zoom}
                onEditStep={handleEditStepClick}
                onDeleteStep={builder.deleteStep}
                onAddStep={handleAddStepClick}
            />

            {/* Quick configurations button */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    onClick={() => setIsTransitionEditorOpen(true)}
                    className="rounded-xl border-gray-200 text-xs font-black shadow-premium-sm"
                >
                    🔗 Configure State Transition Rules ({builder.transitions.length})
                </Button>
            </div>

            {/* Dialog for Step Edit/Create */}
            <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black text-gray-900">
                            {editingStep ? 'Modify Review Step' : 'Add New Review Step'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-400">
                            Provide review step identifier and restrict actions to specific roles.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black text-gray-400 uppercase">Step Name</Label>
                            <Input
                                placeholder="e.g. Dean Approval"
                                value={stepNameInput}
                                onChange={(e) => setStepNameInput(e.target.value)}
                                className="rounded-xl border-gray-200"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] font-black text-gray-400 uppercase">Authorized Role Required</Label>
                            <Select value={stepRoleInput} onValueChange={setStepRoleInput}>
                                <SelectTrigger className="rounded-xl border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN" className="text-xs font-bold">ADMIN</SelectItem>
                                    <SelectItem value="EXAM_CELL_ADMIN" className="text-xs font-bold">EXAM_CELL_ADMIN</SelectItem>
                                    <SelectItem value="DEPT_HEAD" className="text-xs font-bold">DEPT_HEAD</SelectItem>
                                    <SelectItem value="FACULTY" className="text-xs font-bold">FACULTY</SelectItem>
                                    <SelectItem value="TEACHER" className="text-xs font-bold">TEACHER</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setIsStepDialogOpen(false)}
                            className="rounded-xl text-xs font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveStepDialog}
                            className="bg-primary text-white rounded-xl text-xs font-black px-5 shadow-premium-sm"
                        >
                            {editingStep ? 'Apply updates' : 'Add step'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transition Config Dialog */}
            <TransitionEditor
                open={isTransitionEditorOpen}
                onClose={() => setIsTransitionEditorOpen(false)}
                steps={builder.steps}
                transitions={builder.transitions}
                onSave={(updated) => {
                    builder.setInitialState(builder.steps, updated);
                    setIsTransitionEditorOpen(false);
                }}
            />

            {/* Visual Preview Modal */}
            <WorkflowPreview
                open={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                workflowName={workflowName}
                steps={builder.steps}
                transitions={builder.transitions}
            />
        </div>
    );
};
export default WorkflowBuilder;
