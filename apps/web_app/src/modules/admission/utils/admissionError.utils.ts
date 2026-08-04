export type AdmissionErrorKind = 'business_rule' | 'validation' | 'conflict' | 'permission' | 'unknown';

export interface ParsedAdmissionError {
    kind: AdmissionErrorKind;
    message: string;
    retryable: boolean;
}

const DUPLICATE_APPLICATION_MESSAGE =
    'This student already has an active admission application for the selected academic year.';

function extractMessage(error: unknown): string {
    const axiosErr = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
    const body = axiosErr.response?.data;
    return body?.error ?? body?.message ?? (error instanceof Error ? error.message : DUPLICATE_APPLICATION_MESSAGE);
}

export function parseAdmissionApiError(error: unknown): ParsedAdmissionError {
    const status = (error as { response?: { status?: number } })?.response?.status;
    const message = extractMessage(error);

    if (status === 400) {
        return { kind: 'validation', message, retryable: false };
    }
    if (status === 403) {
        return { kind: 'permission', message, retryable: false };
    }
    if (status === 409) {
        const normalized =
            message.includes('active admission application') ||
            message.includes('duplicate') ||
            message.includes('already exists') ||
            message.includes('already converted')
                ? DUPLICATE_APPLICATION_MESSAGE
                : message;
        const isConflict =
            normalized === DUPLICATE_APPLICATION_MESSAGE ||
            message.toLowerCase().includes('duplicate') ||
            message.toLowerCase().includes('concurrent');
        return {
            kind: isConflict ? 'conflict' : 'business_rule',
            message: normalized,
            retryable: !isConflict,
        };
    }
    return { kind: 'unknown', message, retryable: true };
}

export const ADMISSION_ERROR_LABELS: Record<AdmissionErrorKind, string> = {
    business_rule: 'Business Rule',
    validation: 'Validation Error',
    conflict: 'Conflict',
    permission: 'Permission Denied',
    unknown: 'Unexpected Error',
};
