import { DashboardFilter } from '../types/dashboard.types';

export class DashboardFiltersManager {
    public static createDefault(): DashboardFilter {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        return {
            campusId: undefined,
            academicYearId: undefined,
            departmentId: undefined,
            branchId: undefined,
            dateRange: {
                start: startOfMonth.toISOString().split('T')[0],
                end: today.toISOString().split('T')[0]
            },
            status: 'all',
            classId: undefined,
            sectionId: undefined
        };
    }

    public static serialize(filters: DashboardFilter): Record<string, string> {
        const queryParams: Record<string, string> = {};

        if (filters.campusId) queryParams.campus_id = filters.campusId;
        if (filters.academicYearId) queryParams.academic_year_id = filters.academicYearId;
        if (filters.departmentId) queryParams.department_id = filters.departmentId;
        if (filters.branchId) queryParams.branch_id = filters.branchId;
        if (filters.status && filters.status !== 'all') queryParams.status = filters.status;
        if (filters.classId) queryParams.class_id = filters.classId;
        if (filters.sectionId) queryParams.section_id = filters.sectionId;

        if (filters.dateRange?.start) queryParams.start_date = filters.dateRange.start;
        if (filters.dateRange?.end) queryParams.end_date = filters.dateRange.end;

        return queryParams;
    }
}

export default DashboardFiltersManager;
