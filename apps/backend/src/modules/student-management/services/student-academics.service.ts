import { StudentRepository } from '../repositories/student.repository';
import { StudentNotFoundError } from '../errors/student.errors';
import { ParentStudentLifecycleService } from '../../parent-management/services/parent.student-lifecycle.service';

export class StudentAcademicsService {
  private static async assertAccess(studentId: string, user: any, orgId?: string) {
    const isParentOnly =
      user?.roles?.includes('PARENT') &&
      !user?.roles?.some((r: string) =>
        ['ADMIN', 'SUPERADMIN', 'ADMISSION_OFFICER', 'STAFF', 'FRONT_OFFICE'].includes(r),
      );

    if (isParentOnly && user?.id) {
      await ParentStudentLifecycleService.assertParentCanAccessStudent(
        user.id,
        studentId,
        user.org_id || orgId,
      );
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new StudentNotFoundError(studentId);
    }
    return student;
  }

  static async getExams(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getAttendanceSummary(studentId: string, user: any, orgId?: string, _month?: string) {
    await this.assertAccess(studentId, user, orgId);
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      percentage: 0,
      records: [],
    };
  }

  static async getAttendanceTimeline(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getTodayTimetable(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getWeekTimetable(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getHomework(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }

  static async getResults(studentId: string, user: any, orgId?: string, _term?: string) {
    await this.assertAccess(studentId, user, orgId);
    return null;
  }

  static async getTransport(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return null;
  }

  static async getLibrary(studentId: string, user: any, orgId?: string) {
    const student = await this.assertAccess(studentId, user, orgId);
    return {
      studentId,
      cardNumber: student.admission_no || 'LIB-001',
      status: 'active',
      booksIssued: 0,
      maxAllowed: 3,
      activeBooks: [],
    };
  }

  static async getLibraryHistory(studentId: string, user: any, orgId?: string) {
    await this.assertAccess(studentId, user, orgId);
    return [];
  }
}
