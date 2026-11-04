import prisma from '../../../lib/prismaClient';
import { ParentNotFoundError, ParentForbiddenError } from '../errors/parent.errors';
import { logger } from '../../../utils/logger';

export type ChildLifecycleType = 'PRE_ADMISSION' | 'POST_ADMISSION';

export type AccountLifecycleType = 'NO_APPLICATION' | 'PRE_ADMISSION' | 'POST_ADMISSION' | 'HYBRID';

export interface ChildLifecycleItem {
  id: string; // Unified identifier (studentId for enrolled, applicationId for applicant)
  studentId: string | null;
  applicationId: string | null;
  studentName: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  dob: string | null;
  lifecycleType: ChildLifecycleType;
  applicationStatus: string | null;
  applicationNumber: string | null;
  enrollmentId: string | null;
  enrollmentStatus: string | null; // 'active' | 'transferred_out' | 'graduated' | 'withdrawn' | null
  admissionNumber: string | null;
  academicYear: string | null;
  gradeLevel: string | null;
  section: string | null;
  rollNumber: string | null;
  relationship: string | null;
  isPrimaryContact: boolean;
  avatarUrl: string | null;
  hasPendingFees?: boolean;
  pendingFeeAmount?: number;
  availablePortalModules: string[];
}

export interface ParentStudentLifecycleResponse {
  parent: {
    parentId: string | null;
    userId: string;
    orgId: string | null;
    name: string;
    email: string | null;
    phone: string | null;
  };
  lifecycle: {
    accountType: AccountLifecycleType;
    hasApplications: boolean;
    hasEnrolledStudents: boolean;
    totalChildren: number;
    preAdmissionCount: number;
    postAdmissionCount: number;
  };
  children: ChildLifecycleItem[];
}

const PRE_ADMISSION_MODULES = [
  'HOME',
  'APPLICATIONS',
  'ADMISSION_STATUS',
  'DOCUMENT_CENTRE',
  'ASSESSMENT_TRACKER',
  'NOTIFICATIONS',
  'ACCOUNT',
];

const POST_ADMISSION_ACTIVE_MODULES = [
  'HOME',
  'STUDENT_DASHBOARD',
  'ATTENDANCE',
  'TIMETABLE',
  'HOMEWORK',
  'EXAMS',
  'RESULTS',
  'FEES',
  'TRANSPORT',
  'LIBRARY',
  'COMMUNICATION',
  'NOTIFICATIONS',
  'ACCOUNT',
];

const POST_ADMISSION_HISTORICAL_MODULES = [
  'HOME',
  'STUDENT_DASHBOARD',
  'RESULTS',
  'FEES',
  'NOTIFICATIONS',
  'ACCOUNT',
];

function getModulesForEnrollmentStatus(status: string | null): string[] {
  if (status === 'active') {
    return POST_ADMISSION_ACTIVE_MODULES;
  }
  // Graduated, transferred_out, or withdrawn retain historical records
  return POST_ADMISSION_HISTORICAL_MODULES;
}

export class ParentStudentLifecycleService {
  /**
   * Centralized Student Lifecycle Classification
   *
   * Authoritative Business Rules:
   * 1. PRE-ADMISSION: If a student/application has NO corresponding record in student_enrollments.
   * 2. POST-ADMISSION: If a student has a corresponding record in student_enrollments.
   * 3. An admission application alone, or a student master record alone WITHOUT an enrollment
   *    in student_enrollments, MUST NEVER be classified as POST-ADMISSION.
   * 4. Multiple children are classified independently.
   */
  static async getParentStudentLifecycle(
    parentUserId: string,
    orgId?: string,
  ): Promise<ParentStudentLifecycleResponse> {
    if (!parentUserId) {
      throw new ParentForbiddenError('Authentication context required');
    }

    // 1. Resolve Authenticated User Context
    const user = await prisma.users.findUnique({
      where: { user_id: parentUserId },
    });

    if (!user) {
      throw new ParentNotFoundError(parentUserId);
    }

    const safeOrgId = orgId || user.org_id || undefined;

    // 2. Resolve Corresponding Parent Record
    const parentRecord = await prisma.parents.findFirst({
      where: {
        OR: [
          { user_id: parentUserId },
          ...(user.email ? [{ email: user.email }] : []),
          ...(user.phone ? [{ phone: user.phone }] : []),
        ],
        ...(safeOrgId ? { org_id: safeOrgId } : {}),
      },
      orderBy: { created_at: 'desc' },
    });

    const parentId = parentRecord?.parent_id || null;
    const parentName = parentRecord
      ? `${parentRecord.first_name} ${parentRecord.last_name || ''}`.trim()
      : `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Parent';

    const children: ChildLifecycleItem[] = [];
    const processedAppIds = new Set<string>();
    const processedStudentIds = new Set<string>();

    // 3. Resolve Enrolled Children through Authoritative Parent Relationships (student_parents)
    if (parentId) {
      const studentParentRecords = await prisma.student_parents.findMany({
        where: { parent_id: parentId },
        include: {
          students: {
            include: {
              student_enrollments: {
                orderBy: { enrollment_date: 'desc' },
                include: {
                  sections: true,
                  academic_year_grades: {
                    include: {
                      grades: true,
                      academic_years: true,
                    },
                  },
                },
              },
              admissions_applications: {
                include: {
                  academic_years: true,
                },
              },
            },
          },
        },
      });

      for (const sp of studentParentRecords) {
        const student = sp.students;
        if (!student) continue;

        processedStudentIds.add(student.student_id);
        if (student.application_id) {
          processedAppIds.add(student.application_id);
        }

        const enrollments = student.student_enrollments || [];
        const latestEnrollment = enrollments[0] || null;

        // CRITICAL ENROLLMENT RULE:
        // Existence of student_enrollments is the SOLE decider for POST-ADMISSION.
        if (latestEnrollment) {
          children.push({
            id: student.student_id,
            studentId: student.student_id,
            applicationId: student.application_id || null,
            studentName: `${student.first_name} ${student.last_name || ''}`.trim(),
            firstName: student.first_name,
            lastName: student.last_name || '',
            gender: student.gender,
            dob: student.dob ? student.dob.toISOString().split('T')[0] : null,
            lifecycleType: 'POST_ADMISSION',
            applicationStatus: student.admissions_applications?.status || 'approved',
            applicationNumber: student.admissions_applications?.application_number || null,
            enrollmentId: latestEnrollment.enrollment_id,
            enrollmentStatus: latestEnrollment.status,
            admissionNumber: student.admission_no,
            academicYear:
              latestEnrollment.academic_year_grades?.academic_years?.academic_year_name || null,
            gradeLevel: latestEnrollment.academic_year_grades?.grades?.grade_name || null,
            section: latestEnrollment.sections?.section_name || null,
            rollNumber: latestEnrollment.roll_number || null,
            relationship: sp.relationship || 'guardian',
            isPrimaryContact: sp.is_primary_contact,
            avatarUrl: null,
            availablePortalModules: getModulesForEnrollmentStatus(latestEnrollment.status),
          });
        } else {
          // Student record exists, but student_enrollments is missing.
          // By Rule 1 and Rule 3, student MUST be treated as PRE_ADMISSION!
          children.push({
            id: student.application_id || student.student_id,
            studentId: student.student_id,
            applicationId: student.application_id || null,
            studentName: `${student.first_name} ${student.last_name || ''}`.trim(),
            firstName: student.first_name,
            lastName: student.last_name || '',
            gender: student.gender,
            dob: student.dob ? student.dob.toISOString().split('T')[0] : null,
            lifecycleType: 'PRE_ADMISSION',
            applicationStatus: student.admissions_applications?.status || 'documents_pending',
            applicationNumber: student.admissions_applications?.application_number || null,
            enrollmentId: null,
            enrollmentStatus: null,
            admissionNumber: null,
            academicYear:
              student.admissions_applications?.academic_years?.academic_year_name || null,
            gradeLevel: null,
            section: null,
            rollNumber: null,
            relationship: sp.relationship || 'guardian',
            isPrimaryContact: sp.is_primary_contact,
            avatarUrl: null,
            availablePortalModules: PRE_ADMISSION_MODULES,
          });
        }
      }
    }

    // 4. Resolve Admission Applications associated with Parent
    const applicationRecords = await prisma.admissions_applications.findMany({
      where: {
        OR: [
          { created_by: parentUserId },
          ...(parentId ? [{ leads: { parent_id: parentId } }] : []),
          ...(user.email ? [{ leads: { contact_email: user.email } }] : []),
          ...(user.phone ? [{ leads: { contact_phone: user.phone } }] : []),
        ],
        ...(safeOrgId ? { org_id: safeOrgId } : {}),
      },
      include: {
        leads: {
          include: {
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        academic_years: true,
        students: {
          include: {
            student_enrollments: {
              orderBy: { enrollment_date: 'desc' },
              include: {
                sections: true,
                academic_year_grades: {
                  include: {
                    grades: true,
                    academic_years: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    for (const app of applicationRecords) {
      if (processedAppIds.has(app.application_id)) {
        continue;
      }
      processedAppIds.add(app.application_id);

      const student = app.students;
      if (student && processedStudentIds.has(student.student_id)) {
        continue;
      }
      if (student) {
        processedStudentIds.add(student.student_id);
      }

      const enrollments = student?.student_enrollments || [];
      const latestEnrollment = enrollments[0] || null;

      const studentName = app.leads
        ? `${app.leads.student_first_name} ${app.leads.student_last_name || ''}`.trim()
        : 'Applicant';
      const firstName = app.leads?.student_first_name || 'Applicant';
      const lastName = app.leads?.student_last_name || '';

      if (latestEnrollment && student) {
        // Post-admission enrolled student
        children.push({
          id: student.student_id,
          studentId: student.student_id,
          applicationId: app.application_id,
          studentName,
          firstName,
          lastName,
          gender: app.leads?.gender || null,
          dob: app.leads?.dob ? app.leads.dob.toISOString().split('T')[0] : null,
          lifecycleType: 'POST_ADMISSION',
          applicationStatus: app.status,
          applicationNumber: app.application_number,
          enrollmentId: latestEnrollment.enrollment_id,
          enrollmentStatus: latestEnrollment.status,
          admissionNumber: student.admission_no,
          academicYear:
            latestEnrollment.academic_year_grades?.academic_years?.academic_year_name ||
            app.academic_years?.academic_year_name ||
            null,
          gradeLevel:
            latestEnrollment.academic_year_grades?.grades?.grade_name ||
            app.leads?.academic_year_grades?.grades?.grade_name ||
            null,
          section: latestEnrollment.sections?.section_name || null,
          rollNumber: latestEnrollment.roll_number || null,
          relationship: app.leads?.contact_relationship || 'guardian',
          isPrimaryContact: true,
          avatarUrl: null,
          availablePortalModules: getModulesForEnrollmentStatus(latestEnrollment.status),
        });
      } else {
        // Pre-admission applicant
        children.push({
          id: app.application_id,
          studentId: student?.student_id || null,
          applicationId: app.application_id,
          studentName,
          firstName,
          lastName,
          gender: app.leads?.gender || null,
          dob: app.leads?.dob ? app.leads.dob.toISOString().split('T')[0] : null,
          lifecycleType: 'PRE_ADMISSION',
          applicationStatus: app.status,
          applicationNumber: app.application_number,
          enrollmentId: null,
          enrollmentStatus: null,
          admissionNumber: null,
          academicYear:
            app.academic_years?.academic_year_name ||
            app.leads?.academic_year_grades?.academic_years?.academic_year_name ||
            null,
          gradeLevel: app.leads?.academic_year_grades?.grades?.grade_name || null,
          section: null,
          rollNumber: null,
          relationship: app.leads?.contact_relationship || 'parent',
          isPrimaryContact: true,
          avatarUrl: null,
          availablePortalModules: PRE_ADMISSION_MODULES,
        });
      }
    }

    // 5. Aggregate Parent Lifecycle Counts & Account Type
    const totalChildren = children.length;
    const preAdmissionCount = children.filter((c) => c.lifecycleType === 'PRE_ADMISSION').length;
    const postAdmissionCount = children.filter((c) => c.lifecycleType === 'POST_ADMISSION').length;

    let accountType: AccountLifecycleType = 'NO_APPLICATION';
    if (totalChildren > 0) {
      if (preAdmissionCount > 0 && postAdmissionCount === 0) {
        accountType = 'PRE_ADMISSION';
      } else if (postAdmissionCount > 0 && preAdmissionCount === 0) {
        accountType = 'POST_ADMISSION';
      } else {
        accountType = 'HYBRID';
      }
    }

    const result: ParentStudentLifecycleResponse = {
      parent: {
        parentId,
        userId: parentUserId,
        orgId: safeOrgId || parentRecord?.org_id || null,
        name: parentName,
        email: parentRecord?.email || user.email || null,
        phone: parentRecord?.phone || user.phone || null,
      },
      lifecycle: {
        accountType,
        hasApplications: children.some((c) => !!c.applicationId),
        hasEnrolledStudents: postAdmissionCount > 0,
        totalChildren,
        preAdmissionCount,
        postAdmissionCount,
      },
      children,
    };

    logger.info(`[Lifecycle] Resolved lifecycle for parent user ${parentUserId}`, {
      userId: parentUserId,
      parentId,
      accountType,
      totalChildren,
      preAdmissionCount,
      postAdmissionCount,
    });

    return result;
  }

  /**
   * Enforces that the authenticated parent is authorized to access the given student.
   * STRICT SECURITY: Only allows access if the parent is linked to the student AND
   * the student has a valid corresponding record in `student_enrollments`.
   */
  static async assertParentCanAccessStudent(
    parentUserId: string,
    studentId: string,
    orgId?: string,
  ): Promise<boolean> {
    const lifecycle = await this.getParentStudentLifecycle(parentUserId, orgId);
    const targetChild = lifecycle.children.find(
      (c) => c.studentId === studentId && c.lifecycleType === 'POST_ADMISSION',
    );

    if (!targetChild) {
      throw new ParentForbiddenError(
        'Access Denied: You do not have an enrolled student with this ID',
      );
    }

    return true;
  }

  /**
   * Enforces that the authenticated parent owns the given application.
   */
  static async assertParentCanAccessApplication(
    parentUserId: string,
    applicationId: string,
    orgId?: string,
  ): Promise<boolean> {
    const lifecycle = await this.getParentStudentLifecycle(parentUserId, orgId);
    const targetChild = lifecycle.children.find((c) => c.applicationId === applicationId);

    if (!targetChild) {
      throw new ParentForbiddenError('Access Denied: You do not own an application with this ID');
    }

    return true;
  }
}
