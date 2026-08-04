import React from 'react';
import { Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface TimelineStep {
    id: string;
    old_status: string;
    new_status: string;
    reason: string;
    changed_by: string;
    changed_at: string;
}

interface StudentTimelineProps {
    steps: TimelineStep[];
}

export const StudentTimeline: React.FC<StudentTimelineProps> = ({ steps }) => {
    if (!steps || steps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-xl border border-gray-100">
                <Clock className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-500">No lifecycle events recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
            {steps.map(step => (
                <div key={step.id} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center shrink-0 z-10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 uppercase">
                                <span className="text-gray-400">{step.old_status || 'NEW'}</span>
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <span className="text-primary">{step.new_status}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(step.changed_at || Date.now()).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-medium">{step.reason || 'Status transitioned.'}</p>
                        <div className="flex items-center gap-1 mt-3 text-[10px] text-gray-400">
                            <User className="w-3 h-3" />
                            <span>Action by: {step.changed_by || 'System Administrator'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StudentTimeline;
