import type { Admission } from '../types/admission.types';
import type { KanbanCardData } from '../components/kanban/Card';
import {
    getPipelineColumnId,
    getProgressPercentage,
    computeApplicationSla,
    formatStatusLabel,
} from '../core/AdmissionStatusMapper';

function mapDocumentStatus(app: Admission): KanbanCardData['documentStatus'] {
    const docs = app.admission_documents ?? [];
    if (docs.length === 0) return 'missing';
    const verifiedStatuses = ['docs_verified', 'payment_pending', 'payment_submitted', 'payment_verified', 'recommended', 'approved', 'enrolled'];
    if (verifiedStatuses.includes(app.status)) return 'complete';
    return 'pending';
}

function formatRelativeTime(dateStr?: string): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export function mapApplicationToKanbanCard(app: Admission): KanbanCardData {
    const sla = computeApplicationSla(app.status, app.submitted_at, app.created_at);
    const columnId = getPipelineColumnId(app.status);

    return {
        id: app.id,
        code: app.id.slice(0, 8).toUpperCase(),
        name: app.student_name,
        grade: app.grade_applied_for?.replace(/^Grade\s*/i, '') ?? '—',
        status: columnId,
        legacyStatus: app.status,
        counselor: app.remark_by_officer ? 'Admission Officer' : undefined,
        score: getProgressPercentage(app.status),
        slaProgress: sla.progress,
        slaStatus: sla.status,
        slaRemainingHours: sla.remainingHours,
        documentStatus: mapDocumentStatus(app),
        updatedAt: formatRelativeTime(app.updated_at ?? app.submitted_at ?? app.created_at),
        paymentAmount: app.payment_amount,
    };
}

export function mapApplicationsToKanbanCards(applications: Admission[]): KanbanCardData[] {
    return applications.map(mapApplicationToKanbanCard);
}

export function filterPipelineCards(
    cards: KanbanCardData[],
    query: string,
    statusFilter?: string,
): KanbanCardData[] {
    const q = query.trim().toLowerCase();
    return cards.filter(card => {
        if (statusFilter && statusFilter !== 'all' && card.status !== statusFilter) return false;
        if (!q) return true;
        return [
            card.name,
            card.code,
            card.grade,
            card.counselor,
            card.legacyStatus,
            formatStatusLabel(card.legacyStatus ?? ''),
        ]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(q));
    });
}

export function pipelineCardToExportRow(card: KanbanCardData): Record<string, string> {
    return {
        Code: card.code,
        Student: card.name,
        Grade: card.grade,
        Stage: card.status,
        Status: card.legacyStatus ?? '',
        SLA: card.slaStatus,
        Documents: card.documentStatus,
        Updated: card.updatedAt,
    };
}
