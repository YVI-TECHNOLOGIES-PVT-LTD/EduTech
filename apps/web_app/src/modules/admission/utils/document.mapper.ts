import type { AdmissionDocument } from '../types';

export function mapDocuments(docs?: AdmissionDocument[]): AdmissionDocument[] {
    return docs ?? [];
}

export function mapDocumentList(data: unknown): AdmissionDocument[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as AdmissionDocument[];
    return [];
}
