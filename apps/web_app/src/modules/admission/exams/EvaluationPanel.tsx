import { useState } from 'react';
import type { ExamRecord } from '../utils/exam.mapper';
import type { EvaluationAction } from '../utils/evaluation.workflow';
import { Button } from '../../../components/ui/button';
import { CheckCircle2, XCircle, RefreshCw, UserX, Send } from 'lucide-react';

interface EvaluationPanelProps {
    record: ExamRecord | null;
    canEvaluate?: boolean;
    canApprove?: boolean;
    canReject?: boolean;
    isSubmitting?: boolean;
    onAction: (action: EvaluationAction, payload?: { marksObtained?: number; candidateId?: string; subjectId?: string; remark?: string }) => void;
}

export function EvaluationPanel({
    record,
    canEvaluate,
    canApprove,
    canReject,
    isSubmitting,
    onAction,
}: EvaluationPanelProps) {
    const [marks, setMarks] = useState('');
    const [remark, setRemark] = useState('');

    if (!record) {
        return (
            <div className="border border-dashed rounded-2xl p-8 text-center text-sm text-gray-400">
                Select an exam record to evaluate.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card border rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-400">Evaluation Panel — {record.examName}</h3>

            {canEvaluate && record.passFail === 'PENDING' && (
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400">Marks Obtained</label>
                        <input
                            type="number"
                            value={marks}
                            onChange={e => setMarks(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-xs"
                            placeholder="Enter marks from exam sheet"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-400">Remarks</label>
                        <textarea
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-xl text-xs min-h-[60px]"
                            placeholder="Evaluator remarks…"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            className="h-8 text-[10px] gap-1 bg-indigo-600 text-white"
                            disabled={isSubmitting || !marks || !record.candidateId || !record.subjectId}
                            onClick={() =>
                                onAction('publish_result', {
                                    marksObtained: Number(marks),
                                    candidateId: record.candidateId,
                                    subjectId: record.subjectId,
                                    remark,
                                })
                            }
                        >
                            <Send className="w-3.5 h-3.5" /> Publish Result
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1"
                            disabled={isSubmitting}
                            onClick={() => onAction('mark_absent', { remark })}
                        >
                            <UserX className="w-3.5 h-3.5" /> Mark Absent
                        </Button>
                        {record.status === 'published' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] gap-1"
                                disabled={isSubmitting || !marks}
                                onClick={() =>
                                    onAction('reevaluate', {
                                        marksObtained: Number(marks),
                                        candidateId: record.candidateId,
                                        subjectId: record.subjectId,
                                        remark: remark || 'Re-evaluation',
                                    })
                                }
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Re-evaluate
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {(canApprove || canReject) && record.status === 'published' && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {canApprove && (
                        <Button
                            size="sm"
                            className="h-8 text-[10px] gap-1 bg-emerald-600 text-white"
                            disabled={isSubmitting}
                            onClick={() => onAction('approve_result', { remark: remark || 'Result approved' })}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve Result
                        </Button>
                    )}
                    {canReject && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] gap-1 border-rose-200 text-rose-600"
                            disabled={isSubmitting}
                            onClick={() => onAction('reject_result', { remark: remark || 'Result rejected' })}
                        >
                            <XCircle className="w-3.5 h-3.5" /> Reject Result
                        </Button>
                    )}
                </div>
            )}

            {record.passFail !== 'PENDING' && (
                <p className="text-[10px] text-gray-500">
                    Backend values: {record.percentage !== undefined ? `${record.percentage}%` : '—'} · {record.passFail}
                    {record.grade ? ` · ${record.grade}` : ''}
                </p>
            )}
        </div>
    );
}

export default EvaluationPanel;
