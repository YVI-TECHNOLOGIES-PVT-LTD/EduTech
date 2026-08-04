import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBlueprint, useBlueprintWorkflow, useBlueprintVersions } from '../hooks/useBlueprintBuilder';
import { DifficultyChart } from '../components/DifficultyChart';
import { BloomChart } from '../components/BloomChart';
import { ArrowLeft, Loader2, Clipboard, ShieldCheck, GitPullRequest, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { useToast } from '../../../../components/ui/use-toast';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';

export const BlueprintPreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: blueprint, isLoading, refetch } = useBlueprint(id || '');
    const { transitionBlueprint, isTransitioning } = useBlueprintWorkflow();
    const [reason, setReason] = useState('');

    const handleTransition = async (status: string) => {
        try {
            await transitionBlueprint({ id: id!, status, reason });
            toast({ title: 'Status Updated', description: `Blueprint status set to ${status}.` });
            setReason('');
            refetch();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Transition Failed', description: error.message });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying blueprint context...</span>
            </div>
        );
    }

    if (!blueprint) return null;

    const steps = [
        { key: 'DRAFT', label: 'Draft' },
        { key: 'UNDER_REVIEW', label: 'Under Review' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'PUBLISHED', label: 'Published' },
        { key: 'ARCHIVED', label: 'Archived' }
    ];

    const currentIdx = steps.findIndex(s => s.key === blueprint.status);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/app/assessment/blueprints')}
                        className="rounded-xl border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            {blueprint.name}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Version v{blueprint.version} | Subject ID: {blueprint.subject_id}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/assessment/blueprints/${id}/edit`)}
                        className="rounded-xl text-xs font-black border-gray-200 h-10"
                    >
                        Edit Rules
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/assessment/blueprints/${id}/history`)}
                        className="rounded-xl text-xs font-black border-gray-200 h-10"
                    >
                        View Timeline
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    {/* Section details */}
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-6">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Clipboard className="w-4.5 h-4.5 text-primary" /> Blueprint Sections & Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {blueprint.sections?.map((sec: any, idx: number) => (
                                <div key={idx} className="p-4 border border-gray-100 rounded-2xl bg-slate-50/20">
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-50 mb-3">
                                        <h5 className="text-xs font-black text-gray-800">{sec.section_name}</h5>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {sec.total_questions} questions × {sec.points_per_question} pts
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {sec.rules?.map((r: any, rIdx: number) => (
                                            <Badge key={rIdx} className="text-[9px] font-black bg-primary/10 text-primary border-primary/25 rounded-md py-0.5">
                                                {r.filter_field}: {r.filter_value}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Charts grid */}
                    <div className="grid sm:grid-cols-2 gap-6">
                        <DifficultyChart distribution={blueprint.difficulty_distribution} />
                        <BloomChart distribution={blueprint.bloom_distribution} />
                    </div>
                </div>

                {/* Workflow Transitions */}
                <div className="md:col-span-1 space-y-6">
                    <div className="space-y-4 bg-white dark:bg-card border border-gray-100 p-6 rounded-3xl shadow-premium-sm">
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                            <GitPullRequest className="w-4.5 h-4.5 text-primary" /> Review Approval Workflow
                        </h4>

                        <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
                            {steps.map((step, idx) => (
                                <React.Fragment key={step.key}>
                                    <div className="flex flex-col items-center shrink-0">
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black border transition-all ${
                                            idx <= currentIdx 
                                                ? 'bg-primary border-primary text-white shadow-sm' 
                                                : 'bg-white border-gray-200 text-gray-400'
                                        }`}>
                                            {idx + 1}
                                        </span>
                                        <span className={`text-[9px] font-black mt-1.5 uppercase ${
                                            idx === currentIdx ? 'text-primary' : 'text-gray-400'
                                        }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <ArrowRight className="w-4 h-4 text-gray-200 shrink-0 mt-[-14px]" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="space-y-3 pt-3 border-t border-gray-50">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Transition Comment</Label>
                                <Textarea
                                    placeholder="Enter transition details..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="rounded-xl border-gray-200 min-h-[60px] text-xs font-bold"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end">
                                {blueprint.status === 'DRAFT' && (
                                    <Button
                                        onClick={() => handleTransition('UNDER_REVIEW')}
                                        disabled={isTransitioning}
                                        className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                                    >
                                        Submit for Review
                                    </Button>
                                )}
                                {blueprint.status === 'UNDER_REVIEW' && (
                                    <>
                                        <Button
                                            onClick={() => handleTransition('DRAFT')}
                                            variant="outline"
                                            disabled={isTransitioning}
                                            className="border-gray-200 text-gray-600 rounded-xl text-xs font-black h-9"
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={() => handleTransition('APPROVED')}
                                            disabled={isTransitioning}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                                        >
                                            Approve
                                        </Button>
                                    </>
                                )}
                                {blueprint.status === 'APPROVED' && (
                                    <Button
                                        onClick={() => handleTransition('PUBLISHED')}
                                        disabled={isTransitioning}
                                        className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                                    >
                                        Publish
                                    </Button>
                                )}
                                {blueprint.status !== 'ARCHIVED' && (
                                    <Button
                                        onClick={() => handleTransition('ARCHIVED')}
                                        variant="ghost"
                                        disabled={isTransitioning}
                                        className="text-gray-400 hover:text-destructive hover:bg-destructive/5 rounded-xl text-xs font-black h-9"
                                    >
                                        Archive
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default BlueprintPreviewPage;
