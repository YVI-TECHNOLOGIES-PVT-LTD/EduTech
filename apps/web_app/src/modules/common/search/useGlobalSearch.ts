import { useCallback, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import type { SearchResultItem } from '../types';

const NAV_RESULTS: SearchResultItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard', module: 'navigation', href: '/app/dashboard' },
    { id: 'nav-students', label: 'Student List', module: 'students', href: '/app/students' },
    { id: 'nav-admissions', label: 'Admissions Review', module: 'admissions', href: '/app/admissions/review' },
    { id: 'nav-attendance', label: 'Attendance', module: 'attendance', href: '/app/admin/attendance' },
    { id: 'nav-fees', label: 'Fee Payment', module: 'finance', href: '/app/fees/payment-entry' },
    { id: 'nav-transport', label: 'Transport', module: 'transport', href: '/app/transport/setup' },
    { id: 'nav-exams', label: 'Exams', module: 'exams', href: '/app/exam-admin/manage' },
];

export function useGlobalSearch() {
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);

    const search = useCallback(async (query: string, category: string) => {
        setLoading(true);
        try {
            const q = query.toLowerCase();
            const navMatches = NAV_RESULTS.filter(
                r =>
                    (category === 'all' || r.module === category) &&
                    r.label.toLowerCase().includes(q),
            );

            const apiResults: SearchResultItem[] = [];

            if (category === 'all' || category === 'admissions') {
                try {
                    const res = await apiClient.get('/v1/admission/application', { params: { search: query, limit: 5 } });
                    const items = res.data?.data || res.data?.admissions || res.data || [];
                    (Array.isArray(items) ? items : []).slice(0, 5).forEach((a: { id: string; student_name?: string; applicant_name?: string; application_code?: string }) => {
                        apiResults.push({
                            id: `adm-${a.id}`,
                            label: a.student_name || a.applicant_name || a.application_code || 'Application',
                            sub: a.application_code,
                            module: 'admissions',
                            href: `/app/admissions/${a.id}`,
                        });
                    });
                } catch {
                    /* use nav only */
                }
            }

            if (category === 'all' || category === 'students') {
                try {
                    const res = await apiClient.get('/students', { params: { search: query, limit: 5 } });
                    const items = res.data?.data || res.data?.students || res.data || [];
                    (Array.isArray(items) ? items : []).slice(0, 5).forEach((s: { id: string; first_name?: string; last_name?: string; admission_number?: string }) => {
                        apiResults.push({
                            id: `stu-${s.id}`,
                            label: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student',
                            sub: s.admission_number,
                            module: 'students',
                            href: `/app/students/${s.id}`,
                        });
                    });
                } catch {
                    /* use nav only */
                }
            }

            setResults([...navMatches, ...apiResults]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { results, loading, search };
}
