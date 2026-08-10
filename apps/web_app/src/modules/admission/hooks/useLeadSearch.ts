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

function matchesQuery(record: any, query: string, filters: LeadSearchFilters): boolean {
    const q = query.trim().toLowerCase();
    const studentName = record.student_name || record.studentName;
    const parentName = record.parent_name || record.parentName;
    const phone = record.phone || record.parent_phone;
    const email = record.email || record.parent_email;
    const inquiryNumber = record.inquiry_number || record.leadNumber;
    const gradeAppliedFor = record.grade_applied_for || record.gradeApplyingFor;
    const assignedCounselor = record.assigned_counselor;
    const fields = [
        studentName,
        parentName,
        phone,
        email,
        inquiryNumber,
        gradeAppliedFor,
        assignedCounselor,
        record.status,
        record.source,
    ]
        .filter(Boolean)
        .map(v => String(v).toLowerCase());

    if (q && !fields.some(f => f.includes(q))) return false;

    if (filters.student && !studentName?.toLowerCase().includes(filters.student.toLowerCase())) return false;
    if (filters.parent && !parentName?.toLowerCase().includes(filters.parent.toLowerCase())) return false;
    if (filters.phone) {
        const p = filters.phone.replace(/\D/g, '');
        const rp = (phone ?? '').replace(/\D/g, '');
        if (!rp.includes(p)) return false;
    }
    if (filters.email) {
        const e = (email ?? '').toLowerCase();
        if (!e.includes(filters.email.toLowerCase())) return false;
    }
    if (filters.inquiryNumber && !inquiryNumber?.toLowerCase().includes(filters.inquiryNumber.toLowerCase())) return false;
    if (filters.program && !gradeAppliedFor?.toLowerCase().includes(filters.program.toLowerCase())) return false;
    if (filters.counselor && !assignedCounselor?.toLowerCase().includes(filters.counselor.toLowerCase())) return false;
    if (filters.status && !record.status?.toLowerCase().includes(filters.status.toLowerCase())) return false;

    return true;
}

export function useLeadSearch(records: any[]) {
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
