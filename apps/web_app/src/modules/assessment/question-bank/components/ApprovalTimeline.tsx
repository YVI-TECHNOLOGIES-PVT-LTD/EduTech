import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { GitPullRequest, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useQuestionWorkflow } from '../hooks/useQuestionBank';
import { useToast } from '../../../../components/ui/use-toast';

interface ApprovalTimelineProps {
    questionId: string;
    currentStatus: string;
    onStatusChange: () => void;
}

export const ApprovalTimeline: React.FC<ApprovalTimelineProps> = ({
    questionId,
    currentStatus,
    onStatusChange
}) => {
    const { transitionQuestion, isTransitioning } = useQuestionWorkflow();
    const { toast } = useToast();
    const [reason, setReason] = useState('');

    const handleTransition = async (status: string) => {
        try {
            await transitionQuestion({
                id: questionId,
                definitionId: '00000000-0000-0000-0000-000000000000', // dummy/placeholder default def ID
                status,
                reason
            });
            toast({
                title: 'Workflow Transitioned',
                description: `Question status updated to ${status}.`
            });
            setReason('');
            onStatusChange();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Transition Failed',
                description: error.message
            });
        }
    };

    const steps = [
        { key: 'DRAFT', label: 'Draft' },
        { key: 'UNDER_REVIEW', label: 'Under Review' },
        { key: 'APPROVED', label: 'Approved' },
        { key: 'PUBLISHED', label: 'Published' },
        { key: 'ARCHIVED', label: 'Archived' }
    ];

    const currentIdx = steps.findIndex(s => s.key === currentStatus);

    return (
        <div className="space-y-4 bg-white dark:bg-card border border-gray-100 p-6 rounded-3xl shadow-premium-sm">
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <GitPullRequest className="w-4.5 h-4.5 text-primary" /> Review Approval Workflow
            </h4>

            {/* Steps indicator flow bar */}
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

            {/* Actions triggers depending on current status */}
            <div className="space-y-3 pt-3 border-t border-gray-50">
                <div className="space-y-1">
                    <Label className="text-[10px] font-black text-gray-400 uppercase">Audit / Transition Comment</Label>
                    <Textarea
                        placeholder="State reason for verification rollback or validation logs"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="rounded-xl border-gray-200 min-h-[60px] text-xs font-bold"
                    />
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                    {currentStatus === 'DRAFT' && (
                        <Button
                            onClick={() => handleTransition('UNDER_REVIEW')}
                            disabled={isTransitioning}
                            className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                        >
                            Submit for Review
                        </Button>
                    )}
                    {currentStatus === 'UNDER_REVIEW' && (
                        <>
                            <Button
                                onClick={() => handleTransition('DRAFT')}
                                variant="outline"
                                disabled={isTransitioning}
                                className="border-gray-200 text-gray-600 rounded-xl text-xs font-black h-9"
                            >
                                Reject (Draft)
                            </Button>
                            <Button
                                onClick={() => handleTransition('APPROVED')}
                                disabled={isTransitioning}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                            >
                                Approve Question
                            </Button>
                        </>
                    )}
                    {currentStatus === 'APPROVED' && (
                        <Button
                            onClick={() => handleTransition('PUBLISHED')}
                            disabled={isTransitioning}
                            className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                        >
                            Publish
                        </Button>
                    )}
                    {currentStatus !== 'ARCHIVED' && (
                        <Button
                            onClick={() => handleTransition('ARCHIVED')}
                            variant="ghost"
                            disabled={isTransitioning}
                            className="text-gray-400 hover:text-destructive hover:bg-destructive/5 rounded-xl text-xs font-black h-9"
                        >
                            Archive
                        </Button>
                    )}
                    {currentStatus === 'ARCHIVED' && (
                        <Button
                            onClick={() => handleTransition('DRAFT')}
                            disabled={isTransitioning}
                            className="bg-primary text-white rounded-xl text-xs font-black h-9 shadow-premium-sm"
                        >
                            Restore to Draft
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ApprovalTimeline;
