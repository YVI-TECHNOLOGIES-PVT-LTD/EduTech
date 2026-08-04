import { useMemo } from 'react';
import { useApplication } from './useApplication';
import { useEnrollmentStatus } from './useEnrollment';
import { useFeesSummary } from './usePayments';
import {
    mapEnrollmentRecord,
    mapProvisioningSteps,
    mapValidationChecklist,
    resolveEnrollmentPhase,
    parseConfirmationFromRaw,
    type ProvisioningStep,
    type EnrollmentValidationItem,
    type EnrollmentPhase,
} from '../utils/enrollment.mapper';

export function useStudentProvisioning(applicationId?: string) {
    const { application, isLoading: appLoading } = useApplication(applicationId, { enabled: !!applicationId });
    const statusQuery = useEnrollmentStatus(applicationId);
    const feesQuery = useFeesSummary(applicationId ?? '');

    const confirmation = useMemo(
        () => parseConfirmationFromRaw(statusQuery.data),
        [statusQuery.data],
    );

    const phase: EnrollmentPhase | null = useMemo(() => {
        if (!application) return null;
        return resolveEnrollmentPhase(application, confirmation);
    }, [application, confirmation]);

    const validation: EnrollmentValidationItem[] = useMemo(() => {
        if (!application) return [];
        return mapValidationChecklist(application, confirmation, feesQuery.data);
    }, [application, confirmation, feesQuery.data]);

    const provisioningSteps: ProvisioningStep[] = useMemo(() => {
        if (!application || !phase) return [];
        return mapProvisioningSteps(application, confirmation, phase);
    }, [application, confirmation, phase]);

    const allValidationPassed = validation.length > 0 && validation.every(v => v.passed);

    return {
        application,
        confirmation: statusQuery.data,
        admissionNumber: confirmation?.admissionNumber,
        studentId: confirmation?.studentId,
        phase,
        validation,
        provisioningSteps,
        allValidationPassed,
        isLoading: appLoading || statusQuery.isLoading,
        refetch: () => Promise.all([statusQuery.refetch(), feesQuery.refetch()]),
    };
}

export type { ProvisioningStep, EnrollmentValidationItem, EnrollmentPhase };
