import { useState } from 'react';
import type { InterviewRecord } from '../utils/interview.mapper';
import type { InterviewAction } from '../utils/interview.workflow';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, XCircle, UserCheck, UserX, Play, Save, Send } from 'lucide-react';

interface InterviewEvaluationProps {
    record: InterviewRecord | null;
    interviewIdOverride?: string;
    canEvaluate?: boolean;
    canRecommend?: boolean;
    canReject?: boolean;
    isSubmitting?: boolean;
    onAction: (action: InterviewAction, payload?: Record<string, unknown>) => void;
}

export function InterviewEvaluation({
    record,
    interviewIdOverride,
    canEvaluate,
    canRecommend,
    canReject,
    isSubmitting,
    onAction,
}: InterviewEvaluationProps) {
    const [remark, setRemark] = useState('');
    const [criterionId, setCriterionId] = useState('');
    const [score, setScore] = useState('');
    const [interviewId, setInterviewId] = useState('');

    const resolvedInterviewId = interviewIdOverride || record?.interviewId || interviewId;

    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-8 text-center text-sm text-gray-400">
                Select an interview record to evaluate.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">Panel Evaluation — {record.candidate}</h3>

            {canEvaluate && (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('start_interview', { remark: remark || 'Interview started' })}
                        >
                            <Play className="w-3.5 h-3.5" /> Start Interview
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('mark_present', { remark: remark || 'Present' })}
                        >
                            <UserCheck className="w-3.5 h-3.5" /> Mark Present
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('mark_absent', { remark: remark || 'Absent' })}
                        >
                            <UserX className="w-3.5 h-3.5" /> Mark Absent
                        </Button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400">Panel Remarks</label>
                        <textarea
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-xs min-h-[60px]"
                            placeholder="Panel observations…"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[10px] gap-1"
                        disabled={isSubmitting || !remark.trim()}
                        onClick={() => onAction('save_remarks', { remark })}
                    >
                        <Save className="w-3.5 h-3.5" /> Save Remarks
                    </Button>

                    <div className="pt-3 border-t border-gray-100 space-y-2">
                        <p className="text-[10px] font-black uppercase text-gray-400">Complete Interview (v1 API)</p>
                        {!resolvedInterviewId && (
                            <input
                                type="text"
                                value={interviewId}
                                onChange={e => setInterviewId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl text-xs"
                                placeholder="Interview ID (UUID)"
                            />
                        )}
                        <input
                            type="text"
                            value={criterionId}
                            onChange={e => setCriterionId(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                            placeholder="Criterion ID (UUID)"
                        />
                        <input
                            type="number"
                            min={0}
                            max={10}
                            value={score}
                            onChange={e => setScore(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl text-xs"
                            placeholder="Score (0–10, backend validated)"
                        />
                        <Button
                            size="sm"
                            className="h-8 text-[10px] gap-1 bg-indigo-600 text-white"
                            disabled={isSubmitting || !resolvedInterviewId || !criterionId || score === ''}
                            onClick={() =>
                                onAction('complete_interview', {
                                    interviewId: resolvedInterviewId,
                                    scores: [{ criterion_id: criterionId, score: Number(score), remarks: remark }],
                                    remark,
                                })
                            }
                        >
                            <Send className="w-3.5 h-3.5" /> Complete Interview
                        </Button>
                    </div>
                </div>
            )}

            {(canRecommend || canReject) && ['evaluated', 'scheduled', 'in_progress'].includes(record.status) && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {canRecommend && (
                        <Button
                            size="sm"
                            className="h-8 text-[10px] gap-1 bg-emerald-600 text-white"
                            disabled={isSubmitting}
                            onClick={() => onAction('recommend', { remark: remark || 'Recommended after interview' })}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Recommend
                        </Button>
                    )}
                    {canReject && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600"
                            disabled={isSubmitting}
                            onClick={() => onAction('reject', { remark: remark || 'Rejected after interview' })}
                        >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                    )}
                </div>
            )}

            {record.panelScore !== undefined && (
                <p className="text-[10px] text-gray-500">
                    Backend merit score: {record.panelScore} · {record.recommendation ?? 'PENDING'}
                </p>
            )}
        </div>
    );
}

export default InterviewEvaluation;
