import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from './FeeStructureManagerService';

export interface ResolvedRecipient {
  userId: string;
  name: string;
  role: 'student' | 'parent' | 'guardian' | 'staff' | 'admin';
  email?: string | null;
  phone?: string | null;
  isPrimaryContact: boolean;
}

export class FinanceRecipientResolver {
  /**
   * Resolves authorized recipients (parents, guardians, or student) for a given student within tenant org.
   * Cross-tenant enumeration is strictly prevented by scoping to org_id.
   */
  public static async resolveStudentRecipients(
    orgId: string,
    studentId: string
  ): Promise<ResolvedRecipient[]> {
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);

    if (!safeStudentId) {
      return [];
    }

    // 1. Query parents linked via student_parents table strictly within org_id
    const parentRows: any = await (prisma as any).$queryRaw`
      SELECT
        p.parent_id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        sp.relationship,
        sp.is_primary_contact
      FROM student_parents sp
      JOIN parents p ON sp.parent_id = p.parent_id
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE sp.student_id = ${safeStudentId}::uuid
        AND p.org_id = ${safeOrgId}::uuid
        AND (u.user_id IS NULL OR (u.status = 'active' AND u.org_id = ${safeOrgId}::uuid))
      ORDER BY sp.is_primary_contact DESC, sp.created_at ASC;
    `;

    const recipients: ResolvedRecipient[] = [];

    for (const r of parentRows) {
      const parentName = `${r.first_name} ${r.last_name || ''}`.trim() || 'Parent/Guardian';
      // If parent has a linked user_id in users table
      if (r.user_id) {
        recipients.push({
          userId: r.user_id,
          name: parentName,
          role: r.relationship === 'mother' || r.relationship === 'father' ? 'parent' : 'guardian',
          email: r.email || null,
          phone: r.phone || null,
          isPrimaryContact: !!r.is_primary_contact,
        });
      }
    }

    // 2. If student has a direct active user account in this org, add student
    const studentUser: any = await (prisma as any).$queryRaw`
      SELECT u.user_id, s.first_name, s.last_name, u.email, u.phone
      FROM students s
      JOIN users u ON (u.email = s.admission_no OR u.user_id = s.student_id OR u.user_id = s.user_id)
      WHERE s.student_id = ${safeStudentId}::uuid
        AND s.org_id = ${safeOrgId}::uuid
        AND u.org_id = ${safeOrgId}::uuid
        AND u.status = 'active'
      LIMIT 1;
    `;

    if (studentUser.length > 0 && studentUser[0].user_id) {
      recipients.push({
        userId: studentUser[0].user_id,
        name: `${studentUser[0].first_name} ${studentUser[0].last_name || ''}`.trim(),
        role: 'student',
        email: studentUser[0].email,
        phone: studentUser[0].phone,
        isPrimaryContact: false,
      });
    }

    // 3. Fallback: If no linked user exists for parents/students, resolve tenant finance/admin user
    // so notification is durably delivered into the organization's inbox rather than dropped silently
    if (recipients.length === 0) {
      const orgStaff: any = await (prisma as any).$queryRaw`
        SELECT user_id, first_name, last_name, email, phone
        FROM users
        WHERE org_id = ${safeOrgId}::uuid 
          AND status = 'active'
        ORDER BY created_at ASC
        LIMIT 1;
      `;
      if (orgStaff.length > 0) {
        recipients.push({
          userId: orgStaff[0].user_id,
          name: `${orgStaff[0].first_name} ${orgStaff[0].last_name || ''}`.trim() || 'Finance Officer',
          role: 'staff',
          email: orgStaff[0].email,
          phone: orgStaff[0].phone,
          isPrimaryContact: true,
        });
      }
    }

    return recipients;
  }

  /**
   * Resolves finance staff / administrators in the tenant organization (for staff notifications).
   */
  public static async resolveFinanceStaff(orgId: string): Promise<ResolvedRecipient[]> {
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const staffRows: any = await (prisma as any).$queryRaw`
      SELECT user_id, first_name, last_name, email, phone
      FROM users
      WHERE org_id = ${safeOrgId}::uuid 
        AND status = 'active'
      ORDER BY created_at ASC
      LIMIT 5;
    `;

    return staffRows.map((u: any) => ({
      userId: u.user_id,
      name: `${u.first_name} ${u.last_name || ''}`.trim() || 'Staff User',
      role: 'staff' as const,
      email: u.email || null,
      phone: u.phone || null,
      isPrimaryContact: true,
    }));
  }
}
