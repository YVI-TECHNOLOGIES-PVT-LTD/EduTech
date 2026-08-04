import { useMemo, useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useApplicationList } from './useApplication';
import { AdmissionEngine, ADMISSION_EVENTS } from '../core/AdmissionEngine';
import { admissionEventBus } from '../core/AdmissionEvents';
import {
    resolvePipelineWorkflowAction,
    canPipelineTransition,
    type UIAdmissionStatus,
} from '../core/AdmissionStatusMapper';
import { executeWorkflowAction, workflowActionToEvent } from '../utils/workflow.executor';
import {
    mapApplicationsToKanbanCards,
    filterPipelineCards,
} from '../utils/pipeline.mapper';
import type { KanbanCardData } from '../components/kanban/Card';
import { AdmissionPermissions, type PermissionContext } from '../core/AdmissionPermissions';
import type { WorkflowActionType } from './useWorkflow';

const REFRESH_EVENTS = [
    ADMISSION_EVENTS.APPLICATION_CREATED,
    ADMISSION_EVENTS.APPLICATION_UPDATED,
    ADMISSION_EVENTS.APPLICATION_LIST_CHANGED,
    ADMISSION_EVENTS.DOCUMENT_VERIFIED,
    ADMISSION_EVENTS.PAYMENT_VERIFIED,
    ADMISSION_EVENTS.OFFER_SENT,
    ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
    ADMISSION_EVENTS.INQUIRY_CONVERTED,
    ADMISSION_EVENTS.COUNSELOR_ASSIGNED,
    ADMISSION_EVENTS.QUEUE_REFRESH,
    ADMISSION_EVENTS.DASHBOARD_REFRESH,
    ADMISSION_EVENTS.TIMELINE_REFRESH,
] as const;

function canExecuteAction(action: WorkflowActionType, ctx: PermissionContext): boolean {
    switch (action) {
        case 'review':
        case 'verify':
            return AdmissionPermissions.canReviewApplications(ctx);
        case 'recommend':
            return ctx.hasPermission('admission.recommend') || AdmissionPermissions.isStaff(ctx);
        case 'approve':
            return ctx.hasPermission('admission.approve') || AdmissionPermissions.isPrincipal(ctx);
        case 'enrol':
            return AdmissionPermissions.canEnroll(ctx);
        case 'verify_fee':
            return AdmissionPermissions.canVerifyPayments(ctx) || AdmissionPermissions.canReviewApplications(ctx);
        case 'initiate_payment':
        case 'billing':
            return AdmissionPermissions.canReviewApplications(ctx);
        case 'reject':
            return AdmissionPermissions.canReviewApplications(ctx);
        default:
            return AdmissionPermissions.canReviewApplications(ctx);
    }
}

export function usePipeline(permissionCtx: PermissionContext, params?: { search?: string; status?: string }) {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState(params?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(params?.status ?? 'all');
    const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set());

    const { applications, isLoading, error, refetch } = useApplicationList({ limit: 200 });

    useEffect(() => {
        const unsubs = REFRESH_EVENTS.map(event =>
            admissionEventBus.subscribe(event, () => {
                refetch();
            }),
        );
        return () => unsubs.forEach(u => u());
    }, [refetch]);

    const cards = useMemo(
        () => mapApplicationsToKanbanCards(applications),
        [applications],
    );

    const filteredCards = useMemo(
        () => filterPipelineCards(cards, query, statusFilter === 'all' ? undefined : statusFilter),
        [cards, query, statusFilter],
    );

    const transitionMutation = useMutation({
        mutationFn: async ({
            card,
            targetColumn,
        }: {
            card: KanbanCardData;
            targetColumn: UIAdmissionStatus;
        }) => {
            const legacyStatus = card.legacyStatus ?? '';
            const action = resolvePipelineWorkflowAction(legacyStatus, targetColumn);
            if (!action) {
                throw new Error(`Transition from ${legacyStatus} to ${targetColumn} is not supported`);
            }
            if (!canExecuteAction(action, permissionCtx)) {
                throw new Error('You do not have permission for this workflow action');
            }

            const payload: Record<string, unknown> = {
                remark: `Pipeline transition to ${targetColumn}`,
            };
            if (action === 'initiate_payment') {
                payload.amount = card.paymentAmount ?? 0;
            }

            return executeWorkflowAction(card.id, action, payload);
        },
        onMutate: ({ card }) => {
            setTransitioningIds(prev => new Set(prev).add(card.id));
        },
        onSuccess: (_, { card, targetColumn }) => {
            const action = resolvePipelineWorkflowAction(card.legacyStatus ?? '', targetColumn);
            if (action) {
                const eventKey = workflowActionToEvent(action);
                const eventMap: Record<string, typeof ADMISSION_EVENTS[keyof typeof ADMISSION_EVENTS]> = {
                    DOCUMENT_VERIFIED: ADMISSION_EVENTS.DOCUMENT_VERIFIED,
                    PAYMENT_VERIFIED: ADMISSION_EVENTS.PAYMENT_VERIFIED,
                    FEE_PAID: ADMISSION_EVENTS.FEE_PAID,
                    ENROLLMENT_COMPLETED: ADMISSION_EVENTS.ENROLLMENT_COMPLETED,
                    ERP_STUDENT_CREATED: ADMISSION_EVENTS.ERP_STUDENT_CREATED,
                    APPLICATION_REVIEWED: ADMISSION_EVENTS.APPLICATION_REVIEWED,
                    APPLICATION_APPROVED: ADMISSION_EVENTS.APPLICATION_APPROVED,
                    APPLICATION_UPDATED: ADMISSION_EVENTS.APPLICATION_UPDATED,
                };
                AdmissionEngine.dispatch(queryClient, eventMap[eventKey] ?? ADMISSION_EVENTS.APPLICATION_UPDATED, { applicationId: card.id });
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.QUEUE_REFRESH);
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.DASHBOARD_REFRESH);
                AdmissionEngine.dispatch(queryClient, ADMISSION_EVENTS.TIMELINE_REFRESH, { applicationId: card.id });
            }
            toast.success(`Application moved to ${targetColumn.replace(/_/g, ' ')}`);
            refetch();
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Workflow transition failed');
        },
        onSettled: (_, __, variables) => {
            if (!variables?.card) return;
            setTransitioningIds(prev => {
                const next = new Set(prev);
                next.delete(variables.card.id);
                return next;
            });
        },
    });

    const handleStageTransition = useCallback(
        (cardId: string, fromStage: string, toStage: string) => {
            const card = cards.find(c => c.id === cardId);
            if (!card) return;

            const targetColumn = toStage as UIAdmissionStatus;
            if (!canPipelineTransition(card.legacyStatus ?? '', targetColumn)) {
                toast.error(`Cannot move from ${fromStage} to ${toStage}. Use the next valid stage.`);
                return;
            }

            transitionMutation.mutate({ card, targetColumn });
        },
        [cards, transitionMutation],
    );

    return {
        cards: filteredCards,
        allCards: cards,
        isLoading,
        error,
        refetch,
        query,
        setQuery,
        statusFilter,
        setStatusFilter,
        handleStageTransition,
        transitioningIds,
        isTransitioning: transitionMutation.isPending,
    };
}
