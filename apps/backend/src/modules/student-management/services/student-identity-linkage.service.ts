import prisma from '../../../lib/prismaClient';
import { StudentNotFoundError, StudentValidationError } from '../errors/student.errors';

export interface StudentLinkageOrgSummary {
  org_id: string;
  org_name: string | null;
  total_students: number;
  linked_students: number;
  unlinked_students: number;
  by_status: Array<{
    status: string;
    total: number;
    linked: number;
    unlinked: number;
  }>;
  unlinked_provenance: {
    with_parent_link: number;
    with_linked_parent_user: number;
    with_lead_record: number;
    with_lead_contact_email: number;
    with_active_enrollment: number;
  };
  linked_integrity: {
    total_linked: number;
    broken_user_fk: number;
    cross_org_mismatch: number;
    with_student_role: number;
    duplicate_user_links: number;
  };
  unlinked_student_role_users: number;
}

export interface StudentDryRunCandidate {
  student_id: string;
  admission_no: string;
  status: string;
  classification: 'ELIGIBLE_ACTIVE_STUDENT' | 'HISTORICAL_INACTIVE_SKIP';
  has_linked_parent: boolean;
  has_lead_record: boolean;
  lead_contact_email_shared_with_existing_user: boolean;
  recommended_action: string;
}

export class StudentIdentityLinkageService {
  /**
   * Read-only non-PII audit of student.user_id linkage for a single verified tenant.
   */
  static async getLinkageAudit(orgId: string): Promise<StudentLinkageOrgSummary> {
    if (!orgId) {
      throw new StudentValidationError(
        'Tenant organization ID is required for student linkage audit.',
      );
    }

    const [orgRow] = await prisma.$queryRawUnsafe<Array<{ org_name: string | null }>>(
      `SELECT org_name FROM public.organizations WHERE org_id = $1::uuid`,
      orgId,
    );

    const statusRows = await prisma.$queryRawUnsafe<
      Array<{ status: string; total: number; linked: number; unlinked: number }>
    >(
      `
      SELECT
        s.status::text AS status,
        COUNT(*)::int AS total,
        COUNT(s.user_id)::int AS linked,
        (COUNT(*) - COUNT(s.user_id))::int AS unlinked
      FROM public.students s
      WHERE s.org_id = $1::uuid
      GROUP BY s.status
      ORDER BY s.status::text
      `,
      orgId,
    );

    const [provenance] = await prisma.$queryRawUnsafe<
      Array<{
        with_parent_link: number;
        with_linked_parent_user: number;
        with_lead_record: number;
        with_lead_contact_email: number;
        with_active_enrollment: number;
      }>
    >(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN sp.parent_id IS NOT NULL THEN s.student_id END)::int AS with_parent_link,
        COUNT(DISTINCT CASE WHEN p.user_id IS NOT NULL THEN s.student_id END)::int AS with_linked_parent_user,
        COUNT(DISTINCT CASE WHEN aa.lead_id IS NOT NULL THEN s.student_id END)::int AS with_lead_record,
        COUNT(DISTINCT CASE WHEN l.contact_email IS NOT NULL AND length(trim(l.contact_email)) > 0 THEN s.student_id END)::int AS with_lead_contact_email,
        COUNT(DISTINCT CASE WHEN se.enrollment_id IS NOT NULL THEN s.student_id END)::int AS with_active_enrollment
      FROM public.students s
      LEFT JOIN public.student_parents sp ON sp.student_id = s.student_id
      LEFT JOIN public.parents p ON p.parent_id = sp.parent_id
      LEFT JOIN public.admissions_applications aa ON aa.application_id = s.application_id
      LEFT JOIN public.leads l ON l.lead_id = aa.lead_id
      LEFT JOIN public.student_enrollments se ON se.student_id = s.student_id AND se.status = 'active'
      WHERE s.org_id = $1::uuid AND s.user_id IS NULL
      `,
      orgId,
    );

    const [integrity] = await prisma.$queryRawUnsafe<
      Array<{
        total_linked: number;
        broken_user_fk: number;
        cross_org_mismatch: number;
        with_student_role: number;
      }>
    >(
      `
      SELECT
        COUNT(*)::int AS total_linked,
        COUNT(CASE WHEN u.user_id IS NULL THEN 1 END)::int AS broken_user_fk,
        COUNT(CASE WHEN u.org_id IS DISTINCT FROM s.org_id THEN 1 END)::int AS cross_org_mismatch,
        COUNT(CASE WHEN EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON r.role_id = ur.role_id
          WHERE ur.user_id = s.user_id AND lower(r.role_name) = 'student'
        ) THEN 1 END)::int AS with_student_role
      FROM public.students s
      LEFT JOIN public.users u ON u.user_id = s.user_id
      WHERE s.org_id = $1::uuid AND s.user_id IS NOT NULL
      `,
      orgId,
    );

    const [dupRow] = await prisma.$queryRawUnsafe<Array<{ duplicate_user_links: number }>>(
      `
      SELECT COUNT(*)::int AS duplicate_user_links
      FROM (
        SELECT user_id
        FROM public.students
        WHERE org_id = $1::uuid AND user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) d
      `,
      orgId,
    );

    const [extraStudentRoleUsers] = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `
      SELECT COUNT(DISTINCT u.user_id)::int AS count
      FROM public.users u
      JOIN public.user_roles ur ON ur.user_id = u.user_id
      JOIN public.roles r ON r.role_id = ur.role_id
      LEFT JOIN public.students s ON s.user_id = u.user_id
      WHERE u.org_id = $1::uuid AND u.status = 'active' AND lower(r.role_name) = 'student' AND s.student_id IS NULL
      `,
      orgId,
    );

    const totalStudents = statusRows.reduce((sum, r) => sum + r.total, 0);
    const linkedStudents = statusRows.reduce((sum, r) => sum + r.linked, 0);

    return {
      org_id: orgId,
      org_name: orgRow?.org_name ?? null,
      total_students: totalStudents,
      linked_students: linkedStudents,
      unlinked_students: totalStudents - linkedStudents,
      by_status: statusRows,
      unlinked_provenance: provenance || {
        with_parent_link: 0,
        with_linked_parent_user: 0,
        with_lead_record: 0,
        with_lead_contact_email: 0,
        with_active_enrollment: 0,
      },
      linked_integrity: {
        total_linked: integrity?.total_linked || 0,
        broken_user_fk: integrity?.broken_user_fk || 0,
        cross_org_mismatch: integrity?.cross_org_mismatch || 0,
        with_student_role: integrity?.with_student_role || 0,
        duplicate_user_links: dupRow?.duplicate_user_links || 0,
      },
      unlinked_student_role_users: extraStudentRoleUsers?.count || 0,
    };
  }

  /**
   * Non-mutating dry-run provisioning plan for unlinked students.
   * Zero name-only heuristic matching; never overwrites or bulk-provisions accounts.
   */
  static async dryRunProvisioningPlan(
    orgId: string,
    limit = 100,
  ): Promise<{
    org_id: string;
    dry_run_only: true;
    requires_explicit_admin_approval: true;
    total_evaluated: number;
    eligible_active_count: number;
    historical_inactive_count: number;
    candidates: StudentDryRunCandidate[];
  }> {
    if (!orgId) {
      throw new StudentValidationError('Tenant organization ID is required.');
    }

    const cappedLimit = Math.min(Math.max(limit, 1), 500);
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        student_id: string;
        admission_no: string;
        status: string;
        has_linked_parent: boolean;
        has_lead_record: boolean;
        shared_email_conflict: boolean;
      }>
    >(
      `
      SELECT
        s.student_id::text,
        s.admission_no,
        s.status::text AS status,
        EXISTS (
          SELECT 1 FROM public.student_parents sp
          JOIN public.parents p ON p.parent_id = sp.parent_id
          WHERE sp.student_id = s.student_id AND p.user_id IS NOT NULL
        ) AS has_linked_parent,
        (aa.lead_id IS NOT NULL) AS has_lead_record,
        EXISTS (
          SELECT 1 FROM public.leads l
          JOIN public.users u ON lower(u.email) = lower(l.contact_email)
          WHERE l.lead_id = aa.lead_id AND l.contact_email IS NOT NULL AND length(trim(l.contact_email)) > 0
        ) AS shared_email_conflict
      FROM public.students s
      LEFT JOIN public.admissions_applications aa ON aa.application_id = s.application_id
      WHERE s.org_id = $1::uuid AND s.user_id IS NULL
      ORDER BY (CASE WHEN s.status = 'active' THEN 0 ELSE 1 END), s.created_at ASC
      LIMIT $2::int
      `,
      orgId,
      cappedLimit,
    );

    const candidates: StudentDryRunCandidate[] = rows.map((row) => {
      const isActive = row.status === 'active';
      return {
        student_id: row.student_id,
        admission_no: row.admission_no,
        status: row.status,
        classification: isActive ? 'ELIGIBLE_ACTIVE_STUDENT' : 'HISTORICAL_INACTIVE_SKIP',
        has_linked_parent: Boolean(row.has_linked_parent),
        has_lead_record: Boolean(row.has_lead_record),
        lead_contact_email_shared_with_existing_user: Boolean(row.shared_email_conflict),
        recommended_action: isActive
          ? row.shared_email_conflict
            ? 'Provision dedicated student user via deterministic admission_no email + Student role (do NOT reuse parent/lead email).'
            : 'Requires approved student onboarding credential provisioning before linking student.user_id.'
          : 'Skip automatic provisioning for historical non-active student unless manually requested.',
      };
    });

    return {
      org_id: orgId,
      dry_run_only: true,
      requires_explicit_admin_approval: true,
      total_evaluated: candidates.length,
      eligible_active_count: candidates.filter(
        (c) => c.classification === 'ELIGIBLE_ACTIVE_STUDENT',
      ).length,
      historical_inactive_count: candidates.filter(
        (c) => c.classification === 'HISTORICAL_INACTIVE_SKIP',
      ).length,
      candidates,
    };
  }

  /**
   * Explicitly links one pre-existing verified active Student-org user account to one unlinked student record.
   * Safety guards:
   * - Atomic transaction
   * - Never overwrites an existing students.user_id
   * - Enforces identical org_id across student and user
   * - Rejects users already bound to any parent, staff, or other student record
   * - Ensures Student role in user_roles
   */
  static async linkExistingUserToStudent(
    orgId: string,
    studentId: string,
    targetUserId: string,
    actorUserId?: string | null,
  ) {
    if (!orgId || !studentId || !targetUserId) {
      throw new StudentValidationError('orgId, studentId, and targetUserId are required.');
    }

    return prisma.$transaction(async (tx) => {
      const student = await tx.students.findFirst({
        where: { student_id: studentId, org_id: orgId },
        select: { student_id: true, org_id: true, user_id: true, admission_no: true },
      });
      if (!student) {
        throw new StudentNotFoundError(studentId);
      }
      if (student.user_id) {
        const conflict = new Error(
          `Student ${student.admission_no} is already linked to user ${student.user_id}. Existing user_id will not be overwritten.`,
        ) as Error & { statusCode: number; code: string };
        conflict.statusCode = 409;
        conflict.code = 'STUDENT_ALREADY_LINKED';
        throw conflict;
      }

      const targetUser = await tx.users.findFirst({
        where: { user_id: targetUserId, org_id: orgId, status: 'active' },
        select: { user_id: true, org_id: true },
      });
      if (!targetUser) {
        throw new StudentValidationError(
          `Target user '${targetUserId}' was not found as an active user in organization '${orgId}'.`,
        );
      }

      const [existingStudentOwner, existingStaffOwner, existingParentOwner] = await Promise.all([
        tx.students.findFirst({
          where: { user_id: targetUserId },
          select: { student_id: true },
        }),
        tx.staff.findFirst({
          where: { user_id: targetUserId },
          select: { staff_id: true },
        }),
        tx.parents.findFirst({
          where: { user_id: targetUserId },
          select: { parent_id: true },
        }),
      ]);

      if (existingStudentOwner || existingStaffOwner || existingParentOwner) {
        const conflict = new Error(
          `Target user '${targetUserId}' is already bound to an existing student, staff, or parent profile.`,
        ) as Error & { statusCode: number; code: string };
        conflict.statusCode = 409;
        conflict.code = 'IDENTITY_LINK_CONFLICT';
        throw conflict;
      }

      const studentRole = await tx.roles.findFirst({
        where: { role_name: { equals: 'Student', mode: 'insensitive' }, is_active: true },
        select: { role_id: true },
      });
      if (!studentRole) {
        throw new StudentValidationError(
          'Active Student role definition missing from roles table.',
        );
      }

      await tx.user_roles.upsert({
        where: {
          user_id_role_id: {
            user_id: targetUserId,
            role_id: studentRole.role_id,
          },
        },
        update: {},
        create: {
          user_id: targetUserId,
          role_id: studentRole.role_id,
          granted_by: actorUserId || null,
        },
      });

      const updated = await tx.students.updateMany({
        where: {
          student_id: studentId,
          org_id: orgId,
          user_id: null,
        },
        data: {
          user_id: targetUserId,
          updated_at: new Date(),
          updated_by: actorUserId || null,
        },
      });

      if (updated.count !== 1) {
        const conflict = new Error(
          'Concurrent or conflicting student user link prevented.',
        ) as Error & {
          statusCode: number;
          code: string;
        };
        conflict.statusCode = 409;
        conflict.code = 'STUDENT_ALREADY_LINKED';
        throw conflict;
      }

      return tx.students.findUnique({
        where: { student_id: studentId },
        select: {
          student_id: true,
          org_id: true,
          user_id: true,
          admission_no: true,
          status: true,
        },
      });
    });
  }
}
