export function mapStatusToEnterpriseLabel(status?: string | null): string {
    if (!status) return 'Draft';
    
    const key = status.toLowerCase().trim();
    switch (key) {
        case 'draft':
            return 'Draft';
        case 'submitted':
            return 'Submitted';
        case 'under_review':
            return 'Under Review';
        case 'docs_pending':
            return 'Documents Pending';
        case 'document_verified':
        case 'docs_verified':
            return 'Documents Verified';
        case 'interview':
            return 'Interview';
        case 'interview_completed':
            return 'Interview Completed';
        case 'exam':
            return 'Entrance Exam';
        case 'exam_completed':
            return 'Exam Completed';
        case 'merit_generated':
            return 'Merit Generated';
        case 'fee_pending':
            return 'Fee Pending';
        case 'fee_verified':
            return 'Financial Clearance';
        case 'review_pending':
            return 'Committee Review';
        case 'approved':
            return 'Approved';
        case 'offered':
            return 'Offer Released';
        case 'enrollment_pending':
            return 'Enrollment Pending';
        case 'enrolled':
            return 'Enrolled';
        case 'rejected':
            return 'Rejected';
        case 'cancelled':
            return 'Cancelled';
        default:
            return key
                .split(/[_\s]+/)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
    }
}

export function mapStatusToColor(status?: string | null): string {
    if (!status) return 'bg-gray-500';
    const key = status.toLowerCase().trim();
    switch (key) {
        case 'draft':
            return 'bg-gray-500';
        case 'submitted':
            return 'bg-yellow-500';
        case 'under_review':
            return 'bg-blue-500';
        case 'docs_pending':
            return 'bg-orange-500';
        case 'document_verified':
        case 'docs_verified':
            return 'bg-emerald-500';
        case 'interview':
        case 'interview_completed':
            return 'bg-indigo-500';
        case 'exam':
        case 'exam_completed':
            return 'bg-pink-500';
        case 'merit_generated':
            return 'bg-teal-500';
        case 'fee_pending':
            return 'bg-amber-500';
        case 'fee_verified':
            return 'bg-emerald-600';
        case 'review_pending':
            return 'bg-sky-500';
        case 'approved':
            return 'bg-emerald-500';
        case 'offered':
            return 'bg-violet-500';
        case 'enrollment_pending':
            return 'bg-cyan-500';
        case 'enrolled':
            return 'bg-emerald-600';
        case 'rejected':
            return 'bg-red-500';
        case 'cancelled':
            return 'bg-rose-700';
        default:
            return 'bg-gray-500';
    }
}

export function mapStatusToStep(status?: string | null): number {
    if (!status) return 1;
    const key = status.toLowerCase().trim();
    const order = [
        'draft',
        'submitted',
        'under_review',
        'docs_pending',
        'docs_verified',
        'document_verified',
        'interview',
        'interview_completed',
        'exam',
        'exam_completed',
        'merit_generated',
        'fee_pending',
        'fee_verified',
        'review_pending',
        'approved',
        'offered',
        'enrollment_pending',
        'enrolled'
    ];
    const idx = order.indexOf(key);
    if (idx === -1) return 1;
    const percentage = idx / (order.length - 1);
    return Math.max(1, Math.min(7, Math.ceil(percentage * 7)));
}
