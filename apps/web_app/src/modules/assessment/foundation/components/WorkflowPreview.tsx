import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../components/ui/dialog';
import { GitPullRequest, ArrowRight, Eye, Shield } from 'lucide-react';
import { WorkflowStep, WorkflowTransition } from '../services/assessment.api';

interface WorkflowPreviewProps {
    open: boolean;
    onClose: () => void;
    workflowName: string;
    steps: WorkflowStep[];
    transitions: WorkflowTransition[];
}

export const WorkflowPreview: React.FC<WorkflowPreviewProps> = ({
    open,
    onClose,
    workflowName,
    steps,
    transitions
}) => {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-xl rounded-3xl p-6 bg-white dark:bg-card">
                <DialogHeader className="border-b border-gray-50 pb-4">
                    <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-1.5">
                        <Eye className="w-5 h-5 text-primary" /> Previewing Review Structure
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400">
                        Visualizing active hierarchy and approval paths for "{workflowName || 'Workflow'}".
                    </DialogDescription>
                </DialogHeader>

                <div className="py-8 flex flex-col items-center gap-4">
                    {/* Visual diagram wrapper */}
                    <div className="flex flex-col items-center gap-6 w-full max-w-md bg-gray-50/50 p-6 rounded-2xl border border-gray-100/50">
                        {/* Start Node */}
                        <div className="flex items-center justify-center bg-gray-100 text-gray-600 font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-premium-sm border border-gray-200/50">
                            Draft Created
                        </div>

                        {steps.length === 0 ? (
                            <div className="text-xs text-gray-400 py-4 font-bold">No steps defined. Add review steps to view preview.</div>
                        ) : (
                            steps.map((step, idx) => (
                                <React.Fragment key={step.id || idx}>
                                    <div className="text-gray-300">
                                        <ArrowRight className="w-5 h-5 rotate-90" />
                                    </div>
                                    
                                    <div className="flex items-center gap-3 w-full bg-white border border-gray-100 p-4 rounded-xl shadow-premium-sm hover:border-primary/20 transition-all">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs">
                                            {step.sort_order}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-900 leading-tight truncate">
                                                {step.step_name}
                                            </p>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold mt-1">
                                                <Shield className="w-3 h-3 text-primary/70" /> Required: {step.role_required}
                                            </p>
                                        </div>
                                    </div>
                                </React.Fragment>
                            ))
                        )}

                        <div className="text-gray-300">
                            <ArrowRight className="w-5 h-5 rotate-90" />
                        </div>

                        {/* End Node */}
                        <div className="flex items-center justify-center bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-premium-sm border border-emerald-600">
                            Approved & Published
                        </div>
                    </div>

                    {/* Transitions config list */}
                    {transitions.length > 0 && (
                        <div className="w-full mt-4 space-y-2">
                            <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Transition Pathways</h5>
                            <div className="grid gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {transitions.map((t, idx) => (
                                    <div key={t.id || idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-2 px-3 rounded-lg text-[11px] text-gray-600 font-bold">
                                        <span className="text-gray-800">{t.from_status}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                        <span className="text-gray-800">{t.to_status}</span>
                                        {t.rule_condition && (
                                            <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                [{t.rule_condition}]
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
export default WorkflowPreview;
