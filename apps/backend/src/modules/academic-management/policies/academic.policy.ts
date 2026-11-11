import { PERMISSIONS, PermissionCode } from '../../../rbac/permissions';

export class AcademicPolicy {
  static canView(): PermissionCode {
    return PERMISSIONS.ACADEMIC_VIEW as PermissionCode;
  }

  static canCreate(): PermissionCode {
    return PERMISSIONS.ACADEMIC_SETUP as PermissionCode;
  }

  static canUpdate(): PermissionCode {
    return PERMISSIONS.ACADEMIC_SETUP as PermissionCode;
  }

  static canDelete(): PermissionCode {
    return PERMISSIONS.ACADEMIC_SETUP as PermissionCode;
  }

  static canAssignFaculty(): PermissionCode {
    return (PERMISSIONS.ACADEMIC_ASSIGN_FACULTY || PERMISSIONS.ACADEMIC_SETUP) as PermissionCode;
  }

  static canViewTimetable(): PermissionCode {
    return (PERMISSIONS.TIMETABLE_VIEW || PERMISSIONS.ACADEMIC_VIEW) as PermissionCode;
  }

  static canManageTimetable(): PermissionCode {
    return (PERMISSIONS.TIMETABLE_CREATE || PERMISSIONS.ACADEMIC_SETUP) as PermissionCode;
  }

  static canViewLessonPlan(): PermissionCode {
    return ((PERMISSIONS as any).LESSON_PLAN_VIEW || PERMISSIONS.ACADEMIC_VIEW) as PermissionCode;
  }

  static canGenerateLessonPlan(): PermissionCode {
    return ((PERMISSIONS as any).LESSON_PLAN_GENERATE ||
      PERMISSIONS.ACADEMIC_VIEW) as PermissionCode;
  }

  static canManageLessonPlan(): PermissionCode {
    return ((PERMISSIONS as any).LESSON_PLAN_MANAGE ||
      PERMISSIONS.ACADEMIC_SETUP) as PermissionCode;
  }

  static canViewReadiness(): PermissionCode {
    return PERMISSIONS.ACADEMIC_VIEW as PermissionCode;
  }

  static canPublishAcademic(): PermissionCode {
    return PERMISSIONS.ACADEMIC_SETUP as PermissionCode;
  }

  static canAccessTeacherWorkspace(): PermissionCode {
    return (PERMISSIONS.DASHBOARD_VIEW_FACULTY ||
      PERMISSIONS.FACULTY_DASHBOARD_VIEW) as PermissionCode;
  }

  static canManageAsSuperAdmin(): PermissionCode {
    return PERMISSIONS.ACADEMIC_SETUP as PermissionCode;
  }
}
