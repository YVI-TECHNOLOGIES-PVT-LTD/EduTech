import { apiClient } from '../../../lib/api-client';

export interface SearchResultItem {
    id: string;
    title: string;
    subtitle: string;
    type: 'Student' | 'Admission' | 'Fee' | 'General';
    link: string;
}

export class DashboardSearchService {
    public static async querySearch(term: string): Promise<SearchResultItem[]> {
        if (!term || term.trim().length < 2) return [];
        const query = term.toLowerCase();

        try {
            // Retrieve both students and admissions using existing endpoints
            const [studentsRes, admissionsRes] = await Promise.all([
                apiClient.get('/students', { params: { search: query, limit: 5 } }).catch(() => ({ data: [] })),
                apiClient.get('/admissions', { params: { search: query, limit: 5 } }).catch(() => ({ data: [] }))
            ]);

            const students = Array.isArray(studentsRes.data) 
                ? studentsRes.data 
                : studentsRes.data?.data || [];
            
            const admissions = Array.isArray(admissionsRes.data) 
                ? admissionsRes.data 
                : admissionsRes.data?.data || [];

            const results: SearchResultItem[] = [];

            // Map matching students
            students.forEach((s: any) => {
                results.push({
                    id: s.id,
                    title: `${s.first_name || ''} ${s.last_name || ''}`,
                    subtitle: `Roll: ${s.roll_number || 'N/A'} | Class: ${s.class?.name || 'Unassigned'}`,
                    type: 'Student',
                    link: `/app/students/${s.id}`
                });
            });

            // Map matching admissions
            admissions.forEach((a: any) => {
                results.push({
                    id: a.id,
                    title: `${a.first_name || ''} ${a.last_name || ''}`,
                    subtitle: `App Ref: ${a.application_number || 'N/A'} | Status: ${a.status || 'Draft'}`,
                    type: 'Admission',
                    link: `/app/admissions/review`
                });
            });

            return results;
        } catch (e) {
            console.error('Search failed', e);
            return [];
        }
    }
}

export default DashboardSearchService;
