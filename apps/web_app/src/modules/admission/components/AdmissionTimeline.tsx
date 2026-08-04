import { Check, Clock, AlertCircle } from 'lucide-react';

export type TimelineStepStatus = 'complete' | 'current' | 'upcoming' | 'error';

export interface TimelineStep {
    id: string;
    label: string;
    description?: string;
    status: TimelineStepStatus;
    timestamp?: string;
}

interface AdmissionTimelineProps {
    steps: TimelineStep[];
}

export function AdmissionTimeline({ steps }: AdmissionTimelineProps) {
    return (
        <div className="flow-root">
            <ul role="list" className="-mb-8">
                {steps.map((step, stepIdx) => (
                    <li key={step.id}>
                        <div className="relative pb-8">
                            {stepIdx !== steps.length - 1 ? (
                                <span
                                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div>
                                    <span
                                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                            step.status === 'complete'
                                                ? 'bg-green-500 text-white'
                                                : step.status === 'current'
                                                ? 'bg-primary text-white animate-pulse'
                                                : step.status === 'error'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-100 text-gray-400'
                                        }`}
                                    >
                                        {step.status === 'complete' ? (
                                            <Check className="w-4 h-4" aria-hidden="true" />
                                        ) : step.status === 'error' ? (
                                            <AlertCircle className="w-4 h-4" aria-hidden="true" />
                                        ) : (
                                            <Clock className="w-4 h-4" aria-hidden="true" />
                                        )}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className={`text-sm font-black ${
                                            step.status === 'current' ? 'text-primary' : 'text-gray-900'
                                        }`}>
                                            {step.label}
                                        </p>
                                        {step.description && (
                                            <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                                        )}
                                    </div>
                                    {step.timestamp && (
                                        <div className="text-right text-xs whitespace-nowrap text-gray-400 font-medium">
                                            {step.timestamp}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Helper to generate default timeline based on backend AdmissionStatus
export const getAdmissionTimelineSteps = (currentStatus: string, auditLogs: any[] = []): TimelineStep[] => {
    const statusOrder = [
        { status: 'draft', label: 'Draft Started', desc: 'Application initiated' },
        { status: 'submitted', label: 'Submitted', desc: 'Application submitted by applicant' },
        { status: 'under_review', label: 'Under Review', desc: 'Under review by admission office' },
        { status: 'docs_verified', label: 'Documents Verified', desc: 'Document verification successful' },
        { status: 'payment_pending', label: 'Payment Pending', desc: 'Admission fee payment required' },
        { status: 'payment_submitted', label: 'Payment Submitted', desc: 'Proof submitted, awaiting verification' },
        { status: 'payment_verified', label: 'Payment Verified', desc: 'Finance verified admission fee' },
        { status: 'recommended', label: 'Recommended', desc: 'Recommended by Review Board' },
        { status: 'approved', label: 'Approved', desc: 'Admission offer letter approved' },
        { status: 'enrolled', label: 'Enrolled', desc: 'Handed over to Student Master' }
    ];

    const currentIdx = statusOrder.findIndex(s => s.status === currentStatus);

    return statusOrder.map((s, idx) => {
        let stepStatus: TimelineStepStatus = 'upcoming';
        if (currentStatus === 'rejected' && idx >= currentIdx) {
            stepStatus = 'error';
        } else if (idx < currentIdx || currentStatus === 'enrolled') {
            stepStatus = 'complete';
        } else if (idx === currentIdx) {
            stepStatus = 'current';
        }

        // Search in audit logs for timestamp
        const log = auditLogs.find(l => l.action.toLowerCase().includes(s.status));
        const timestamp = log ? new Date(log.created_at).toLocaleDateString() : undefined;

        return {
            id: s.status,
            label: s.label,
            description: s.desc,
            status: stepStatus,
            timestamp
        };
    });
};
