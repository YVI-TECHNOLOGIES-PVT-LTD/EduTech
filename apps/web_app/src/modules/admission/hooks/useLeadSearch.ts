import { useState, useMemo, useEffect } from 'react';
import type { Lead, AdmissionInquiry } from '../types/admission.types';

export interface LeadSearchFilters {
    student?: string;
    parent?: string;
    phone?: string;
    email?: string;
    inquiryNumber?: string;
    program?: string;
    counselor?: string;
    status?: string;
}

const DEBOUNCE_MS = 300;

function matchesQuery(record: AdmissionInquiry | Lead, query: string, filters: LeadSearchFilters): boolean {
    const q = query.trim().toLowerCase();
    const fields = [
        record.student_name,
        record.parent_name,
        record.phone,
        record.parent_phone,
        record.email,
        record.parent_email,
        record.inquiry_number,
        record.grade_applied_for,
        record.assigned_counselor,
        record.status,
        record.source,
    ]
        .filter(Boolean)
        .map(v => String(v).toLowerCase());

    if (q && !fields.some(f => f.includes(q))) return false;

    if (filters.student && !record.student_name?.toLowerCase().includes(filters.student.toLowerCase())) return false;
    if (filters.parent && !record.parent_name?.toLowerCase().includes(filters.parent.toLowerCase())) return false;
    if (filters.phone) {
        const p = filters.phone.replace(/\D/g, '');
        const rp = (record.phone ?? record.parent_phone ?? '').replace(/\D/g, '');
        if (!rp.includes(p)) return false;
    }
    if (filters.email) {
        const e = (record.email ?? record.parent_email ?? '').toLowerCase();
        if (!e.includes(filters.email.toLowerCase())) return false;
    }
    if (filters.inquiryNumber && !record.inquiry_number?.toLowerCase().includes(filters.inquiryNumber.toLowerCase())) return false;
    if (filters.program && !record.grade_applied_for?.toLowerCase().includes(filters.program.toLowerCase())) return false;
    if (filters.counselor && !record.assigned_counselor?.toLowerCase().includes(filters.counselor.toLowerCase())) return false;
    if (filters.status && !record.status?.toLowerCase().includes(filters.status.toLowerCase())) return false;

    return true;
}

export function useLeadSearch(records: (Lead | AdmissionInquiry)[]) {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState<LeadSearchFilters>({});
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [debouncedFilters, setDebouncedFilters] = useState<LeadSearchFilters>({});

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setDebouncedFilters(filters);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query, filters]);

    const results = useMemo(
        () => records.filter(r => matchesQuery(r, debouncedQuery, debouncedFilters)),
        [records, debouncedQuery, debouncedFilters],
    );

    return {
        query,
        setQuery,
        filters,
        setFilters,
        results,
        isSearching: query !== debouncedQuery,
        total: records.length,
        filteredCount: results.length,
    };
}
