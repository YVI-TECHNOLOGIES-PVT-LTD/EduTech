import { Prisma } from '@prisma/client';
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
   * Resolves authorized recipients for a batch of students within a tenant organization.
   * Uses high-efficiency bulk queries (O(1) database round-trips) rather than N+1 sequential loops.
   */
  public static async resolveBatchStudentRecipients(
    orgId: string,
    studentIds: string[],
  ): Promise<Map<string, ResolvedRecipient[]>> {
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const resultMap = new Map<string, ResolvedRecipient[]>();

    const safeIds = (studentIds || [])
      .map((id) => toSafeUuid(id))
      .filter((id): id is string => Boolean(id));

    if (!safeOrgId || safeIds.length === 0) {
      return resultMap;
    }

    // Initialize all studentIds in map
    for (const sId of safeIds) {
      resultMap.set(sId, []);
    }

    // 1. Resolve fallback staff user once in parallel
    const fallbackStaffPromise = this.resolveFinanceStaff(safeOrgId);

    // 2. Batch query parents linked via student_parents table strictly within org_id
    const parentsPromise = (prisma as any).$queryRaw`
      SELECT
        sp.student_id,
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
      WHERE sp.student_id IN (${Prisma.join(safeIds.map((id) => Prisma.sql`${id}::uuid`))})
        AND p.org_id = ${safeOrgId}::uuid
        AND (u.user_id IS NULL OR (u.status = 'active' AND u.org_id = ${safeOrgId}::uuid))
      ORDER BY sp.is_primary_contact DESC, sp.created_at ASC;
    `;

    // 3. Batch query students with direct user accounts in this org
    const studentsPromise = (prisma as any).$queryRaw`
      SELECT s.student_id, u.user_id, s.first_name, s.last_name, u.email, u.phone
      FROM students s
      JOIN users u ON u.user_id = s.user_id
      WHERE s.student_id IN (${Prisma.join(safeIds.map((id) => Prisma.sql`${id}::uuid`))})
        AND s.org_id = ${safeOrgId}::uuid
        AND u.org_id = ${safeOrgId}::uuid
        AND u.status = 'active';
    `;

    const [parentRows, studentUserRows, fallbackStaff] = await Promise.all([
      parentsPromise,
      studentsPromise,
      fallbackStaffPromise,
    ]);

    const defaultStaff = fallbackStaff[0] || null;

    // Attach parents
    for (const r of parentRows as any[]) {
      const sId = r.student_id;
      if (!resultMap.has(sId)) continue;
      if (r.user_id) {
        const parentName = `${r.first_name} ${r.last_name || ''}`.trim() || 'Parent/Guardian';
        resultMap.get(sId)!.push({
          userId: r.user_id,
          name: parentName,
          role: r.relationship === 'mother' || r.relationship === 'father' ? 'parent' : 'guardian',
          email: r.email || null,
          phone: r.phone || null,
          isPrimaryContact: Boolean(r.is_primary_contact),
        });
      }
    }

    // Attach student direct users
    for (const s of studentUserRows as any[]) {
      const sId = s.student_id;
      if (!resultMap.has(sId)) continue;
      if (s.user_id) {
        resultMap.get(sId)!.push({
          userId: s.user_id,
          name: `${s.first_name} ${s.last_name || ''}`.trim(),
          role: 'student',
          email: s.email || null,
          phone: s.phone || null,
          isPrimaryContact: false,
        });
      }
    }

    // Fallback: If no linked user exists for parents/students, attach tenant finance/admin user
    if (defaultStaff) {
      for (const sId of safeIds) {
        const recipients = resultMap.get(sId)!;
        if (recipients.length === 0) {
          recipients.push({
            userId: defaultStaff.userId,
            name: defaultStaff.name || 'Finance Officer',
            role: 'staff',
            email: defaultStaff.email,
            phone: defaultStaff.phone,
            isPrimaryContact: true,
          });
        }
      }
    }

    return resultMap;
  }

  /**
   * Resolves authorized recipients for a single student.
   */
  public static async resolveStudentRecipients(
    orgId: string,
    studentId: string,
  ): Promise<ResolvedRecipient[]> {
    const map = await this.resolveBatchStudentRecipients(orgId, [studentId]);
    return map.get(studentId) || [];
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
