import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from './FeeStructureManagerService';
import { ScholarshipRepository, ListConcessionsFilter } from '../repositories/ScholarshipRepository';
import { FinanceNotificationService } from './FinanceNotificationService';
import { FinanceEventType } from '../events/finance.events';
import { logger } from '../../../utils/logger';

export interface RecommendConcessionInput {
  studentId: string;
  academicYearId: string;
  scholarshipType: 'merit' | 'sports' | 'need_based' | 'government' | 'management';
  concessionName: string;
  concessionPercentage: number;
  scope: 'academic_year' | 'installment';
  installmentTermId?: string | null;
  recommendationReason: string;
  notes?: string | null;
}

export interface ReviewConcessionInput {
  action: 'approved' | 'rejected';
  approvedPercentage?: number | null;
  remarks?: string | null;
}

export class ScholarshipConcessionService {
  /**
   * Institutional programs catalog definition.
   */
  public static readonly STANDARD_PROGRAMS = [
    {
      id: 'prog_merit',
      code: 'MERIT',
      type: 'merit' as const,
      name: 'Academic Merit Scholarship',
      description: 'Awarded to students demonstrating superior academic distinction and top percentile rankings.',
      default_percentage: 25.0,
      scope: 'academic_year' as const,
      min_percentage: 5.0,
      max_percentage: 100.0,
      status: 'active',
      eligibility_criteria: 'Grade point average >= 9.0 or top 5% in entrance assessment.',
      required_documents: ['Previous Academic Transcript', 'Entrance Merit Certificate'],
    },
    {
      id: 'prog_sports',
      code: 'SPORTS',
      type: 'sports' as const,
      name: 'Athletic & Sports Excellence Award',
      description: 'Support for state, national, or inter-school level sports achievers and athletes.',
      default_percentage: 20.0,
      scope: 'academic_year' as const,
      min_percentage: 5.0,
      max_percentage: 50.0,
      status: 'active',
      eligibility_criteria: 'Verified participation or medal at recognized district/state/national tournament.',
      required_documents: ['Sports Association Certificate', 'Coach Endorsement Letter'],
    },
    {
      id: 'prog_need',
      code: 'NEED',
      type: 'need_based' as const,
      name: 'Financial Hardship Concession',
      description: 'Financial aid grant assisting enrolled families experiencing acute economic difficulty or distress.',
      default_percentage: 30.0,
      scope: 'installment' as const,
      min_percentage: 10.0,
      max_percentage: 75.0,
      status: 'active',
      eligibility_criteria: 'Family gross annual income under certified institutional threshold.',
      required_documents: ['Income Certificate / ITR', 'Hardship Statement Form'],
    },
    {
      id: 'prog_govt',
      code: 'GOVT',
      type: 'government' as const,
      name: 'Government Sponsored Welfare Quota',
      description: 'Statutory concession granted under state educational welfare schemes and affirmative mandates.',
      default_percentage: 50.0,
      scope: 'academic_year' as const,
      min_percentage: 25.0,
      max_percentage: 100.0,
      status: 'active',
      eligibility_criteria: 'Eligible domicile under recognized government quota or scholarship welfare department.',
      required_documents: ['Government Scheme Sanction Letter', 'Domicile / Category Certificate'],
    },
    {
      id: 'prog_mgmt_sibling',
      code: 'SIBLING',
      type: 'management' as const,
      name: 'Sibling Fee Concession',
      description: 'Institutional discount granted to families with multiple concurrent enrollments in the school.',
      default_percentage: 10.0,
      scope: 'academic_year' as const,
      min_percentage: 5.0,
      max_percentage: 25.0,
      status: 'active',
      eligibility_criteria: 'Active sibling currently enrolled and attending within the same academic year.',
      required_documents: ['Sibling Enrollment ID Verification'],
    },
    {
      id: 'prog_mgmt_staff',
      code: 'STAFF_CHILD',
      type: 'management' as const,
      name: 'Staff Dependent Educational Concession',
      description: 'Staff benefit policy granting tuition reduction for children of full-time faculty and operational staff.',
      default_percentage: 50.0,
      scope: 'academic_year' as const,
      min_percentage: 20.0,
      max_percentage: 100.0,
      status: 'active',
      eligibility_criteria: 'Parent must be an active, verified employee of the school organization.',
      required_documents: ['Employee ID Verification', 'HR Benefit Approval'],
    },
    {
      id: 'prog_mgmt_special',
      code: 'MGMT_SPECIAL',
      type: 'management' as const,
      name: 'Management Discretionary Concession',
      description: 'Special concession granted on individual merits approved by the Board or Head of Institute.',
      default_percentage: 15.0,
      scope: 'academic_year' as const,
      min_percentage: 5.0,
      max_percentage: 100.0,
      status: 'active',
      eligibility_criteria: 'Discretionary recommendation approved by the Governing Council or Principal.',
      required_documents: ['Principal Recommendation Letter'],
    },
  ];

  /**
   * Retrieve live dashboard and reporting metrics.
   */
  public static async getMetrics(orgId: string, academicYearId?: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    const metrics = await ScholarshipRepository.getScholarshipMetrics(safeOrgId, safeYearId || undefined);

    return {
      active_programs_count: this.STANDARD_PROGRAMS.length,
      pending_applications_count: metrics.pendingCount,
      approved_awards_count: metrics.approvedCount,
      applied_concessions_count: metrics.appliedCount,
      rejected_awards_count: metrics.rejectedCount,
      total_beneficiaries_count: metrics.totalBeneficiariesCount,
      total_concessions_discount: metrics.totalConcessionsDiscount,
      average_concession_percentage: metrics.averageConcessionPercentage,
    };
  }

  /**
   * Retrieve available scholarship & concession programs catalog.
   */
  public static async getPrograms(orgId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;

    // Fetch live award counts per scholarship type
    const metricsByType: any = await prisma.$queryRaw`
      SELECT sc.scholarship_type, COUNT(*)::int as award_count
      FROM scholarship_concessions sc
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = ${safeOrgId}::uuid
      GROUP BY sc.scholarship_type;
    `;

    const countMap: Record<string, number> = {};
    for (const m of metricsByType) {
      if (m.scholarship_type) {
        countMap[m.scholarship_type] = (countMap[m.scholarship_type] || 0) + m.award_count;
      }
    }

    return this.STANDARD_PROGRAMS.map((prog) => ({
      ...prog,
      current_awards_count: countMap[prog.type] || 0,
    }));
  }

  /**
   * Search students within tenant organization eligible for scholarship recommendation.
   */
  public static async searchEligibleStudents(
    orgId: string,
    query?: string,
    academicYearId?: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    const where: any = { org_id: safeOrgId };

    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { admission_no: { contains: q, mode: 'insensitive' } },
        { first_name: { contains: q, mode: 'insensitive' } },
        { last_name: { contains: q, mode: 'insensitive' } },
      ];
    }

    const students = await prisma.students.findMany({
      where,
      include: {
        student_enrollments: {
          where: { status: 'active' },
          include: {
            academic_year_grades: {
              include: { academic_years: true, grades: true },
            },
            sections: true,
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      take: Math.min(50, limit),
      skip: (Math.max(1, page) - 1) * limit,
      orderBy: { created_at: 'desc' },
    });

    const studentIds = students.map((s) => s.student_id);

    // Fetch active concessions for these students
    let existingConcessions: any[] = [];
    if (studentIds.length > 0) {
      const placeholders = studentIds.map((_, i) => `$${i + 1}::uuid`).join(', ');
      existingConcessions = await (prisma as any).$queryRawUnsafe(
        `SELECT sc.student_id, sc.scholarship_concession_id, sc.concession_name,
               sc.concession_percentage::float8 as concession_percentage,
               sc.approved_percentage::float8 as approved_percentage,
               sc.status
        FROM scholarship_concessions sc
        WHERE sc.student_id IN (${placeholders})`,
        ...studentIds
      );
    }

    const concessionMap = new Map<string, any[]>();
    for (const c of existingConcessions) {
      if (!concessionMap.has(c.student_id)) concessionMap.set(c.student_id, []);
      concessionMap.get(c.student_id)!.push(c);
    }

    return students.map((s) => {
      const enrollment = s.student_enrollments[0];
      const ayg = enrollment?.academic_year_grades;
      return {
        student_id: s.student_id,
        admission_no: s.admission_no,
        full_name: `${s.first_name} ${s.last_name || ''}`.trim(),
        first_name: s.first_name,
        last_name: s.last_name || '',
        academic_year_id: ayg?.academic_year_id || null,
        academic_year_name: ayg?.academic_years.academic_year_name || 'N/A',
        grade_name: ayg?.grades.grade_name || 'N/A',
        section_name: enrollment?.sections?.section_name || 'N/A',
        existing_concessions: concessionMap.get(s.student_id) || [],
      };
    });
  }

  /**
   * List submitted and processed scholarship applications.
   */
  public static async listApplications(orgId: string, filter: ListConcessionsFilter = {}) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;

    return ScholarshipRepository.listConcessions(safeOrgId, filter);
  }

  /**
   * Retrieve application details and full audit history.
   */
  public static async getApplicationById(orgId: string, concessionId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!concessionId) throw new Error('Concession ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeConcId = toSafeUuid(concessionId);
    if (!safeConcId) {
      const err: any = new Error('Invalid concession identifier format');
      err.statusCode = 400;
      throw err;
    }

    const concession = await ScholarshipRepository.findConcessionById(safeConcId, safeOrgId);
    if (!concession) {
      const err: any = new Error('Scholarship/Concession record not found');
      err.statusCode = 404;
      throw err;
    }

    const auditHistory = await ScholarshipRepository.getApprovalHistory(safeConcId);

    return {
      ...concession,
      approval_history: auditHistory,
    };
  }

  /**
   * Submit a new scholarship or concession recommendation.
   */
  public static async recommendConcession(
    orgId: string,
    userId: string,
    payload: RecommendConcessionInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!userId) throw new Error('Recommending user ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeUserId = toSafeUuid(userId);
    const safeStudentId = toSafeUuid(payload.studentId);
    const safeYearId = toSafeUuid(payload.academicYearId);
    const safeTermId = toSafeUuid(payload.installmentTermId);

    if (!safeStudentId) {
      const err: any = new Error('Valid student ID is required');
      err.statusCode = 400;
      throw err;
    }

    if (!safeYearId) {
      const err: any = new Error('Valid academic year ID is required');
      err.statusCode = 400;
      throw err;
    }

    if (!payload.concessionName || !payload.concessionName.trim()) {
      const err: any = new Error('Concession name is required');
      err.statusCode = 400;
      throw err;
    }

    if (!payload.recommendationReason || !payload.recommendationReason.trim()) {
      const err: any = new Error('Recommendation reason / justification is required');
      err.statusCode = 400;
      throw err;
    }

    const pct = Number(payload.concessionPercentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      const err: any = new Error('Concession percentage must be between 0.01 and 100.00%');
      err.statusCode = 400;
      throw err;
    }

    const allowedTypes = ['merit', 'sports', 'need_based', 'government', 'management'];
    if (!allowedTypes.includes(payload.scholarshipType)) {
      const err: any = new Error(`Invalid scholarship type. Allowed: ${allowedTypes.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (payload.scope !== 'academic_year' && payload.scope !== 'installment') {
      const err: any = new Error("Scope must be either 'academic_year' or 'installment'");
      err.statusCode = 400;
      throw err;
    }

    if (payload.scope === 'installment' && !safeTermId) {
      const err: any = new Error('Installment term is required when scope is set to installment');
      err.statusCode = 400;
      throw err;
    }

    // 1. Verify student belongs to this tenant organization
    const student = await prisma.students.findFirst({
      where: {
        student_id: safeStudentId,
        org_id: safeOrgId,
      },
    });

    if (!student) {
      const err: any = new Error('Student not found or does not belong to authorized tenant organization');
      err.statusCode = 404;
      throw err;
    }

    // 2. Verify academic year belongs to this tenant organization
    const year = await prisma.academic_years.findFirst({
      where: {
        academic_year_id: safeYearId,
        org_id: safeOrgId,
      },
    });

    if (!year) {
      const err: any = new Error('Academic year not found or does not belong to authorized tenant organization');
      err.statusCode = 404;
      throw err;
    }

    // 3. Prevent duplicate active recommendation for same student, name, and scope
    const existing: any = await prisma.$queryRaw`
      SELECT scholarship_concession_id, status
      FROM scholarship_concessions
      WHERE student_id = ${safeStudentId}::uuid
        AND academic_year_id = ${safeYearId}::uuid
        AND LOWER(concession_name) = LOWER(${payload.concessionName.trim()})
        AND status IN ('recommended'::scholarship_concession_status, 'approved'::scholarship_concession_status, 'applied'::scholarship_concession_status)
      LIMIT 1;
    `;

    if (existing.length > 0) {
      const err: any = new Error(`An active concession '${payload.concessionName.trim()}' already exists for this student with status '${existing[0].status}'.`);
      err.statusCode = 409;
      throw err;
    }

    // 4. Create concession in repository
    const created = await ScholarshipRepository.createConcession({
      studentId: safeStudentId,
      academicYearId: safeYearId,
      scholarshipType: payload.scholarshipType,
      concessionName: payload.concessionName.trim(),
      concessionPercentage: pct,
      scope: payload.scope,
      installmentTermId: payload.scope === 'installment' ? safeTermId : null,
      recommendationReason: payload.recommendationReason.trim(),
      recommendedBy: safeUserId || '00000000-0000-0000-0000-000000000000',
      notes: payload.notes ? payload.notes.trim() : null,
      createdBy: safeUserId,
    });

    // Authoritative submission event emission
    FinanceNotificationService.publishEvent({
      eventType: FinanceEventType.CONCESSION_SUBMITTED,
      orgId: safeOrgId,
      sourceEntityId: created.scholarship_concession_id,
      sourceWorkflow: 'scholarship_concession_recommend',
      timestamp: new Date().toISOString(),
      correlationId: `conc_${created.scholarship_concession_id}`,
      idempotencyKey: `conc_sub_${created.scholarship_concession_id}`,
      studentId: safeStudentId,
      studentName: `${student.first_name} ${student.last_name || ''}`.trim(),
      admissionNo: student.admission_no,
      concessionName: payload.concessionName.trim(),
      concessionPercentage: pct,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[ScholarshipConcessionService] Concession submitted notification error:', err);
    });

    return created;
  }

  /**
   * Process approval or rejection decision.
   */
  public static async reviewConcession(
    orgId: string,
    userId: string,
    concessionId: string,
    payload: ReviewConcessionInput
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!userId) throw new Error('Reviewing user ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeUserId = toSafeUuid(userId);
    const safeConcId = toSafeUuid(concessionId);

    if (!safeConcId) {
      const err: any = new Error('Invalid concession identifier');
      err.statusCode = 400;
      throw err;
    }

    if (payload.action !== 'approved' && payload.action !== 'rejected') {
      const err: any = new Error("Decision action must be either 'approved' or 'rejected'");
      err.statusCode = 400;
      throw err;
    }

    // Verify record exists and belongs to tenant org
    const current = await ScholarshipRepository.findConcessionById(safeConcId, safeOrgId);
    if (!current) {
      const err: any = new Error('Scholarship/Concession record not found');
      err.statusCode = 404;
      throw err;
    }

    // Self-approval policy check: Separation of duties
    if (safeUserId && current.recommended_by === safeUserId) {
      const err: any = new Error('Separation of duties violation: Recommenders cannot approve their own scholarship awards');
      err.statusCode = 403;
      throw err;
    }

    if (payload.action === 'approved') {
      const apprPct = payload.approvedPercentage !== undefined && payload.approvedPercentage !== null
        ? Number(payload.approvedPercentage)
        : Number(current.concession_percentage);
      if (isNaN(apprPct) || apprPct <= 0 || apprPct > 100) {
        const err: any = new Error('Approved percentage must be between 0.01 and 100.00%');
        err.statusCode = 400;
        throw err;
      }
    }

    const decisionResult = await ScholarshipRepository.recordApprovalDecision(safeConcId, {
      action: payload.action,
      approvedPercentage: payload.approvedPercentage,
      remarks: payload.remarks ? payload.remarks.trim() : null,
      actionBy: safeUserId || '00000000-0000-0000-0000-000000000000',
    });

    const eventType = payload.action === 'approved'
      ? FinanceEventType.CONCESSION_APPROVED
      : FinanceEventType.CONCESSION_REJECTED;

    FinanceNotificationService.publishEvent({
      eventType,
      orgId: safeOrgId,
      sourceEntityId: safeConcId,
      sourceWorkflow: 'scholarship_concession_review',
      timestamp: new Date().toISOString(),
      correlationId: `conc_rev_${safeConcId}`,
      idempotencyKey: `conc_${payload.action}_${safeConcId}`,
      studentId: current.student_id,
      studentName: `${current.first_name || ''} ${current.last_name || ''}`.trim() || 'Student',
      admissionNo: current.admission_no,
      concessionName: current.concession_name,
      approvedPercentage: Number(payload.approvedPercentage || current.concession_percentage),
      notes: payload.remarks ? payload.remarks.trim() : undefined,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[ScholarshipConcessionService] Concession review notification error:', err);
    });

    return decisionResult;
  }

  /**
   * Apply an approved concession to a student's ledger dues atomically.
   */
  public static async applyConcession(
    orgId: string,
    userId: string,
    concessionId: string
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!userId) throw new Error('Applying user ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeUserId = toSafeUuid(userId);
    const safeConcId = toSafeUuid(concessionId);

    if (!safeConcId) {
      const err: any = new Error('Invalid concession identifier');
      err.statusCode = 400;
      throw err;
    }

    const applyResult = await prisma.$transaction(async (tx: any) => {
      return ScholarshipRepository.applyConcessionToLedger(
        safeConcId,
        safeUserId || '00000000-0000-0000-0000-000000000000',
        safeOrgId,
        tx
      );
    });

    FinanceNotificationService.publishEvent({
      eventType: FinanceEventType.CONCESSION_APPLIED,
      orgId: safeOrgId,
      sourceEntityId: safeConcId,
      sourceWorkflow: 'scholarship_concession_apply',
      timestamp: new Date().toISOString(),
      correlationId: `conc_app_${safeConcId}`,
      idempotencyKey: `conc_applied_${safeConcId}`,
      studentId: applyResult.concession?.student_id || undefined,
      concessionName: applyResult.concession?.concession_name,
      amount: applyResult.totalDiscountApplied,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[ScholarshipConcessionService] Concession applied notification error:', err);
    });

    return applyResult;
  }

  /**
   * Retrieve all concessions for a specific student.
   */
  public static async getStudentConcessions(orgId: string, studentId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!studentId) throw new Error('Student ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);

    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    return ScholarshipRepository.getStudentConcessions(safeStudentId, safeOrgId);
  }

  /**
   * Summary reports by program and academic year.
   */
  public static async getReports(orgId: string, academicYearId?: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeYearId = toSafeUuid(academicYearId);

    const rows: any = await prisma.$queryRaw`
      SELECT
        sc.scholarship_type,
        sc.status,
        COUNT(*)::int as count,
        COALESCE(AVG(sc.concession_percentage), 0)::float8 as avg_concession_pct,
        COALESCE(AVG(sc.approved_percentage), 0)::float8 as avg_approved_pct
      FROM scholarship_concessions sc
      JOIN students s ON sc.student_id = s.student_id
      WHERE s.org_id = ${safeOrgId}::uuid
        ${safeYearId ? prisma.$queryRaw`AND sc.academic_year_id = ${safeYearId}::uuid` : prisma.$queryRaw``}
      GROUP BY sc.scholarship_type, sc.status
      ORDER BY sc.scholarship_type, sc.status;
    `;

    return rows;
  }
}
