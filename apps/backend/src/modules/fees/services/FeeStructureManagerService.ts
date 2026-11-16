import prisma from '../../../lib/prismaClient';
import { FinanceEngine } from './FinanceEngine';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toSafeUuid(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  return UUID_REGEX.test(val.trim()) ? val.trim() : null;
}

export interface FeeComponentInput {
  component_name: string;
  component_code: string;
  amount: number;
  is_mandatory?: boolean;
  display_order?: number;
  description?: string | null;
}

export interface CreateFeeStructureInput {
  name: string;
  description?: string | null;
  academic_year_grade_id: string;
  components: FeeComponentInput[];
}

export interface UpdateFeeStructureInput {
  name?: string;
  description?: string | null;
  components?: FeeComponentInput[];
}

export class FeeStructureManagerService {
  /**
   * Decimal-safe rounding to 2 decimal places
   */
  public static roundMoney(val: number): number {
    return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Retrieve summary metrics for Fee Structure Management
   */
  public static async getSummaryMetrics(orgId: string, academicYearId?: string) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    // Build tenant scoping where clause
    const whereScope: any = {
      academic_year_grades: {
        academic_years: {
          org_id: safeOrgId,
          ...(safeYearId ? { academic_year_id: safeYearId } : {}),
        },
      },
    };

    const structures = await prisma.fee_structures.findMany({
      where: whereScope,
      include: {
        fee_components: true,
        academic_year_grades: {
          include: {
            academic_years: true,
            grades: true,
          },
        },
      },
    });

    const totalStructures = structures.length;
    const publishedStructures = structures.filter((s: any) => s.status === 'published').length;
    const draftStructures = structures.filter((s: any) => s.status === 'draft').length;
    const inactiveStructures = structures.filter((s: any) => s.status === 'inactive').length;

    let totalComponents = 0;
    let totalPublishedValue = 0;

    for (const struct of structures) {
      totalComponents += struct.fee_components.length;
      if (struct.status === 'published') {
        for (const comp of struct.fee_components) {
          totalPublishedValue += Number(comp.amount);
        }
      }
    }

    // Calculate total active grades available in the academic year
    const totalAyGrades = await prisma.academic_year_grades.count({
      where: {
        is_active: true,
        academic_years: {
          org_id: safeOrgId,
          ...(safeYearId ? { academic_year_id: safeYearId } : {}),
        },
      },
    });

    return {
      totalStructures,
      publishedStructures,
      draftStructures,
      inactiveStructures,
      totalComponents,
      totalPublishedValue: this.roundMoney(totalPublishedValue),
      totalAvailableGrades: totalAyGrades,
      configuredCoveragePercentage: totalAyGrades > 0 ? Math.round((totalStructures / totalAyGrades) * 100) : 0,
    };
  }

  /**
   * List fee structures with pagination, search, and filtering
   */
  public static async listStructures(
    orgId: string,
    params: {
      academicYearId?: string;
      gradeId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(params.academicYearId);
    const safeGradeId = toSafeUuid(params.gradeId);

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      academic_year_grades: {
        academic_years: {
          org_id: safeOrgId,
          ...(safeYearId ? { academic_year_id: safeYearId } : {}),
        },
        ...(safeGradeId ? { grade_id: safeGradeId } : {}),
      },
    };

    if (params.status && ['draft', 'published', 'inactive'].includes(params.status)) {
      where.status = params.status;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          academic_year_grades: {
            grades: {
              OR: [
                { grade_name: { contains: q, mode: 'insensitive' } },
                { grade_code: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.fee_structures.count({ where }),
      prisma.fee_structures.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          fee_components: {
            orderBy: { display_order: 'asc' },
          },
          academic_year_grades: {
            include: {
              academic_years: true,
              grades: true,
            },
          },
          _count: {
            select: {
              student_fee_assignments: true,
            },
          },
        },
      }),
    ]);

    const items = records.map((s: any) => {
      let totalAmount = 0;
      for (const comp of s.fee_components) {
        totalAmount += Number(comp.amount);
      }

      return {
        id: s.fee_structure_id,
        fee_structure_id: s.fee_structure_id,
        name: s.name,
        description: s.description,
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
        created_by: s.created_by,
        updated_by: s.updated_by,
        academic_year_grade_id: s.academic_year_grade_id,
        academic_year: s.academic_year_grades?.academic_years
          ? {
              id: s.academic_year_grades.academic_years.academic_year_id,
              name: s.academic_year_grades.academic_years.academic_year_name,
              status: s.academic_year_grades.academic_years.status,
              start_date: s.academic_year_grades.academic_years.start_date,
              end_date: s.academic_year_grades.academic_years.end_date,
            }
          : null,
        grade: s.academic_year_grades?.grades
          ? {
              id: s.academic_year_grades.grades.grade_id,
              name: s.academic_year_grades.grades.grade_name,
              code: s.academic_year_grades.grades.grade_code,
              board: s.academic_year_grades.grades.board,
            }
          : null,
        components_count: s.fee_components.length,
        total_amount: this.roundMoney(totalAmount),
        assigned_students_count: s._count.student_fee_assignments,
        components: s.fee_components.map((c: any) => ({
          id: c.fee_component_id,
          component_name: c.component_name,
          component_code: c.component_code,
          amount: Number(c.amount),
          is_mandatory: c.is_mandatory,
          display_order: c.display_order,
          description: c.description,
        })),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Retrieve a single structure by ID with tenant isolation
   */
  public static async getStructureById(orgId: string, structureId: string) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    if (!structureId) {
      throw new Error('Fee Structure ID is required');
    }

    const safeStructId = toSafeUuid(structureId);
    const safeOrgId = toSafeUuid(orgId) || orgId;

    if (!safeStructId) {
      const err: any = new Error(`Fee structure not found or does not belong to this organization: ${structureId}`);
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const structure = await prisma.fee_structures.findFirst({
      where: {
        fee_structure_id: safeStructId,
        academic_year_grades: {
          academic_years: {
            org_id: safeOrgId,
          },
        },
      },
      include: {
        fee_components: {
          orderBy: { display_order: 'asc' },
        },
        academic_year_grades: {
          include: {
            academic_years: true,
            grades: true,
          },
        },
        _count: {
          select: {
            student_fee_assignments: true,
          },
        },
      },
    });

    if (!structure) {
      const err: any = new Error(`Fee structure not found or does not belong to this organization: ${structureId}`);
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    let totalAmount = 0;
    for (const comp of structure.fee_components) {
      totalAmount += Number(comp.amount);
    }

    // Also fetch available installment plans for this academic year to assist frontend schedule preview
    const academicYearId = structure.academic_year_grades?.academic_year_id;
    let installmentPlans: any[] = [];
    if (academicYearId) {
      installmentPlans = await prisma.installment_plans.findMany({
        where: {
          org_id: safeOrgId,
          academic_year_id: academicYearId,
          status: 'published',
        },
        include: {
          installment_plan_terms: {
            orderBy: { term_number: 'asc' },
          },
        },
      });
    }

    return {
      id: structure.fee_structure_id,
      fee_structure_id: structure.fee_structure_id,
      name: structure.name,
      description: structure.description,
      status: structure.status,
      created_at: structure.created_at,
      updated_at: structure.updated_at,
      created_by: structure.created_by,
      updated_by: structure.updated_by,
      academic_year_grade_id: structure.academic_year_grade_id,
      academic_year: structure.academic_year_grades?.academic_years
        ? {
            id: structure.academic_year_grades.academic_years.academic_year_id,
            name: structure.academic_year_grades.academic_years.academic_year_name,
            status: structure.academic_year_grades.academic_years.status,
            start_date: structure.academic_year_grades.academic_years.start_date,
            end_date: structure.academic_year_grades.academic_years.end_date,
          }
        : null,
      grade: structure.academic_year_grades?.grades
        ? {
            id: structure.academic_year_grades.grades.grade_id,
            name: structure.academic_year_grades.grades.grade_name,
            code: structure.academic_year_grades.grades.grade_code,
            board: structure.academic_year_grades.grades.board,
          }
        : null,
      total_amount: this.roundMoney(totalAmount),
      assigned_students_count: structure._count.student_fee_assignments,
      components: structure.fee_components.map((c: any) => ({
        id: c.fee_component_id,
        component_name: c.component_name,
        component_code: c.component_code,
        amount: Number(c.amount),
        is_mandatory: c.is_mandatory,
        display_order: c.display_order,
        description: c.description,
      })),
      installment_plans: installmentPlans.map((p) => ({
        id: p.installment_plan_id,
        plan_name: p.plan_name,
        description: p.description,
        terms_count: p.installment_plan_terms.length,
        terms: p.installment_plan_terms.map((t: any) => ({
          term_number: t.term_number,
          term_name: t.term_name,
          percentage: Number(t.percentage),
          due_date: t.due_date,
          calculated_amount: this.roundMoney((Number(t.percentage) / 100) * totalAmount),
        })),
      })),
    };
  }

  /**
   * Create a new fee structure with components
   */
  public static async createStructure(
    orgId: string,
    userId: string,
    payload: CreateFeeStructureInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!payload.name || !payload.name.trim()) {
      const err: any = new Error('Fee structure name is required');
      err.statusCode = 400;
      throw err;
    }
    if (payload.name.trim().length > 150) {
      const err: any = new Error('Fee structure name must not exceed 150 characters');
      err.statusCode = 400;
      throw err;
    }
    if (!payload.academic_year_grade_id) {
      const err: any = new Error('Target academic year grade assignment is required');
      err.statusCode = 400;
      throw err;
    }

    const safeAyGradeId = toSafeUuid(payload.academic_year_grade_id);
    if (!safeAyGradeId) {
      const err: any = new Error('Target academic year grade assignment must be a valid UUID');
      err.statusCode = 400;
      throw err;
    }

    if (!payload.components || !Array.isArray(payload.components) || payload.components.length === 0) {
      const err: any = new Error('At least one fee component is required');
      err.statusCode = 400;
      throw err;
    }

    // 1. Validate components inputs BEFORE database transactions
    const componentCodes = new Set<string>();
    const componentNames = new Set<string>();

    for (let i = 0; i < payload.components.length; i++) {
      const c = payload.components[i];
      if (!c.component_name || !c.component_name.trim()) {
        const err: any = new Error(`Component at position ${i + 1} must have a name`);
        err.statusCode = 400;
        throw err;
      }
      if (!c.component_code || !c.component_code.trim()) {
        const err: any = new Error(`Component "${c.component_name}" must have a code`);
        err.statusCode = 400;
        throw err;
      }

      const numAmount = Number(c.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        const err: any = new Error(`Component "${c.component_name}" amount must be a positive number greater than 0`);
        err.statusCode = 400;
        throw err;
      }

      const normCode = c.component_code.trim().toUpperCase();
      const normName = c.component_name.trim().toLowerCase();

      if (componentCodes.has(normCode)) {
        const err: any = new Error(`Duplicate component code: "${c.component_code}" is used more than once`);
        err.statusCode = 400;
        throw err;
      }
      componentCodes.add(normCode);

      if (componentNames.has(normName)) {
        const err: any = new Error(`Duplicate component name: "${c.component_name}" is used more than once`);
        err.statusCode = 400;
        throw err;
      }
      componentNames.add(normName);
    }

    const safeOrgId = toSafeUuid(orgId) || orgId;

    // 2. Verify academic_year_grade belongs to this organization
    const ayGrade = await prisma.academic_year_grades.findFirst({
      where: {
        academic_year_grade_id: safeAyGradeId,
        academic_years: {
          org_id: safeOrgId,
        },
      },
      include: {
        academic_years: true,
        grades: true,
      },
    });

    if (!ayGrade) {
      const err: any = new Error('Academic year grade mapping not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    // 3. Check unique constraint: a grade can have at most one fee structure
    const existing = await prisma.fee_structures.findUnique({
      where: {
        academic_year_grade_id: safeAyGradeId,
      },
    });

    if (existing) {
      const err: any = new Error(
        `A fee structure (${existing.name}) already exists for ${ayGrade.grades?.grade_name || 'this grade'} in academic year ${ayGrade.academic_years?.academic_year_name || ''}. Only one fee structure is permitted per grade.`
      );
      err.statusCode = 409;
      err.code = 'STRUCTURE_ALREADY_EXISTS_FOR_GRADE';
      throw err;
    }

    const safeUserId = toSafeUuid(userId);

    // 4. Create structure and components transactionally
    const created = await prisma.$transaction(async (tx: any) => {
      const struct = await tx.fee_structures.create({
        data: {
          name: payload.name.trim(),
          description: payload.description ? payload.description.trim() : null,
          academic_year_grade_id: safeAyGradeId,
          org_id: safeOrgId,
          status: 'draft',
          created_by: safeUserId,
          updated_by: safeUserId,
        },
      });

      for (let i = 0; i < payload.components.length; i++) {
        const c = payload.components[i];
        await tx.fee_components.create({
          data: {
            fee_structure_id: struct.fee_structure_id,
            component_name: c.component_name.trim(),
            component_code: c.component_code.trim().toUpperCase(),
            amount: this.roundMoney(Number(c.amount)),
            is_mandatory: c.is_mandatory !== false,
            display_order: c.display_order ?? i + 1,
            description: c.description ? c.description.trim() : null,
            created_by: safeUserId,
            updated_by: safeUserId,
          },
        });
      }

      return struct;
    });

    // Publish event
    try {
      await FinanceEngine.publishEvents('FeeStructureCreated', {
        structure_id: created.fee_structure_id,
        name: created.name,
        academic_year_grade_id: created.academic_year_grade_id,
        created_by: safeUserId,
      });
    } catch (e) {
      console.warn('[FeeStructureManagerService] Event emission non-blocking warning:', e);
    }

    return this.getStructureById(orgId, created.fee_structure_id);
  }

  /**
   * Update an existing fee structure and its components
   */
  public static async updateStructure(
    orgId: string,
    userId: string,
    structureId: string,
    payload: UpdateFeeStructureInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!structureId) throw new Error('Fee Structure ID is required');

    const safeStructId = toSafeUuid(structureId);
    const safeOrgId = toSafeUuid(orgId) || orgId;

    if (!safeStructId) {
      const err: any = new Error('Fee structure not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    // 1. Verify structure exists and belongs to this organization
    const existing = await prisma.fee_structures.findFirst({
      where: {
        fee_structure_id: safeStructId,
        academic_year_grades: {
          academic_years: {
            org_id: safeOrgId,
          },
        },
      },
      include: {
        _count: {
          select: {
            student_fee_assignments: true,
          },
        },
      },
    });

    if (!existing) {
      const err: any = new Error('Fee structure not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    // 2. Financial integrity check: if already published and has assigned students, reject modifying components
    const hasAssignments = existing._count.student_fee_assignments > 0;
    if (existing.status === 'published' && hasAssignments && payload.components) {
      const err: any = new Error(
        'Financial Integrity Rule: Fee components cannot be modified on a published structure that has active student assignments. Deactivate the structure and configure a new one instead.'
      );
      err.statusCode = 409;
      err.code = 'PUBLISHED_STRUCTURE_IMMUTABLE';
      throw err;
    }

    // 3. Validate components if provided
    if (payload.components) {
      if (!Array.isArray(payload.components) || payload.components.length === 0) {
        const err: any = new Error('At least one fee component is required');
        err.statusCode = 400;
        throw err;
      }

      const componentCodes = new Set<string>();
      const componentNames = new Set<string>();

      for (let i = 0; i < payload.components.length; i++) {
        const c = payload.components[i];
        if (!c.component_name || !c.component_name.trim()) {
          const err: any = new Error(`Component at position ${i + 1} must have a name`);
          err.statusCode = 400;
          throw err;
        }
        if (!c.component_code || !c.component_code.trim()) {
          const err: any = new Error(`Component "${c.component_name}" must have a code`);
          err.statusCode = 400;
          throw err;
        }

        const numAmount = Number(c.amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          const err: any = new Error(`Component "${c.component_name}" amount must be a positive number greater than 0`);
          err.statusCode = 400;
          throw err;
        }

        const normCode = c.component_code.trim().toUpperCase();
        const normName = c.component_name.trim().toLowerCase();

        if (componentCodes.has(normCode)) {
          const err: any = new Error(`Duplicate component code: "${c.component_code}" is used more than once`);
          err.statusCode = 400;
          throw err;
        }
        componentCodes.add(normCode);

        if (componentNames.has(normName)) {
          const err: any = new Error(`Duplicate component name: "${c.component_name}" is used more than once`);
          err.statusCode = 400;
          throw err;
        }
        componentNames.add(normName);
      }
    }

    const safeUserId = toSafeUuid(userId);

    // 4. Transactionally perform the update
    await prisma.$transaction(async (tx: any) => {
      const updateData: any = {
        updated_at: new Date(),
        updated_by: safeUserId,
      };

      if (payload.name && payload.name.trim()) {
        updateData.name = payload.name.trim();
      }
      if (payload.description !== undefined) {
        updateData.description = payload.description ? payload.description.trim() : null;
      }

      await tx.fee_structures.update({
        where: { fee_structure_id: safeStructId },
        data: updateData,
      });

      if (payload.components) {
        // Delete old components and recreate
        await tx.fee_components.deleteMany({
          where: { fee_structure_id: safeStructId },
        });

        for (let i = 0; i < payload.components.length; i++) {
          const c = payload.components[i];
          await tx.fee_components.create({
            data: {
              fee_structure_id: safeStructId,
              component_name: c.component_name.trim(),
              component_code: c.component_code.trim().toUpperCase(),
              amount: this.roundMoney(Number(c.amount)),
              is_mandatory: c.is_mandatory !== false,
              display_order: c.display_order ?? i + 1,
              description: c.description ? c.description.trim() : null,
              created_by: safeUserId,
              updated_by: safeUserId,
            },
          });
        }
      }
    });

    return this.getStructureById(orgId, safeStructId);
  }

  /**
   * Publish a draft structure
   */
  public static async publishStructure(orgId: string, userId: string, structureId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!structureId) throw new Error('Fee Structure ID is required');

    const safeStructId = toSafeUuid(structureId);
    const safeOrgId = toSafeUuid(orgId) || orgId;

    if (!safeStructId) {
      const err: any = new Error('Fee structure not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    const structure = await prisma.fee_structures.findFirst({
      where: {
        fee_structure_id: safeStructId,
        academic_year_grades: {
          academic_years: {
            org_id: safeOrgId,
          },
        },
      },
      include: {
        fee_components: true,
      },
    });

    if (!structure) {
      const err: any = new Error('Fee structure not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    if (structure.status === 'published') {
      const err: any = new Error('Fee structure is already published');
      err.statusCode = 400;
      throw err;
    }

    if (!structure.fee_components || structure.fee_components.length === 0) {
      const err: any = new Error('Cannot publish a fee structure with no components. Add at least one component first.');
      err.statusCode = 400;
      throw err;
    }

    let total = 0;
    for (const c of structure.fee_components) {
      total += Number(c.amount);
    }

    if (total <= 0) {
      const err: any = new Error('Cannot publish a fee structure with zero or negative total amount.');
      err.statusCode = 400;
      throw err;
    }

    const safeUserId = toSafeUuid(userId);

    const updated = await prisma.fee_structures.update({
      where: { fee_structure_id: safeStructId },
      data: {
        status: 'published',
        updated_at: new Date(),
        updated_by: safeUserId,
      },
    });

    // Publish event
    try {
      await FinanceEngine.publishEvents('FeeStructurePublished', {
        structure_id: safeStructId,
        name: updated.name,
        published_by: safeUserId,
        published_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[FeeStructureManagerService] Event emission non-blocking warning:', e);
    }

    return this.getStructureById(orgId, safeStructId);
  }

  /**
   * Deactivate an active or draft structure
   */
  public static async deactivateStructure(orgId: string, userId: string, structureId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!structureId) throw new Error('Fee Structure ID is required');

    const safeStructId = toSafeUuid(structureId);
    const safeOrgId = toSafeUuid(orgId) || orgId;

    if (!safeStructId) {
      const err: any = new Error('Fee structure not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    const structure = await prisma.fee_structures.findFirst({
      where: {
        fee_structure_id: safeStructId,
        academic_year_grades: {
          academic_years: {
            org_id: safeOrgId,
          },
        },
      },
    });

    if (!structure) {
      const err: any = new Error('Fee structure not found or does not belong to this organization');
      err.statusCode = 404;
      throw err;
    }

    if (structure.status === 'inactive') {
      const err: any = new Error('Fee structure is already inactive');
      err.statusCode = 400;
      throw err;
    }

    const safeUserId = toSafeUuid(userId);

    await prisma.fee_structures.update({
      where: { fee_structure_id: safeStructId },
      data: {
        status: 'inactive',
        updated_at: new Date(),
        updated_by: safeUserId,
      },
    });

    return this.getStructureById(orgId, safeStructId);
  }

  /**
   * Retrieve academic year grades for structure creation dropdown, indicating if already configured
   */
  public static async getAcademicYearGrades(orgId: string, academicYearId?: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    const where: any = {
      is_active: true,
      academic_years: {
        org_id: safeOrgId,
        ...(safeYearId ? { academic_year_id: safeYearId } : {}),
      },
    };

    const grades = await prisma.academic_year_grades.findMany({
      where,
      include: ({
        academic_years: true,
        grades: true,
        fee_structures: {
          select: {
            fee_structure_id: true,
            name: true,
            status: true,
          },
        },
      }) as any,
      orderBy: [
        { academic_years: { start_date: 'desc' } },
        { grades: { display_order: 'asc' } },
      ],
    });

    return (grades as any[]).map((g: any) => ({
      academic_year_grade_id: g.academic_year_grade_id,
      academic_year_id: g.academic_year_id,
      academic_year_name: g.academic_years.academic_year_name,
      academic_year_status: g.academic_years.status,
      grade_id: g.grade_id,
      grade_name: g.grades.grade_name,
      grade_code: g.grades.grade_code,
      board: g.grades.board,
      intake_capacity: g.intake_capacity,
      is_configured: Boolean(g.fee_structures),
      existing_structure: g.fee_structures
        ? {
            id: g.fee_structures.fee_structure_id,
            name: g.fee_structures.name,
            status: g.fee_structures.status,
          }
        : null,
    }));
  }

  /**
   * List verified installment plans and terms for academic year
   */
  public static async getInstallmentPlans(orgId: string, academicYearId?: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    const where: any = {
      org_id: safeOrgId,
      ...(safeYearId ? { academic_year_id: safeYearId } : {}),
    };

    const plans = await prisma.installment_plans.findMany({
      where,
      include: {
        academic_years: true,
        installment_plan_terms: {
          orderBy: { term_number: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return (plans as any[]).map((p: any) => ({
      id: p.installment_plan_id,
      plan_name: p.plan_name,
      description: p.description,
      status: p.status,
      academic_year_id: p.academic_year_id,
      academic_year_name: p.academic_years.academic_year_name,
      terms_count: p.installment_plan_terms.length,
      terms: p.installment_plan_terms.map((t: any) => ({
        id: t.installment_term_id,
        term_number: t.term_number,
        term_name: t.term_name,
        percentage: Number(t.percentage),
        due_date: t.due_date,
      })),
    }));
  }
}
