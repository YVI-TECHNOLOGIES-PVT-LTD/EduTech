import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTemplateDetail, useTemplateWorkflow } from '../hooks/useTemplateBuilder';
import { TemplateLivePreview } from '../components/TemplateLivePreview';
import { ArrowLeft, Loader2, Clipboard, ShieldCheck, GitPullRequest, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '../../../../components/ui/use-toast';

export const TemplatePreviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: template, isLoading, refetch } = useTemplateDetail(id);
    const { transitionTemplate, isTransitioning } = useTemplateWorkflow();
    const [reason, setReason] = useState('');

    const handleTransition = async (status: string) => {
        try {
            await transitionTemplate({ id: id!, status, reason });
            toast({
                title: 'Workflow Transitioned',
                description: `Successfully transitioned template status to ${status}.`
            });
            setReason('');
            refetch();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Transition Failed',
                description: error.message
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-sm text-gray-500 font-bold">Querying template contract...</span>
            </div>
        );
    }

    if (!template) return null;

    const steps = [
        { key: 'DRAFT', label: 'Draft' },
        { key: 'UNDER_REVIEW', label: 'Under Review' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'PUBLISHED', label: 'Published' },
        { key: 'ARCHIVED', label: 'Archived' }
    ];

    const currentIdx = steps.findIndex(s => s.key === template.status);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/app/assessment/templates')}
                        className="rounded-xl border-gray-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                            {template.name}
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Version v{template.version} | Subject ID: {template.subject_id}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/assessment/templates/${id}/edit`)}
                        className="rounded-xl text-xs font-black border-gray-200 h-10"
                    >
                        Edit Layout
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/app/assessment/templates/${id}/history`)}
                        className="rounded-xl text-xs font-black border-gray-200 h-10"
                    >
                        View Timeline
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <TemplateLivePreview templateId={id!} />

                    {/* Section details */}
                    <Card className="rounded-3xl border border-gray-100 shadow-premium-sm bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 p-6">
                            <CardTitle className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Clipboard className="w-4.5 h-4.5 text-primary" /> Template Sections Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {template.sections?.map((sec: any, idx: number) => (
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
                </div>

                {/* Workflow Transitions */}
                <div className="md:col-span-1 space-y-6">
                    <div className="space-y-4 bg-white border border-gray-100 p-6 rounded-3xl shadow-premium-sm">
                        <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                            <GitPullRequest className="w-4.5 h-4.5 text-primary" /> Workflow Transitions
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
                                <Label className="text-[10px] font-black text-gray-400 uppercase">Transition Remarks</Label>
                                <Textarea
                                    placeholder="Enter transition notes..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="rounded-xl border-gray-200 min-h-[60px] text-xs font-bold"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 justify-end">
                                {template.status === 'DRAFT' && (
                                    <Button
                                        onClick={() => handleTransition('UNDER_REVIEW')}
                                        disabled={isTransitioning}
                                        className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                                    >
                                        Submit for Review
                                    </Button>
                                )}
                                {template.status === 'UNDER_REVIEW' && (
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
                                {template.status === 'APPROVED' && (
                                    <Button
                                        onClick={() => handleTransition('PUBLISHED')}
                                        disabled={isTransitioning}
                                        className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                                    >
                                        Publish
                                    </Button>
                                )}
                                {template.status !== 'ARCHIVED' && (
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
export default TemplatePreviewPage;
