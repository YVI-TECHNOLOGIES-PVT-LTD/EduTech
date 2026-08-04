import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { useWorkflowsList, useDeleteWorkflow } from '../hooks/useWorkflows';
import { useToast } from '../../../../components/ui/use-toast';
import { GitBranch, Trash2, Edit2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function WorkflowList() {
    const { data: workflows, isLoading } = useWorkflowsList();
    const { mutateAsync: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workflow definition?')) return;
        try {
            await deleteWorkflow(id);
            toast({
                title: 'Success',
                description: 'Workflow definition deleted.'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.error || error.message || 'Failed to delete workflow.'
            });
        }
    };

    if (isLoading) {
        return (
            <Card className="rounded-2xl border border-gray-100 shadow-sm">
                <CardContent className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-2 text-sm text-gray-500 font-bold">Loading active workflows...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-50 pb-4">
                <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-primary" /> Multi-Step Workflows
                </CardTitle>
                <CardDescription className="text-xs text-gray-400">
                    Review and configure academic blueprint approval sequences for peer audit checks.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                {!workflows || workflows.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-xs text-gray-400 font-bold">No custom workflows defined yet.</p>
                    </div>
                ) : (
                    workflows.map((wf: any) => (
                        <div key={wf.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                        {wf.name}
                                        <Badge className={`text-[9px] font-black rounded-full ${wf.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-600'}`}>
                                            {wf.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </h3>
                                    {wf.description && <p className="text-[10px] text-gray-400 mt-1">{wf.description}</p>}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        onClick={() => navigate(`/app/assessment/workflows/${wf.id}/edit`)}
                                        size="icon"
                                        variant="outline"
                                        className="w-7 h-7 rounded-lg text-gray-500 border-gray-200"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(wf.id)}
                                        size="icon"
                                        variant="outline"
                                        disabled={isDeleting}
                                        className="w-7 h-7 rounded-lg text-red-500 border-gray-200 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Approval Steps flow */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-200/50">
                                {wf.steps?.length === 0 ? (
                                    <span className="text-[10px] text-gray-400 font-bold">No steps defined.</span>
                                ) : (
                                    wf.steps.map((step: any, idx: number) => (
                                        <div key={step.id || idx} className="flex items-center gap-1.5">
                                            <div className="px-2 py-1 bg-white border border-gray-100 rounded-lg shadow-sm text-[10px] font-bold text-gray-700">
                                                <span className="text-gray-400 mr-1">#{step.sort_order}</span>
                                                {step.step_name} <span className="text-primary font-black">({step.role_required})</span>
                                            </div>
                                            {idx < wf.steps.length - 1 && (
                                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
export default WorkflowList;
