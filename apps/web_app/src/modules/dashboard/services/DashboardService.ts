import { DASHBOARD_CONSTANTS } from '../constants/DashboardConstants';
import { DashboardFilter, DashboardCard } from '../types/dashboard.types';
import { AdminDashboardService } from './AdminDashboardService';
import { FacultyDashboardService } from './FacultyDashboardService';
import { StudentDashboardService } from './StudentDashboardService';
import { ParentDashboardService } from './ParentDashboardService';
import { AdmissionDashboardService } from './AdmissionDashboardService';
import { ReceptionDashboardService } from './ReceptionDashboardService';
import { ExamDashboardService } from './ExamDashboardService';
import { PrincipalDashboardService } from './PrincipalDashboardService';

export class DashboardService {
    public static async getKPIsForRole(role: string, filters: DashboardFilter): Promise<DashboardCard[]> {
        switch (role) {
            case DASHBOARD_CONSTANTS.ROLES.ADMIN:
                return AdminDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.FACULTY:
                return FacultyDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.STUDENT:
                return StudentDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.PARENT:
                return ParentDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.COUNSELOR:
                return AdmissionDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.RECEPTIONIST:
                return ReceptionDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.FINANCE:
                return [];
            case DASHBOARD_CONSTANTS.ROLES.EXAM_CELL:
                return ExamDashboardService.getKPIs(filters);
            case DASHBOARD_CONSTANTS.ROLES.PRINCIPAL:
                return PrincipalDashboardService.getKPIs(filters);
            default:
                return [];
        }
    }
}

export default DashboardService;
export {
    AdminDashboardService,
    FacultyDashboardService,
    StudentDashboardService,
    ParentDashboardService,
    AdmissionDashboardService,
    ReceptionDashboardService,
    ExamDashboardService,
    PrincipalDashboardService
};

