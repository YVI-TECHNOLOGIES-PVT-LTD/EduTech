import { Router } from 'express';
import { checkPermission, getEffectiveRoles } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { supabase } from '../../config/supabase';
import { FinanceEngine } from './services/FinanceEngine';
import { ReportingService } from './services/ReportingService';
import { SettingsService } from './services/SettingsService';
import { LedgerPostingService } from './services/LedgerPostingService';
import { FinanceController } from './controllers/FinanceController';
import { ParentFinanceService } from './services/ParentFinanceService';

export const feesRouter = Router();

// ======================================
// 1. STRUCTURES (Fee Structure Management Phase 3)
import prisma from '../../lib/prismaClient';
import { FeeStructureManagerService, toSafeUuid } from './services/FeeStructureManagerService';
import { StudentLedgerService } from './services/StudentLedgerService';

// GET /structures/summary: Summary metrics for dashboard/header
feesRouter.get(
  '/structures/summary',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId } = req.query;
      const metrics = await FeeStructureManagerService.getSummaryMetrics(
        tenantOrgId,
        academicYearId as string | undefined,
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[GET /fees/structures/summary] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'SUMMARY_METRICS_ERROR',
        message: error.message || 'Failed to fetch fee structure summary metrics',
      });
    }
  },
);

// GET /structures/academic-year-grades: Eligible grades for fee structure setup
feesRouter.get(
  '/structures/academic-year-grades',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId } = req.query;
      const grades = await FeeStructureManagerService.getAcademicYearGrades(
        tenantOrgId,
        academicYearId as string | undefined,
      );

      res.json({
        success: true,
        data: grades,
      });
    } catch (error: any) {
      console.error('[GET /fees/structures/academic-year-grades] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'ACADEMIC_YEAR_GRADES_ERROR',
        message: error.message || 'Failed to fetch academic year grades',
      });
    }
  },
);

// GET /structures/installment-plans: Available installment plans for academic year preview
feesRouter.get(
  '/structures/installment-plans',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId } = req.query;
      const plans = await FeeStructureManagerService.getInstallmentPlans(
        tenantOrgId,
        academicYearId as string | undefined,
      );

      res.json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      console.error('[GET /fees/structures/installment-plans] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'INSTALLMENT_PLANS_ERROR',
        message: error.message || 'Failed to fetch installment plans',
      });
    }
  },
);

// Alias: GET /installment-plans
feesRouter.get(
  '/installment-plans',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId } = req.query;
      const plans = await FeeStructureManagerService.getInstallmentPlans(
        tenantOrgId,
        academicYearId as string | undefined,
      );

      res.json({
        success: true,
        data: plans,
      });
    } catch (error: any) {
      console.error('[GET /fees/installment-plans] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'INSTALLMENT_PLANS_ERROR',
        message: error.message || 'Failed to fetch installment plans',
      });
    }
  },
);

// GET /installment-plans/:id: Fetch single installment plan by ID
feesRouter.get(
  '/installment-plans/:id',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { id } = req.params;
      const plan = await FeeStructureManagerService.getInstallmentPlanById(tenantOrgId, id);

      res.json({
        success: true,
        data: plan,
      });
    } catch (error: any) {
      console.error('[GET /fees/installment-plans/:id] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'INSTALLMENT_PLAN_FETCH_ERROR',
        message: error.message || 'Failed to fetch installment plan',
      });
    }
  },
);

// POST /installment-plans: Create installment plan with terms (supports any number of terms)
feesRouter.post('/installment-plans', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || 'system';

    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const plan = await FeeStructureManagerService.createInstallmentPlan(
      tenantOrgId,
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: 'Installment plan created successfully as draft.',
      data: plan,
    });
  } catch (error: any) {
    console.error('[POST /fees/installment-plans] Error:', error);
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      error: error.code || 'INSTALLMENT_PLAN_CREATE_ERROR',
      message: error.message || 'Failed to create installment plan',
    });
  }
});

// PUT /installment-plans/:id: Update installment plan (terms immutability verified)
feesRouter.put(
  '/installment-plans/:id',
  checkPermission(PERMISSIONS.FEES_SETUP),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId = req.context?.user?.id || 'system';
      const { id } = req.params;

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const plan = await FeeStructureManagerService.updateInstallmentPlan(
        tenantOrgId,
        userId,
        id,
        req.body,
      );

      res.json({
        success: true,
        message: 'Installment plan updated successfully.',
        data: plan,
      });
    } catch (error: any) {
      console.error('[PUT /fees/installment-plans/:id] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'INSTALLMENT_PLAN_UPDATE_ERROR',
        message: error.message || 'Failed to update installment plan',
      });
    }
  },
);

// POST /installment-plans/:id/publish: Publish installment plan
feesRouter.post(
  '/installment-plans/:id/publish',
  checkPermission(PERMISSIONS.FEES_SETUP),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId = req.context?.user?.id || 'system';
      const { id } = req.params;

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const plan = await FeeStructureManagerService.publishInstallmentPlan(tenantOrgId, userId, id);

      res.json({
        success: true,
        message: 'Installment plan published successfully.',
        data: plan,
      });
    } catch (error: any) {
      console.error('[POST /fees/installment-plans/:id/publish] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'INSTALLMENT_PLAN_PUBLISH_ERROR',
        message: error.message || 'Failed to publish installment plan',
      });
    }
  },
);

// POST /installment-plans/:id/deactivate: Deactivate installment plan
feesRouter.post(
  '/installment-plans/:id/deactivate',
  checkPermission(PERMISSIONS.FEES_SETUP),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId = req.context?.user?.id || 'system';
      const { id } = req.params;

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const plan = await FeeStructureManagerService.deactivateInstallmentPlan(
        tenantOrgId,
        userId,
        id,
      );

      res.json({
        success: true,
        message: 'Installment plan deactivated successfully.',
        data: plan,
      });
    } catch (error: any) {
      console.error('[POST /fees/installment-plans/:id/deactivate] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'INSTALLMENT_PLAN_DEACTIVATE_ERROR',
        message: error.message || 'Failed to deactivate installment plan',
      });
    }
  },
);

// GET /structures/eligible-students: Retrieve enrolled students eligible for fee structure assignment
feesRouter.get(
  '/structures/eligible-students',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId, gradeId, search, page, limit } = req.query;
      const result = await FeeStructureManagerService.getEligibleEnrolledStudents(tenantOrgId, {
        academicYearId: academicYearId as string | undefined,
        gradeId: gradeId as string | undefined,
        search: search as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json({
        success: true,
        ...result,
        data: result.items,
      });
    } catch (error: any) {
      console.error('[GET /fees/structures/eligible-students] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'ELIGIBLE_STUDENTS_ERROR',
        message: error.message || 'Failed to fetch eligible enrolled students',
      });
    }
  },
);

// GET /structures/:id: Fetch single structure by ID
feesRouter.get(
  '/structures/:id',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { id } = req.params;
      const structure = await FeeStructureManagerService.getStructureById(tenantOrgId, id);

      res.json({
        success: true,
        data: structure,
      });
    } catch (error: any) {
      console.error('[GET /fees/structures/:id] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'STRUCTURE_FETCH_ERROR',
        message: error.message || 'Failed to fetch fee structure',
      });
    }
  },
);

// GET /structures: List active & filterable fee structures
feesRouter.get(
  '/structures',
  checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.query.org_id as string) ||
        (req.query.school_id as string) ||
        (req.headers['x-org-id'] as string) ||
        (req.headers['x-tenant-id'] as string) ||
        (req.headers['x-school-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId, gradeId, status, search, page, limit } = req.query;
      const result = await FeeStructureManagerService.listStructures(tenantOrgId, {
        academicYearId: academicYearId as string | undefined,
        gradeId: gradeId as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      // Backward compatibility: support data, items, structures aliases for various consumers
      res.json({
        success: true,
        ...result,
        data: result.items,
        structures: result.items,
      });
    } catch (error: any) {
      console.error('[GET /fees/structures] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'STRUCTURE_LIST_ERROR',
        message: error.message || 'Failed to list fee structures',
      });
    }
  },
);

// POST /structures: Create new fee structure
feesRouter.post('/structures', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || 'system';

    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const structure = await FeeStructureManagerService.createStructure(
      tenantOrgId,
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully as draft.',
      data: structure,
    });
  } catch (error: any) {
    console.error('[POST /fees/structures] Error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'STRUCTURE_CREATE_ERROR',
      message: error.message || 'Failed to create fee structure',
    });
  }
});

// PUT /structures/:id: Update fee structure
feesRouter.put('/structures/:id', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || 'system';
    const { id } = req.params;

    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const structure = await FeeStructureManagerService.updateStructure(
      tenantOrgId,
      userId,
      id,
      req.body,
    );

    res.json({
      success: true,
      message: 'Fee structure updated successfully.',
      data: structure,
    });
  } catch (error: any) {
    console.error('[PUT /fees/structures/:id] Error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'STRUCTURE_UPDATE_ERROR',
      message: error.message || 'Failed to update fee structure',
    });
  }
});

// PATCH /structures/:id: Partial update fee structure
feesRouter.patch('/structures/:id', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || 'system';
    const { id } = req.params;

    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const structure = await FeeStructureManagerService.updateStructure(
      tenantOrgId,
      userId,
      id,
      req.body,
    );

    res.json({
      success: true,
      message: 'Fee structure updated successfully.',
      data: structure,
    });
  } catch (error: any) {
    console.error('[PATCH /fees/structures/:id] Error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'STRUCTURE_UPDATE_ERROR',
      message: error.message || 'Failed to update fee structure',
    });
  }
});

// POST /structures/:id/publish: Publish fee structure
feesRouter.post(
  '/structures/:id/publish',
  checkPermission(PERMISSIONS.FEES_SETUP),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId = req.context?.user?.id || 'system';
      const { id } = req.params;

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const structure = await FeeStructureManagerService.publishStructure(tenantOrgId, userId, id);

      res.json({
        success: true,
        message: 'Fee structure published successfully.',
        data: structure,
      });
    } catch (error: any) {
      console.error('[POST /fees/structures/:id/publish] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'STRUCTURE_PUBLISH_ERROR',
        message: error.message || 'Failed to publish fee structure',
      });
    }
  },
);

// POST /structures/:id/deactivate: Deactivate fee structure
feesRouter.post(
  '/structures/:id/deactivate',
  checkPermission(PERMISSIONS.FEES_SETUP),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId = req.context?.user?.id || 'system';
      const { id } = req.params;

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const structure = await FeeStructureManagerService.deactivateStructure(
        tenantOrgId,
        userId,
        id,
      );

      res.json({
        success: true,
        message: 'Fee structure deactivated successfully.',
        data: structure,
      });
    } catch (error: any) {
      console.error('[POST /fees/structures/:id/deactivate] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'STRUCTURE_DEACTIVATE_ERROR',
        message: error.message || 'Failed to deactivate fee structure',
      });
    }
  },
);

// DELETE /structures/:id: Deactivate/archive fee structure
feesRouter.delete('/structures/:id', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || 'system';
    const { id } = req.params;

    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const structure = await FeeStructureManagerService.deactivateStructure(tenantOrgId, userId, id);

    res.json({
      success: true,
      message: 'Fee structure deactivated successfully.',
      data: structure,
    });
  } catch (error: any) {
    console.error('[DELETE /fees/structures/:id] Error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'STRUCTURE_DELETE_ERROR',
      message: error.message || 'Failed to archive fee structure',
    });
  }
});

// GET /application/:applicationId/preview: Get fee structures and components preview for an admission application
feesRouter.get(
  '/application/:applicationId/preview',
  checkPermission(PERMISSIONS.ADMISSION_FEES_INITIALIZE),
  FinanceController.getFeePreview,
);

// GET /demands: List billing demands (backed by schema.prisma student_fee_assignments)
feesRouter.get('/demands', checkPermission(PERMISSIONS.FEES_DEMAND_VIEW), async (req, res) => {
  try {
    const { status, studentId } = req.query;
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.query.org_id as string) ||
      (req.query.school_id as string) ||
      (req.headers['x-org-id'] as string) ||
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['x-school-id'] as string);

    const safeOrgId = toSafeUuid(tenantOrgId);
    const safeStudentId = toSafeUuid(studentId as string);

    const whereClause: any = {};
    if (safeOrgId) {
      whereClause.student_enrollments = {
        students: {
          org_id: safeOrgId,
          ...(safeStudentId ? { student_id: safeStudentId } : {}),
        },
      };
    } else if (safeStudentId) {
      whereClause.student_enrollments = {
        student_id: safeStudentId,
      };
    }

    const assignments = await prisma.student_fee_assignments.findMany({
      where: whereClause,
      include: {
        student_enrollments: {
          include: {
            students: true,
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        fee_structures: {
          include: {
            fee_components: true,
          },
        },
        installment_plans: {
          include: {
            installment_plan_terms: true,
          },
        },
        student_charges: {
          include: {
            student_charge_dues: true,
          },
        },
      },
      orderBy: { assigned_at: 'desc' },
      take: 200,
    });

    const mapped = assignments.map((sfa) => {
      const student = sfa.student_enrollments?.students;
      const ayg = sfa.student_enrollments?.academic_year_grades;

      let totalAmount = 0;
      let balanceAmount = 0;
      let hasOverdue = false;
      let earliestDueDate: Date | null = null;

      for (const sc of sfa.student_charges) {
        totalAmount += Number(sc.amount);
        for (const due of sc.student_charge_dues) {
          if (due.status !== 'paid' && due.status !== 'waived') {
            balanceAmount += Number(due.amount_due);
            if (due.due_date && new Date(due.due_date) < new Date()) {
              hasOverdue = true;
            }
          }
          if (due.due_date && (!earliestDueDate || new Date(due.due_date) < earliestDueDate)) {
            earliestDueDate = new Date(due.due_date);
          }
        }
      }

      let derivedStatus = 'PENDING';
      if (sfa.status === 'cancelled') {
        derivedStatus = 'CANCELLED';
      } else if (balanceAmount <= 0 && totalAmount > 0) {
        derivedStatus = 'PAID';
      } else if (hasOverdue) {
        derivedStatus = 'OVERDUE';
      } else if (balanceAmount < totalAmount) {
        derivedStatus = 'PARTIAL';
      }

      return {
        id: sfa.student_fee_assignment_id,
        demand_id: sfa.student_fee_assignment_id,
        demand_no: `DEM-${sfa.student_fee_assignment_id.slice(0, 8).toUpperCase()}`,
        student_id: student?.student_id,
        student: student
          ? {
              id: student.student_id,
              full_name: `${student.first_name} ${student.last_name || ''}`.trim(),
              student_code: student.admission_no,
              admission_no: student.admission_no,
            }
          : null,
        application: null,
        fee_structure_id: sfa.fee_structure_id,
        fee_structure: sfa.fee_structures
          ? {
              id: sfa.fee_structures.fee_structure_id,
              name: sfa.fee_structures.name,
              academic_year: ayg?.academic_years
                ? { year_label: ayg.academic_years.academic_year_name }
                : undefined,
            }
          : null,
        amount: totalAmount,
        balance_amount: balanceAmount,
        due_date: earliestDueDate
          ? earliestDueDate.toISOString().split('T')[0]
          : sfa.assigned_at.toISOString().split('T')[0],
        status: derivedStatus,
        items: sfa.student_charges.map((sc) => ({
          id: sc.student_charge_id,
          name: sc.description,
          amount: Number(sc.amount),
        })),
        created_at: sfa.assigned_at,
      };
    });

    const filtered = status
      ? mapped.filter((m) => m.status.toUpperCase() === String(status).toUpperCase())
      : mapped;

    res.json(filtered);
  } catch (error: any) {
    console.error('[GET /fees/demands error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /demands/generate: Allocate billing structure demand (Supports single and bulk)
feesRouter.post(
  '/demands/generate',
  checkPermission(PERMISSIONS.FEES_DEMAND_GENERATE),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-org-id'] as string) ||
        (req.headers['x-tenant-id'] as string);
      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
      const { student_id, student_ids, fee_structure_id, due_date } = req.body;

      if (!fee_structure_id) {
        return res.status(400).json({ error: 'fee_structure_id is required' });
      }

      // Support bulk generation by class student list
      if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
        const bulkRes = await StudentLedgerService.bulkAssignFeeStructure(tenantOrgId, userId, {
          studentIds: student_ids,
          feeStructureId: fee_structure_id,
        });
        return res.status(201).json(bulkRes);
      }

      if (!student_id) {
        return res.status(400).json({ error: 'student_id is required' });
      }

      const assignment = await StudentLedgerService.assignFeeStructure(tenantOrgId, userId, {
        studentId: student_id,
        feeStructureId: fee_structure_id,
      });

      res.status(201).json(assignment);
    } catch (error: any) {
      console.error('POST /fees/demands/generate error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message });
    }
  },
);

// ======================================
// 3. PAYMENTS COLLECTION (Phase 5: Payment Collection)
// ======================================
import { PaymentCollectionService } from './services/PaymentCollectionService';

// GET /payments/students/:studentId/obligations: Fetch eligible unpaid dues for collection
feesRouter.get(
  '/payments/students/:studentId/obligations',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const result = await PaymentCollectionService.getEligibleObligations(tenantOrgId, studentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error(
        `[GET /fees/payments/students/${req.params.studentId}/obligations] Error:`,
        error,
      );
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'ELIGIBLE_OBLIGATIONS_ERROR',
        message: error.message || 'Failed to fetch student unpaid obligations',
      });
    }
  },
);

// POST /payments/collect: Record verified offline payment (Cash, Bank Transfer, Other)
feesRouter.post(
  '/payments/collect',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || null;
      const result = await PaymentCollectionService.recordOfflinePayment(
        tenantOrgId,
        userId,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: 'Payment collected and allocated successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('[POST /fees/payments/collect] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'PAYMENT_COLLECTION_ERROR',
        message: error.message || 'Failed to record offline payment',
      });
    }
  },
);

// POST /payments/create-order: Create online payment order (UPI, Card, Net Banking, Wallet via Razorpay)
feesRouter.post('/payments/create-order', async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || null;
    const userRoles = req.context?.user?.roles || [];
    const userPermissions = req.context?.user?.permissions || [];
    const isStaff =
      userRoles.includes('ADMIN') ||
      userRoles.includes('FINANCE_OFFICER') ||
      userRoles.includes('FINANCE_MANAGER') ||
      userRoles.includes('ACCOUNTANT') ||
      userRoles.includes('SUPERADMIN') ||
      userPermissions.includes('fees.payment.collect');

    if (!isStaff) {
      const isParentRole =
        userRoles.includes('PARENT') || userPermissions.includes('DASHBOARD_VIEW_PARENT');
      if (!isParentRole || !userId) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Forbidden: Insufficient permissions to create payment orders',
        });
      }

      const studentId = req.body?.studentId || req.body?.student_id;
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'STUDENT_REQUIRED',
          message: 'Valid student ID is required for payment order creation.',
        });
      }

      const isAuthorized = await ParentFinanceService.verifyParentChildAccess(
        tenantOrgId,
        userId,
        studentId,
        req.context?.user?.email,
      );

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Forbidden: You are not authorized to create payment orders for this student.',
        });
      }

      const parentOrderResult = await ParentFinanceService.createParentPaymentOrder(
        tenantOrgId,
        userId,
        req.body,
        req.context?.user?.email,
      );

      return res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: parentOrderResult,
      });
    }

    const result = await PaymentCollectionService.createOnlinePaymentOrder(
      tenantOrgId,
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: 'Payment order created successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('[POST /fees/payments/create-order] Error:', error);
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      error: error.code || 'CREATE_ORDER_ERROR',
      message: error.message || 'Failed to create payment order',
    });
  }
});

// POST /payments/verify: Cryptographically verify online payment signature and allocate
feesRouter.post(
  '/payments/verify',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || null;
      const result = await PaymentCollectionService.verifyOnlinePayment(
        tenantOrgId,
        userId,
        req.body,
      );

      res.json({
        success: true,
        message: 'Payment verified and captured successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('[POST /fees/payments/verify] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'PAYMENT_VERIFICATION_ERROR',
        message: error.message || 'Payment signature verification failed',
      });
    }
  },
);

// POST /payments/webhook: Dedicated Razorpay Webhook Ingestion
// Authenticated cryptographically via x-razorpay-signature header against RAZORPAY_WEBHOOK_SECRET
feesRouter.post('/payments/webhook', async (req, res) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] || '') as string;
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_SIGNATURE',
        message: 'Missing x-razorpay-signature header for webhook authentication.',
      });
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody || (Buffer.isBuffer(rawBody) && rawBody.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'RAW_BODY_UNAVAILABLE',
        message:
          'Raw request body is unavailable for cryptographic webhook signature verification.',
      });
    }
    const result = await PaymentCollectionService.processWebhookEvent(rawBody, signature, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('[POST /fees/payments/webhook] Error:', error);
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      error: error.code || 'WEBHOOK_VERIFICATION_FAILED',
      message: error.message || 'Failed to process webhook event',
    });
  }
});

// GET /payments/history: Tenant-scoped payment transactions history
feesRouter.get(
  '/payments/history',
  checkPermission(PERMISSIONS.FEES_PAYMENT_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId, status, paymentMethod, dateFrom, dateTo, page, limit } = req.query;
      const result = await PaymentCollectionService.getPaymentHistory(tenantOrgId, {
        studentId: studentId as string | undefined,
        status: status as string | undefined,
        paymentMethod: paymentMethod as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('[GET /fees/payments/history] Error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'PAYMENT_HISTORY_ERROR',
        message: error.message || 'Failed to fetch payment history',
      });
    }
  },
);

// GET /payments/receipts/:transactionId: Official receipt document for a transaction
feesRouter.get('/payments/receipts/:transactionId', async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const userId = req.context?.user?.id;
    const userRoles = req.context?.user?.roles || [];
    const userPermissions = req.context?.user?.permissions || [];
    const isStaff =
      userRoles.includes('ADMIN') ||
      userRoles.includes('FINANCE_OFFICER') ||
      userRoles.includes('FINANCE_MANAGER') ||
      userRoles.includes('ACCOUNTANT') ||
      userRoles.includes('SUPERADMIN') ||
      userPermissions.includes('fees.view');

    const { transactionId } = req.params;
    const receipt = await PaymentCollectionService.getReceiptDetails(tenantOrgId, transactionId);

    if (!isStaff) {
      const isParentRole =
        userRoles.includes('PARENT') || userPermissions.includes('DASHBOARD_VIEW_PARENT');
      if (!isParentRole || !userId) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Forbidden: Insufficient permissions to view fee receipts',
        });
      }

      const isAuthorized = await ParentFinanceService.verifyParentChildAccess(
        tenantOrgId,
        userId,
        receipt.student_id,
        req.context?.user?.email,
      );

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Forbidden: You are not authorized to view receipts for this student.',
        });
      }
    }

    res.json({
      success: true,
      data: receipt,
    });
  } catch (error: any) {
    console.error(`[GET /fees/payments/receipts/${req.params.transactionId}] Error:`, error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'RECEIPT_FETCH_ERROR',
      message: error.message || 'Failed to fetch receipt details',
    });
  }
});

// Backward compatibility: POST /payments
feesRouter.post('/payments', checkPermission(PERMISSIONS.PAYMENT_RECORD), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || null;
    const {
      student_id,
      studentId,
      student_charge_due_id,
      studentChargeDueId,
      demand_id,
      amount,
      payment_mode,
      paymentMethod,
      transaction_reference,
      notes,
    } = req.body;

    const targetStudentId = studentId || student_id;
    const targetDueId = studentChargeDueId || student_charge_due_id || demand_id;

    // If payload has student ID and obligation due ID, delegate to PaymentCollectionService
    if (tenantOrgId && targetStudentId && targetDueId) {
      const methodStr = (paymentMethod || payment_mode || 'cash').toLowerCase();
      const mappedMethod = methodStr.includes('upi')
        ? 'upi'
        : methodStr.includes('card')
          ? 'card'
          : methodStr.includes('transfer') || methodStr.includes('bank')
            ? 'bank_transfer'
            : methodStr.includes('cash')
              ? 'cash'
              : 'other';

      if (['cash', 'bank_transfer', 'other'].includes(mappedMethod)) {
        const result = await PaymentCollectionService.recordOfflinePayment(tenantOrgId, userId, {
          studentId: targetStudentId,
          studentChargeDueId: targetDueId,
          amount: Number(amount),
          paymentMethod: mappedMethod as any,
          transactionReference: transaction_reference,
          notes: notes,
        });
        return res.status(201).json(result);
      }
    }

    // Fallback to legacy FinanceEngine
    const result = await FinanceEngine.collectPayment({
      application_id: req.body.application_id,
      student_id: targetStudentId,
      demand_id: targetDueId,
      amount: Number(amount),
      payment_mode: req.body.payment_mode || 'Cash',
      transaction_reference: transaction_reference,
      bank_name: req.body.bank_name,
      gateway_name: req.body.gateway_name,
      gateway_transaction_id: req.body.gateway_transaction_id,
      payment_channel: req.body.payment_channel,
      cashierId: userId || 'CASHIER',
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('POST /fees/payments error:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// ======================================
// 4. RECEIPTS
// ======================================

feesRouter.get('/receipts/:id', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      (req.context?.user as any)?.orgId ||
      req.context?.user?.school_id;
    const { id } = req.params;

    const receipt = await PaymentCollectionService.getReceiptDetails(tenantOrgId, id);
    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'RECEIPT_NOT_FOUND',
        message: 'Receipt not found',
      });
    }

    res.json(receipt);
  } catch (error: any) {
    console.error(`[GET /fees/receipts/${req.params.id}] Error:`, error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

feesRouter.post(
  '/receipts/:id/reprint',
  checkPermission(PERMISSIONS.FEES_RECEIPT_GENERATE),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        (req.context?.user as any)?.orgId ||
        req.context?.user?.school_id;
      const { id } = req.params;

      const receipt = await PaymentCollectionService.getReceiptDetails(tenantOrgId, id);
      if (!receipt) {
        return res.status(404).json({
          success: false,
          error: 'RECEIPT_NOT_FOUND',
          message: 'Receipt not found for reprint',
        });
      }

      const reprintedReceipt = {
        ...receipt,
        receipt_type: 'REPRINT',
        print_count: (receipt.print_count || 1) + 1,
        reprinted_at: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        receipt: reprintedReceipt,
        data: reprintedReceipt,
      });
    } catch (error: any) {
      console.error('POST /receipts/:id/reprint error:', error);
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

// ======================================
// 5. LEDGER & BALANCES (Phase 4: Student Fee Ledger)
// ======================================

// GET /ledger/students: Search eligible students for ledger management
feesRouter.get('/ledger/students', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { query, academicYearId, gradeId, page, limit } = req.query;
    const result = await StudentLedgerService.searchStudents(tenantOrgId, {
      query: query as string | undefined,
      academicYearId: academicYearId as string | undefined,
      gradeId: gradeId as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result.students,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('[GET /fees/ledger/students] Error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'LEDGER_SEARCH_ERROR',
      message: error.message || 'Failed to search students for fee ledger',
    });
  }
});

// GET /ledger/students/:studentId: Student ledger summary, KPI totals, and enrollment details
feesRouter.get('/ledger/students/:studentId', async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { studentId } = req.params;
    const { academicYearId } = req.query;
    const user = req.context?.user;
    const roles = user ? getEffectiveRoles(user.roles || []) : [];
    const permissions = user?.permissions || [];

    const isStaffOrAdmin =
      roles.includes('SUPERADMIN') ||
      roles.includes('ADMIN') ||
      roles.includes('ACCOUNTANT') ||
      roles.includes('FINANCE_OFFICER') ||
      permissions.includes(PERMISSIONS.FEES_VIEW);

    if (!isStaffOrAdmin) {
      if (roles.includes('PARENT') || roles.includes('STUDENT')) {
        const hasAccess = await ParentFinanceService.verifyParentChildAccess(
          tenantOrgId,
          user?.id || '',
          studentId,
          user?.email,
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'FORBIDDEN',
            message: 'You are not authorized to view financial records for this student.',
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Insufficient permissions to view student fee ledger.',
        });
      }
    }

    const summary = await StudentLedgerService.getStudentLedgerSummary(
      tenantOrgId,
      studentId,
      academicYearId as string | undefined,
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error(`[GET /fees/ledger/students/${req.params.studentId}] Error:`, error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'LEDGER_SUMMARY_ERROR',
      message: error.message || 'Failed to fetch student ledger summary',
    });
  }
});

// GET /ledger/students/:studentId/assessments: Detailed fee assessments, structures, and billed charges
feesRouter.get(
  '/ledger/students/:studentId/assessments',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const assessments = await StudentLedgerService.getStudentAssessments(tenantOrgId, studentId);

      res.json({
        success: true,
        data: assessments,
      });
    } catch (error: any) {
      console.error(
        `[GET /fees/ledger/students/${req.params.studentId}/assessments] Error:`,
        error,
      );
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'ASSESSMENTS_FETCH_ERROR',
        message: error.message || 'Failed to fetch student fee assessments',
      });
    }
  },
);

// GET /ledger/students/:studentId/payments: Recorded payment transactions and obligation allocations
feesRouter.get(
  '/ledger/students/:studentId/payments',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const payments = await StudentLedgerService.getStudentPayments(tenantOrgId, studentId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error(`[GET /fees/ledger/students/${req.params.studentId}/payments] Error:`, error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'PAYMENTS_FETCH_ERROR',
        message: error.message || 'Failed to fetch student payment history',
      });
    }
  },
);

// GET /ledger/students/:studentId/dues: Scheduled fee dues, due dates, outstanding amounts, and overdue status
feesRouter.get(
  '/ledger/students/:studentId/dues',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const dues = await StudentLedgerService.getStudentDues(tenantOrgId, studentId);

      res.json({
        success: true,
        data: dues,
      });
    } catch (error: any) {
      console.error(`[GET /fees/ledger/students/${req.params.studentId}/dues] Error:`, error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'DUES_FETCH_ERROR',
        message: error.message || 'Failed to fetch student fee obligations',
      });
    }
  },
);

// GET /ledger/students/:studentId/transactions: Chronological timeline of ledger transactions and events
feesRouter.get(
  '/ledger/students/:studentId/transactions',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const history = await StudentLedgerService.getStudentTransactionHistory(
        tenantOrgId,
        studentId,
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      console.error(
        `[GET /fees/ledger/students/${req.params.studentId}/transactions] Error:`,
        error,
      );
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'TRANSACTIONS_FETCH_ERROR',
        message: error.message || 'Failed to fetch student ledger transaction history',
      });
    }
  },
);

// GET /ledger/students/:studentId/eligible-structures: Published fee structures matching student enrollment
feesRouter.get(
  '/ledger/students/:studentId/eligible-structures',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const elig = await StudentLedgerService.getEligibleStructures(tenantOrgId, studentId);

      res.json({
        success: true,
        data: elig,
      });
    } catch (error: any) {
      console.error(
        `[GET /fees/ledger/students/${req.params.studentId}/eligible-structures] Error:`,
        error,
      );
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'ELIGIBLE_STRUCTURES_ERROR',
        message: error.message || 'Failed to fetch eligible fee structures',
      });
    }
  },
);

// POST /ledger/assignments: Assign a published fee structure to an eligible student enrollment
feesRouter.post(
  '/ledger/assignments',
  checkPermission(PERMISSIONS.FEES_ASSIGN),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || null;
      const assignment = await StudentLedgerService.assignFeeStructure(
        tenantOrgId,
        userId,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: 'Fee structure assigned to student enrollment successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error('[POST /fees/ledger/assignments] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'STRUCTURE_ASSIGNMENT_ERROR',
        message: error.message || 'Failed to assign fee structure',
      });
    }
  },
);

// POST /ledger/assignments/bulk: Bulk assign a published fee structure to multiple enrolled students
feesRouter.post(
  '/ledger/assignments/bulk',
  checkPermission(PERMISSIONS.FEES_ASSIGN),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
      const result = await StudentLedgerService.bulkAssignFeeStructure(
        tenantOrgId,
        userId,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: `Bulk assignment processed: ${result.succeeded} succeeded, ${result.failed} failed.`,
        data: result,
      });
    } catch (error: any) {
      console.error('[POST /fees/ledger/assignments/bulk] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'BULK_ASSIGNMENT_ERROR',
        message: error.message || 'Failed to process bulk fee structure assignment',
      });
    }
  },
);

// Alias: POST /assignments/bulk
feesRouter.post('/assignments/bulk', checkPermission(PERMISSIONS.FEES_ASSIGN), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
    const result = await StudentLedgerService.bulkAssignFeeStructure(tenantOrgId, userId, req.body);

    res.status(200).json({
      success: true,
      message: `Bulk assignment processed: ${result.succeeded} succeeded, ${result.failed} failed.`,
      data: result,
    });
  } catch (error: any) {
    console.error('[POST /fees/assignments/bulk] Error:', error);
    const status = error.statusCode || 400;
    res.status(status).json({
      success: false,
      error: error.code || 'BULK_ASSIGNMENT_ERROR',
      message: error.message || 'Failed to process bulk fee structure assignment',
    });
  }
});

// Backward compatibility: POST /assign/:studentId
feesRouter.post(
  '/assign/:studentId',
  checkPermission(PERMISSIONS.FEES_ASSIGN),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
      const assignment = await StudentLedgerService.assignFeeStructure(tenantOrgId, userId, {
        studentId: req.params.studentId,
        feeStructureId: req.body.fee_structure_id || req.body.feeStructureId,
        installmentPlanId: req.body.installment_plan_id || req.body.installmentPlanId,
        notes: req.body.notes,
      });

      res.status(201).json({
        success: true,
        message: 'Fee structure assigned successfully',
        data: assignment,
      });
    } catch (error: any) {
      console.error(`[POST /fees/assign/${req.params.studentId}] Error:`, error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'STRUCTURE_ASSIGNMENT_ERROR',
        message: error.message || 'Failed to assign fee structure',
      });
    }
  },
);

// GET /fees/my: Authenticated parent or student multi-child fee summary and dues
feesRouter.get('/my', checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT), async (req, res) => {
  try {
    const tenantOrgId =
      req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
    const userId = req.context?.user?.id;
    const userEmail = req.context?.user?.email;

    if (!tenantOrgId || !userId) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Valid authenticated session required to retrieve parent fee ledger.',
      });
    }

    const result = await ParentFinanceService.getMyChildrenFees(tenantOrgId, userId, userEmail);

    res.json({
      success: true,
      ...result,
      data: result.children,
    });
  } catch (error: any) {
    console.error('[GET /fees/my] Error:', error);
    const status = error.statusCode || 500;
    res.status(status).json({
      success: false,
      error: error.code || 'PARENT_FEES_ERROR',
      message: error.message || 'Failed to fetch student fees for authenticated account',
    });
  }
});

// GET /fees/my/children/:studentId: Authenticated parent child-specific fee details with strict relationship check
feesRouter.get(
  '/my/children/:studentId',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT),
  async (req, res) => {
    try {
      const tenantOrgId =
        req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
      const userId = req.context?.user?.id;
      const userEmail = req.context?.user?.email;
      const { studentId } = req.params;

      if (!tenantOrgId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Valid authenticated session required.',
        });
      }

      const hasAccess = await ParentFinanceService.verifyParentChildAccess(
        tenantOrgId,
        userId,
        studentId,
        userEmail,
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'You are not authorized to view financial records for this student.',
        });
      }

      const details = await ParentFinanceService.getChildFeeDetails(
        tenantOrgId,
        userId,
        studentId,
        userEmail,
      );

      res.json({
        success: true,
        data: details,
      });
    } catch (error: any) {
      console.error(`[GET /fees/my/children/${req.params.studentId}] Error:`, error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'CHILD_FEES_ERROR',
        message: error.message || 'Failed to fetch child fee details',
      });
    }
  },
);

// POST /fees/my/payments/create-order: Authenticated parent initiates online payment for a child
feesRouter.post(
  '/my/payments/create-order',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT),
  async (req, res) => {
    try {
      const tenantOrgId =
        req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
      const userId = req.context?.user?.id;
      const userEmail = req.context?.user?.email;

      if (!tenantOrgId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Valid authenticated session required to initiate parent fee payment.',
        });
      }

      const result = await ParentFinanceService.createParentPaymentOrder(
        tenantOrgId,
        userId,
        req.body,
        userEmail,
      );

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('[POST /fees/my/payments/create-order] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'CREATE_PAYMENT_ORDER_ERROR',
        message: error.message || 'Failed to create payment order',
      });
    }
  },
);

// POST /fees/my/payments/verify: Authenticated parent verifies and reconciles gateway payment
feesRouter.post(
  '/my/payments/verify',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT),
  async (req, res) => {
    try {
      const tenantOrgId =
        req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
      const userId = req.context?.user?.id;
      const userEmail = req.context?.user?.email;

      if (!tenantOrgId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Valid authenticated session required to verify parent payment.',
        });
      }

      const result = await ParentFinanceService.verifyParentPayment(
        tenantOrgId,
        userId,
        req.body,
        userEmail,
      );

      res.status(200).json({
        success: true,
        message: 'Payment verified and allocated to student ledger successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('[POST /fees/my/payments/verify] Error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: error.code || 'PAYMENT_VERIFICATION_ERROR',
        message: error.message || 'Failed to verify payment',
      });
    }
  },
);

// GET /fees/my/receipts/:transactionId: Official receipt document for an authenticated parent's child
feesRouter.get(
  '/my/receipts/:transactionId',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT),
  async (req, res) => {
    try {
      const tenantOrgId =
        req.context?.user?.org_id || req.context?.user?.school_id || (req as any).tenantOrgId;
      const userId = req.context?.user?.id;
      const userEmail = req.context?.user?.email;
      const { transactionId } = req.params;

      if (!tenantOrgId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Valid authenticated session required to retrieve receipt.',
        });
      }

      const receipt = await ParentFinanceService.getParentReceiptDetails(
        tenantOrgId,
        userId,
        transactionId,
        userEmail,
      );

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error: any) {
      console.error(`[GET /fees/my/receipts/${req.params.transactionId}] Error:`, error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        error: error.code || 'RECEIPT_FETCH_ERROR',
        message: error.message || 'Failed to fetch receipt details',
      });
    }
  },
);

// Backward compatibility: GET /ledger/student/:studentId
feesRouter.get(
  '/ledger/student/:studentId',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const { studentId } = req.params;

      if (tenantOrgId) {
        const summary = await StudentLedgerService.getStudentLedgerSummary(tenantOrgId, studentId);
        const history = await StudentLedgerService.getStudentTransactionHistory(
          tenantOrgId,
          studentId,
        );

        return res.json({
          student_id: studentId,
          balance: summary.summary.outstanding_balance,
          entries: history,
          history: history,
          summary: summary.summary,
        });
      }

      // Fallback
      const balance = await FinanceEngine.calculateBalance({ student_id: studentId });
      const entries = await FinanceEngine.getLedgerHistory({ student_id: studentId });
      res.json({ student_id: studentId, balance, entries, history: entries });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  },
);

// Backward compatibility: GET /ledger/application/:applicationId
feesRouter.get(
  '/ledger/application/:applicationId',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const balance = await FinanceEngine.calculateBalance({ application_id: applicationId });
      const entries = await FinanceEngine.getLedgerHistory({ application_id: applicationId });

      res.json({
        application_id: applicationId,
        balance,
        entries,
        history: entries,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Backward compatibility: GET /admin/ledger
feesRouter.get('/admin/ledger', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const { search } = req.query;

    if (tenantOrgId) {
      const result = await StudentLedgerService.searchStudents(tenantOrgId, {
        query: search as string | undefined,
        limit: 50,
      });

      const formatted = result.students.map((s) => ({
        student_id: s.student_id,
        full_name: s.full_name,
        student_code: s.admission_no,
        class_name: s.enrollment?.grade_name || '-',
        balance: 0,
        status: s.status,
      }));

      return res.json({ data: formatted });
    }

    res.json({ data: [] });
  } catch (error: any) {
    console.error('GET /admin/ledger error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// 6. DASHBOARD ANALYTICS (KPIs and Trends)
// ======================================

feesRouter.get('/dashboard/kpis', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.query.org_id as string) ||
      (req.query.school_id as string) ||
      (req.headers['x-org-id'] as string) ||
      (req.headers['x-tenant-id'] as string) ||
      (req.headers['x-school-id'] as string);
    const today = new Date().toISOString().split('T')[0];

    // 1. Today's collections
    const { data: todayTx } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'SUCCESS')
      .gte('created_at', `${today}T00:00:00.000Z`);

    const todayCollection = todayTx?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // 2. Month collections
    const thisMonthStart = `${today.substring(0, 7)}-01T00:00:00.000Z`;
    const { data: monthTx } = await supabase
      .from('payment_transactions')
      .select('amount')
      .eq('status', 'SUCCESS')
      .gte('created_at', thisMonthStart);

    const monthCollection = monthTx?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // 3. Outstanding Balance from student_outstanding_view
    let totalOutstanding = 0;
    let pendingCount = 0;
    try {
      const safeOrgId = toSafeUuid(tenantOrgId);
      const outstandingAgg: any = safeOrgId
        ? await prisma.$queryRaw`
            SELECT
              COALESCE(SUM(outstanding_amount), 0)::float as total_outstanding,
              COUNT(DISTINCT student_charge_due_id)::int as pending_count
            FROM student_outstanding_view
            WHERE org_id = ${safeOrgId}::uuid
          `
        : await prisma.$queryRaw`
            SELECT
              COALESCE(SUM(outstanding_amount), 0)::float as total_outstanding,
              COUNT(DISTINCT student_charge_due_id)::int as pending_count
            FROM student_outstanding_view
          `;
      totalOutstanding = outstandingAgg[0]?.total_outstanding || 0;
      pendingCount = outstandingAgg[0]?.pending_count || 0;
    } catch {
      totalOutstanding = 0;
      pendingCount = 0;
    }

    // 4. Active & Total Fee Structures count from fee_structures table via Prisma
    let activeStructures = 0;
    let totalStructures = 0;
    if (tenantOrgId) {
      const safeOrgId = toSafeUuid(tenantOrgId) || tenantOrgId;
      [activeStructures, totalStructures] = await Promise.all([
        prisma.fee_structures.count({
          where: {
            status: 'published',
            academic_year_grades: {
              academic_years: {
                org_id: safeOrgId,
              },
            },
          },
        }),
        prisma.fee_structures.count({
          where: {
            academic_year_grades: {
              academic_years: {
                org_id: safeOrgId,
              },
            },
          },
        }),
      ]);
    }

    // 5. Total Transactions
    const { count: txCount } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUCCESS');

    res.json({
      todayCollection,
      monthCollection,
      totalOutstanding,
      pendingCount,
      activeStructuresCount: activeStructures || totalStructures || 0,
      totalStructuresCount: totalStructures || 0,
      publishedStructuresCount: activeStructures || 0,
      transactionsCount: txCount || 0,
      collectionRate: 85, // Mock placeholder percentage
    });
  } catch (error: any) {
    console.error('GET /dashboard/kpis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// PHASE 2: NEW ENDPOINTS
// ======================================

// ──────────────────────────────────────
// DEMANDS — GET single demand detail
// ──────────────────────────────────────
feesRouter.get('/demands/:id', checkPermission(PERMISSIONS.FEES_DEMAND_VIEW), async (req, res) => {
  try {
    const { id } = req.params;
    const safeId = toSafeUuid(id);
    if (!safeId) return res.status(404).json({ error: 'Demand not found' });

    const sfa = await prisma.student_fee_assignments.findUnique({
      where: { student_fee_assignment_id: safeId },
      include: {
        student_enrollments: {
          include: {
            students: true,
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
          },
        },
        fee_structures: {
          include: {
            fee_components: true,
          },
        },
        installment_plans: {
          include: {
            installment_plan_terms: true,
          },
        },
        student_charges: {
          include: {
            student_charge_dues: true,
          },
        },
      },
    });

    if (!sfa) return res.status(404).json({ error: 'Demand not found' });

    const student = sfa.student_enrollments?.students;
    const ayg = sfa.student_enrollments?.academic_year_grades;

    let totalAmount = 0;
    let balanceAmount = 0;
    let hasOverdue = false;
    let earliestDueDate: Date | null = null;

    for (const sc of sfa.student_charges) {
      totalAmount += Number(sc.amount);
      for (const due of sc.student_charge_dues) {
        if (due.status !== 'paid' && due.status !== 'waived') {
          balanceAmount += Number(due.amount_due);
          if (due.due_date && new Date(due.due_date) < new Date()) {
            hasOverdue = true;
          }
        }
        if (due.due_date && (!earliestDueDate || new Date(due.due_date) < earliestDueDate)) {
          earliestDueDate = new Date(due.due_date);
        }
      }
    }

    let derivedStatus = 'PENDING';
    if (sfa.status === 'cancelled') {
      derivedStatus = 'CANCELLED';
    } else if (balanceAmount <= 0 && totalAmount > 0) {
      derivedStatus = 'PAID';
    } else if (hasOverdue) {
      derivedStatus = 'OVERDUE';
    } else if (balanceAmount < totalAmount) {
      derivedStatus = 'PARTIAL';
    }

    // Get any payment transactions related to this student
    const studentId = student?.student_id;
    let transactions: any[] = [];
    if (studentId) {
      transactions = await prisma.payment_transactions.findMany({
        where: {
          payment_orders: {
            student_id: studentId,
          },
        },
        select: {
          payment_transaction_id: true,
          amount: true,
          payment_method: true,
          status: true,
          created_at: true,
          created_by: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      });
    }

    res.json({
      id: sfa.student_fee_assignment_id,
      demand_id: sfa.student_fee_assignment_id,
      demand_no: `DEM-${sfa.student_fee_assignment_id.slice(0, 8).toUpperCase()}`,
      student_id: student?.student_id,
      student: student
        ? {
            id: student.student_id,
            full_name: `${student.first_name} ${student.last_name || ''}`.trim(),
            student_code: student.admission_no,
            admission_no: student.admission_no,
          }
        : null,
      application: null,
      fee_structure_id: sfa.fee_structure_id,
      fee_structure: sfa.fee_structures
        ? {
            id: sfa.fee_structures.fee_structure_id,
            name: sfa.fee_structures.name,
            academic_year: ayg?.academic_years
              ? { year_label: ayg.academic_years.academic_year_name }
              : undefined,
          }
        : null,
      amount: totalAmount,
      balance_amount: balanceAmount,
      due_date: earliestDueDate
        ? earliestDueDate.toISOString().split('T')[0]
        : sfa.assigned_at.toISOString().split('T')[0],
      status: derivedStatus,
      items: sfa.student_charges.map((sc) => ({
        id: sc.student_charge_id,
        name: sc.description,
        amount: Number(sc.amount),
      })),
      transactions: transactions.map((t) => ({
        id: t.payment_transaction_id,
        amount: Number(t.amount),
        payment_mode: t.payment_method,
        transaction_reference: t.payment_transaction_id,
        status: t.status,
        created_at: t.created_at,
        cashier_id: t.created_by,
      })),
      created_at: sfa.assigned_at,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────
// DEMANDS — Bulk generate (class/section/custom)
// ──────────────────────────────────────
feesRouter.post(
  '/demands/bulk-generate',
  checkPermission(PERMISSIONS.FEES_DEMAND_GENERATE),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-org-id'] as string) ||
        (req.headers['x-tenant-id'] as string);
      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
      const { mode, class_id, section_id, student_ids, fee_structure_id, due_date } = req.body;

      if (!fee_structure_id) {
        return res.status(400).json({ error: 'fee_structure_id is required' });
      }

      let targetStudentIds: string[] = [];

      if (mode === 'section' && section_id) {
        const enrollments = await prisma.student_enrollments.findMany({
          where: { section_id: String(section_id), status: 'active' },
          select: { student_id: true },
        });
        targetStudentIds = enrollments.map((e) => e.student_id);
      } else if (mode === 'class' && class_id) {
        const safeClassId = String(class_id);
        const enrollments = await prisma.student_enrollments.findMany({
          where: {
            OR: [
              { academic_year_grade_id: safeClassId },
              { academic_year_grades: { grade_id: safeClassId } },
            ],
            status: 'active',
          },
          select: { student_id: true },
        });
        targetStudentIds = enrollments.map((e) => e.student_id);
      } else if (mode === 'custom' && Array.isArray(student_ids) && student_ids.length > 0) {
        targetStudentIds = student_ids;
      } else {
        return res.status(400).json({ error: 'Invalid bulk generation parameters' });
      }

      if (targetStudentIds.length === 0) {
        return res.status(400).json({ error: 'No active enrolled students found for selection' });
      }

      const bulkRes = await StudentLedgerService.bulkAssignFeeStructure(tenantOrgId, userId, {
        studentIds: targetStudentIds,
        feeStructureId: fee_structure_id,
      });

      res.status(201).json({
        generated: bulkRes.succeeded,
        skipped: bulkRes.failed,
        errors: bulkRes.failed,
        details: bulkRes.results,
        errorDetails: bulkRes.results.filter((r) => !r.success),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────
// DEMANDS — Cancel demand
// ──────────────────────────────────────
feesRouter.patch(
  '/demands/:id/cancel',
  checkPermission(PERMISSIONS.FEES_DEMAND_GENERATE),
  async (req, res) => {
    try {
      const { id } = req.params;
      const safeId = toSafeUuid(id);
      const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
      const { reason } = req.body;

      if (!safeId) return res.status(404).json({ error: 'Demand not found' });

      const assignment = await prisma.student_fee_assignments.findUnique({
        where: { student_fee_assignment_id: safeId },
        include: {
          student_charges: {
            include: {
              student_charge_dues: true,
            },
          },
        },
      });

      if (!assignment) return res.status(404).json({ error: 'Demand not found' });

      const hasPaid = assignment.student_charges.some((sc) =>
        sc.student_charge_dues.some((d) => d.status === 'paid'),
      );
      if (hasPaid) {
        return res.status(422).json({ error: 'Cannot cancel a demand that has recorded payments' });
      }

      await prisma.$transaction([
        prisma.student_fee_assignments.update({
          where: { student_fee_assignment_id: safeId },
          data: {
            status: 'cancelled',
            notes: reason ? `Cancelled: ${reason}` : 'Cancelled by finance officer',
            updated_by: toSafeUuid(userId),
          },
        }),
        prisma.student_charges.updateMany({
          where: { student_fee_assignment_id: safeId },
          data: { status: 'cancelled' },
        }),
      ]);

      res.json({ success: true, message: 'Demand cancelled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────
// WAIVERS — Apply waiver
// ──────────────────────────────────────
feesRouter.post('/waivers', checkPermission(PERMISSIONS.FEES_WAIVER_APPROVE), async (req, res) => {
  try {
    const userId = req.context?.user?.id || (req.context?.user as any)?.user_id || 'system';
    const { demand_id, amount, reason } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid waiver amount' });
    }

    const waiverAmount = Number(amount);
    const safeDemandId = toSafeUuid(demand_id);

    if (!safeDemandId) {
      return res.status(400).json({ error: 'Valid demand_id is required' });
    }

    const assignment = await prisma.student_fee_assignments.findUnique({
      where: { student_fee_assignment_id: safeDemandId },
      include: {
        student_charges: {
          include: {
            student_charge_dues: {
              where: { status: { in: ['pending', 'overdue', 'partially_paid'] } },
              orderBy: { due_date: 'asc' },
            },
          },
        },
      },
    });

    if (!assignment) return res.status(404).json({ error: 'Demand not found' });

    let remainingWaiver = waiverAmount;
    await prisma.$transaction(async (tx) => {
      for (const sc of assignment.student_charges) {
        if (remainingWaiver <= 0) break;
        for (const due of sc.student_charge_dues) {
          if (remainingWaiver <= 0) break;
          const dueAmt = Number(due.amount_due);
          if (dueAmt <= remainingWaiver) {
            await tx.student_charge_dues.update({
              where: { student_charge_due_id: due.student_charge_due_id },
              data: { status: 'waived' },
            });
            remainingWaiver -= dueAmt;
          }
        }
      }
    });

    res.json({ success: true, message: `Waiver of ₹${amount} applied successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────
// REFUNDS — Process refund
// ──────────────────────────────────────
feesRouter.post('/refunds', checkPermission(PERMISSIONS.FEES_REFUND_PROCESS), async (req, res) => {
  try {
    const userId = req.context!.user.id;
    const schoolId = req.context!.user.school_id;
    const { student_id, application_id, transaction_id, amount, reason } = req.body;

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid refund amount' });

    // Mark original transaction as REFUNDED
    if (transaction_id) {
      await supabase
        .from('payment_transactions')
        .update({ status: 'REFUNDED' })
        .eq('id', transaction_id);
    }

    // Post REFUND debit to ledger (reverses the credit)
    await LedgerPostingService.postEntry({
      student_id: student_id || null,
      application_id: application_id || null,
      school_id: schoolId,
      transaction_type: 'REFUND',
      debit: Number(amount),
      credit: 0,
      reference_type: 'REFUND',
      reference_id: transaction_id || (supabase.rpc('uuid_generate_v4') as any),
      description: reason || 'Refund processed',
      performed_by: userId,
    });

    await supabase.from('finance_audit_logs').insert({
      action: 'REFUND_PROCESSED',
      entity_type: 'payment_transactions',
      entity_id: transaction_id,
      performed_by: userId,
      school_id: schoolId,
      details: { amount, reason },
    });

    res.json({ success: true, message: `Refund of ₹${amount} processed` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────
// RECEIPTS — List with filters
// ──────────────────────────────────────
feesRouter.get('/receipts', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      (req.context?.user as any)?.orgId ||
      req.context?.user?.school_id;

    const {
      from,
      to,
      receipt_type,
      payment_mode,
      search,
      limit = 100,
      offset = 0,
      page,
    } = req.query;

    const result = await PaymentCollectionService.listReceipts(tenantOrgId, {
      from: from as string | undefined,
      to: to as string | undefined,
      receipt_type: receipt_type as string | undefined,
      payment_mode: payment_mode as string | undefined,
      search: search as string | undefined,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : undefined,
      page: page ? Number(page) : undefined,
    });

    res.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    console.error('[GET /receipts error]:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// ──────────────────────────────────────
// DASHBOARD — KPIs
// ──────────────────────────────────────
feesRouter.get('/dashboard/kpis', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const schoolId = req.context!.user.school_id;
    const kpis = await ReportingService.dashboardKpis({ school_id: schoolId });
    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────
// DASHBOARD — Collection Trend (30 days)
// ──────────────────────────────────────
feesRouter.get(
  '/dashboard/collection-trend',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const schoolId = req.context!.user.school_id;
      const trend = await ReportingService.collectionTrend({ school_id: schoolId });
      res.json(trend);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────
// DASHBOARD — Payment Mode Distribution
// ──────────────────────────────────────
feesRouter.get(
  '/dashboard/payment-modes',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const schoolId = req.context!.user.school_id;
      const today = new Date();
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const result = await ReportingService.paymentModeReport({
        school_id: schoolId,
        from: monthStart,
        to: today.toISOString().split('T')[0],
      });
      res.json(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────
// DASHBOARD — Outstanding by Class
// ──────────────────────────────────────
feesRouter.get(
  '/dashboard/outstanding-by-class',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const schoolId = req.context!.user.school_id;
      const result = await ReportingService.classSummaryReport({ school_id: schoolId });
      res.json(result.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────
// 11. FINANCE REPORTS & FINANCIAL INTELLIGENCE (Phase 12)
// ──────────────────────────────────────
import { FinanceReportsService } from './services/FinanceReportsService';

// GET /reports/summary: High-level financial executive summary KPIs
feesRouter.get('/reports/summary', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { startDate, endDate, academicYearId, gradeId } = req.query;
    const summary = await FinanceReportsService.getSummary(tenantOrgId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      academicYearId: academicYearId as string | undefined,
      gradeId: gradeId as string | undefined,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/summary] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_SUMMARY_ERROR',
      message: error.message || 'Failed to fetch financial reports executive summary',
    });
  }
});

// GET /reports/collections: Granular collections report with trends & classification
feesRouter.get('/reports/collections', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { startDate, endDate, from, to, paymentMethod, status, search, limit, offset, page } =
      req.query;

    const resolvedStart = (startDate as string) || (from as string);
    const resolvedEnd = (endDate as string) || (to as string);
    const parsedLimit = limit ? Number(limit) : 20;
    const parsedOffset = offset ? Number(offset) : page ? (Number(page) - 1) * parsedLimit : 0;

    const result = await FinanceReportsService.getCollections(tenantOrgId, {
      startDate: resolvedStart,
      endDate: resolvedEnd,
      paymentMethod: paymentMethod as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    // Backwards-compatible fields included alongside canonical envelope
    res.json({
      success: true,
      data: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      trends: result.trends,
      from: resolvedStart,
      to: resolvedEnd,
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/collections] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_COLLECTIONS_ERROR',
      message: error.message || 'Failed to fetch collections report',
    });
  }
});

// GET /reports/receivables: Outstanding dues, overdue metrics, and student dues register
feesRouter.get('/reports/receivables', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { academicYearId, search, status, limit, offset, page } = req.query;
    const parsedLimit = limit ? Number(limit) : 20;
    const parsedOffset = offset ? Number(offset) : page ? (Number(page) - 1) * parsedLimit : 0;

    const result = await FinanceReportsService.getAgeing(tenantOrgId, {
      academicYearId: academicYearId as string | undefined,
      search: search as string | undefined,
      status: status as string | undefined,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.json({
      success: true,
      data: result.detail.data,
      total: result.detail.total,
      summary: {
        total_outstanding: result.total_outstanding,
        total_overdue: result.total_overdue,
      },
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/receivables] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_RECEIVABLES_ERROR',
      message: error.message || 'Failed to fetch receivables report',
    });
  }
});

// GET /reports/outstanding: Backward-compatible alias for receivables
feesRouter.get('/reports/outstanding', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const result = await FinanceReportsService.getAgeing(tenantOrgId, { limit: 100 });
    res.json({
      success: true,
      data: result.detail.data,
      total: result.total_outstanding,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /reports/ageing: Ageing analysis by buckets (CURRENT, 1-7, 8-30, 31-60, 61-90, 90+)
feesRouter.get('/reports/ageing', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { academicYearId, ageingBucket, search, limit, offset, page } = req.query;
    const parsedLimit = limit ? Number(limit) : 20;
    const parsedOffset = offset ? Number(offset) : page ? (Number(page) - 1) * parsedLimit : 0;

    const result = await FinanceReportsService.getAgeing(tenantOrgId, {
      academicYearId: academicYearId as string | undefined,
      ageingBucket: ageingBucket as string | undefined,
      search: search as string | undefined,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/ageing] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_AGEING_ERROR',
      message: error.message || 'Failed to fetch ageing analysis report',
    });
  }
});

// GET /reports/aging: Backward-compatible alias
feesRouter.get('/reports/aging', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const result = await FinanceReportsService.getAgeing(tenantOrgId, { limit: 100 });
    res.json({
      success: true,
      data: result.detail.data,
      buckets: result.buckets,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /reports/assessments: Component-level fee assessment and billing performance
feesRouter.get('/reports/assessments', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { academicYearId, startDate, endDate } = req.query;
    const result = await FinanceReportsService.getAssessments(tenantOrgId, {
      academicYearId: academicYearId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/assessments] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_ASSESSMENTS_ERROR',
      message: error.message || 'Failed to fetch fee assessments report',
    });
  }
});

// GET /reports/concessions: Scholarships and concessions distribution
feesRouter.get('/reports/concessions', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { academicYearId, startDate, endDate } = req.query;
    const result = await FinanceReportsService.getConcessions(tenantOrgId, {
      academicYearId: academicYearId as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/concessions] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_CONCESSIONS_ERROR',
      message: error.message || 'Failed to fetch concessions report',
    });
  }
});

// GET /reports/settlements: Gateway collections and bank settlement status
feesRouter.get('/reports/settlements', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { limit, offset, page } = req.query;
    const parsedLimit = limit ? Number(limit) : 20;
    const parsedOffset = offset ? Number(offset) : page ? (Number(page) - 1) * parsedLimit : 0;

    const result = await FinanceReportsService.getSettlements(tenantOrgId, {
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[GET /fees/reports/settlements] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'REPORTS_SETTLEMENTS_ERROR',
      message: error.message || 'Failed to fetch settlements report',
    });
  }
});

// GET /reports/reconciliation: Reusable Phase 10 reconciliation intelligence
feesRouter.get(
  '/reports/reconciliation',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { page, limit } = req.query;
      const result = await FinanceReportsService.getReconciliation(tenantOrgId, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[GET /fees/reports/reconciliation] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'REPORTS_RECONCILIATION_ERROR',
        message: error.message || 'Failed to fetch reconciliation report',
      });
    }
  },
);

// GET /reports/accounting-readiness: Reusable Phase 11 operational accounting readiness
feesRouter.get(
  '/reports/accounting-readiness',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { startDate, endDate } = req.query;
      const result = await FinanceReportsService.getAccountingReadiness(tenantOrgId, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('[GET /fees/reports/accounting-readiness] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'REPORTS_ACCOUNTING_READINESS_ERROR',
        message: error.message || 'Failed to fetch accounting readiness report',
      });
    }
  },
);

// GET /reports/export: Sanitized CSV export center with formula injection protection
feesRouter.get('/reports/export', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const {
      reportType,
      startDate,
      endDate,
      paymentMethod,
      status,
      search,
      ageingBucket,
      academicYearId,
    } = req.query;

    const csvData = await FinanceReportsService.exportReportCSV(tenantOrgId, reportType as string, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      paymentMethod: paymentMethod as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
      ageingBucket: ageingBucket as string | undefined,
      academicYearId: academicYearId as string | undefined,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const safeType = ((reportType as string) || 'financial_report')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance_${safeType}_${timestamp}.csv"`,
    );
    res.status(200).send(csvData);
  } catch (error: any) {
    console.error('[GET /fees/reports/export] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'CSV_EXPORT_ERROR',
      message: error.message || 'Failed to export financial report CSV',
    });
  }
});

// ──────────────────────────────────────
// 12. FINANCE BUDGETING, FORECASTING & PLANNING (Phase 13)
// ──────────────────────────────────────
import { FinancePlanningService } from './services/FinancePlanningService';

// GET /planning/capabilities: Capabilities and schema limitation audit
feesRouter.get(
  '/planning/capabilities',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const capabilities = await FinancePlanningService.getCapabilities(tenantOrgId);
      res.json({
        success: true,
        data: capabilities,
      });
    } catch (error: any) {
      console.error('[GET /fees/planning/capabilities] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'PLANNING_CAPABILITIES_ERROR',
        message: error.message || 'Failed to fetch planning capabilities',
      });
    }
  },
);

// GET /planning/overview: Executive Planning Overview & Baseline Projections
feesRouter.get('/planning/overview', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { horizonMonths, startDate, realizationRate } = req.query;
    const overview = await FinancePlanningService.getOverview(tenantOrgId, {
      horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
      startDate: startDate as string | undefined,
      realizationRate: realizationRate ? Number(realizationRate) : undefined,
    });

    res.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error('[GET /fees/planning/overview] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'PLANNING_OVERVIEW_ERROR',
      message: error.message || 'Failed to fetch planning overview',
    });
  }
});

// GET /planning/collections-forecast: Monthly collections projection from scheduled dues
feesRouter.get(
  '/planning/collections-forecast',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { horizonMonths, startDate, realizationRate, monthlyAdjustment } = req.query;
      const forecast = await FinancePlanningService.getCollectionsForecast(tenantOrgId, {
        horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
        startDate: startDate as string | undefined,
        realizationRate: realizationRate ? Number(realizationRate) : undefined,
        monthlyAdjustment: monthlyAdjustment ? Number(monthlyAdjustment) : undefined,
      });

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error: any) {
      console.error('[GET /fees/planning/collections-forecast] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'COLLECTIONS_FORECAST_ERROR',
        message: error.message || 'Failed to generate collections forecast',
      });
    }
  },
);

// GET /planning/receivables-forecast: Receivables recovery and remaining balance projection
feesRouter.get(
  '/planning/receivables-forecast',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { horizonMonths, startDate, realizationRate } = req.query;
      const forecast = await FinancePlanningService.getReceivablesForecast(tenantOrgId, {
        horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
        startDate: startDate as string | undefined,
        realizationRate: realizationRate ? Number(realizationRate) : undefined,
      });

      res.json({
        success: true,
        data: forecast,
      });
    } catch (error: any) {
      console.error('[GET /fees/planning/receivables-forecast] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'RECEIVABLES_FORECAST_ERROR',
        message: error.message || 'Failed to generate receivables forecast',
      });
    }
  },
);

// POST /planning/scenario: On-demand simulation of Conservative, Expected, Optimistic scenarios
feesRouter.post('/planning/scenario', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const {
      horizonMonths,
      startDate,
      conservativeRate,
      expectedRate,
      optimisticRate,
      monthlyAdjustment,
    } = req.body || {};
    const scenarios = await FinancePlanningService.calculateScenarios(tenantOrgId, {
      horizonMonths: horizonMonths !== undefined ? Number(horizonMonths) : undefined,
      startDate: startDate as string | undefined,
      conservativeRate: conservativeRate !== undefined ? Number(conservativeRate) : undefined,
      expectedRate: expectedRate !== undefined ? Number(expectedRate) : undefined,
      optimisticRate: optimisticRate !== undefined ? Number(optimisticRate) : undefined,
      monthlyAdjustment: monthlyAdjustment !== undefined ? Number(monthlyAdjustment) : undefined,
    });

    res.json({
      success: true,
      data: scenarios,
    });
  } catch (error: any) {
    console.error('[POST /fees/planning/scenario] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'SCENARIO_CALCULATION_ERROR',
      message: error.message || 'Failed to calculate planning scenarios',
    });
  }
});

// GET /planning/academic-year-outlook: Outlook and realization by academic year
feesRouter.get(
  '/planning/academic-year-outlook',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { realizationRate } = req.query;
      const outlook = await FinancePlanningService.getAcademicYearOutlook(tenantOrgId, {
        realizationRate: realizationRate ? Number(realizationRate) : undefined,
      });

      res.json({
        success: true,
        data: outlook,
      });
    } catch (error: any) {
      console.error('[GET /fees/planning/academic-year-outlook] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'ACADEMIC_YEAR_OUTLOOK_ERROR',
        message: error.message || 'Failed to fetch academic year outlook',
      });
    }
  },
);

// POST /planning/concession-sensitivity: Analytical sensitivity simulation of hypothetical concession shifts
feesRouter.post(
  '/planning/concession-sensitivity',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { hypotheticalDeltaPct, realizationRatePct } = req.body || {};
      const sensitivity = await FinancePlanningService.calculateConcessionSensitivity(tenantOrgId, {
        hypotheticalDeltaPct:
          hypotheticalDeltaPct !== undefined ? Number(hypotheticalDeltaPct) : undefined,
        realizationRatePct:
          realizationRatePct !== undefined ? Number(realizationRatePct) : undefined,
      });

      res.json({
        success: true,
        data: sensitivity,
      });
    } catch (error: any) {
      console.error('[POST /fees/planning/concession-sensitivity] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'CONCESSION_SENSITIVITY_ERROR',
        message: error.message || 'Failed to calculate concession sensitivity',
      });
    }
  },
);

// GET /planning/data-quality: Density, data checks, and schema limitation audit
feesRouter.get(
  '/planning/data-quality',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const dataQuality = await FinancePlanningService.getDataQuality(tenantOrgId);
      res.json({
        success: true,
        data: dataQuality,
      });
    } catch (error: any) {
      console.error('[GET /fees/planning/data-quality] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'PLANNING_DATA_QUALITY_ERROR',
        message: error.message || 'Failed to fetch planning data quality metrics',
      });
    }
  },
);

// GET /planning/export: Formula-sanitized CSV export for planning and scenarios
feesRouter.get('/planning/export', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const {
      exportType,
      horizonMonths,
      startDate,
      realizationRate,
      conservativeRate,
      expectedRate,
      optimisticRate,
    } = req.query;
    const validExportType =
      (exportType as string) === 'scenario_planner'
        ? 'scenario_planner'
        : (exportType as string) === 'academic_year_outlook'
          ? 'academic_year_outlook'
          : 'collections_forecast';

    const csvData = await FinancePlanningService.exportPlanningCSV(tenantOrgId, validExportType, {
      horizonMonths: horizonMonths ? Number(horizonMonths) : undefined,
      startDate: startDate as string | undefined,
      realizationRate: realizationRate ? Number(realizationRate) : undefined,
      conservativeRate: conservativeRate ? Number(conservativeRate) : undefined,
      expectedRate: expectedRate ? Number(expectedRate) : undefined,
      optimisticRate: optimisticRate ? Number(optimisticRate) : undefined,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance_planning_${validExportType}_${timestamp}.csv"`,
    );
    res.status(200).send(csvData);
  } catch (error: any) {
    console.error('[GET /fees/planning/export] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'PLANNING_EXPORT_ERROR',
      message: error.message || 'Failed to export planning CSV',
    });
  }
});

// ──────────────────────────────────────
// 13. FINANCE AUDIT, GOVERNANCE & COMPLIANCE (Phase 14)
// ──────────────────────────────────────
import { FinanceAuditService } from './services/FinanceAuditService';

// GET /audit/capabilities: Audit capabilities and schema limitation audit
feesRouter.get('/audit/capabilities', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const capabilities = await FinanceAuditService.getCapabilities(tenantOrgId);
    res.json({
      success: true,
      data: capabilities,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/capabilities] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'AUDIT_CAPABILITIES_ERROR',
      message: error.message || 'Failed to fetch audit capabilities',
    });
  }
});

// GET /audit/summary: Executive Audit KPI Overview
feesRouter.get('/audit/summary', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const summary = await FinanceAuditService.getSummary(tenantOrgId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/summary] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'AUDIT_SUMMARY_ERROR',
      message: error.message || 'Failed to fetch audit summary',
    });
  }
});

// GET /audit/payments: Payment Transaction Audit Register
feesRouter.get('/audit/payments', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { page, limit, startDate, endDate, status, search } = req.query;
    const payments = await FinanceAuditService.getPayments(tenantOrgId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/payments] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'PAYMENT_AUDIT_ERROR',
      message: error.message || 'Failed to fetch payment audit register',
    });
  }
});

// GET /audit/settlements: Gateway Settlement & Deduction Audit
feesRouter.get('/audit/settlements', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { page, limit, status, search } = req.query;
    const settlements = await FinanceAuditService.getSettlements(tenantOrgId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: settlements,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/settlements] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'SETTLEMENT_AUDIT_ERROR',
      message: error.message || 'Failed to fetch settlement audit register',
    });
  }
});

// GET /audit/concessions: Scholarship & Concession Governance Audit
feesRouter.get('/audit/concessions', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { page, limit, status, search } = req.query;
    const concessions = await FinanceAuditService.getConcessions(tenantOrgId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: concessions,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/concessions] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'CONCESSION_AUDIT_ERROR',
      message: error.message || 'Failed to fetch concession audit register',
    });
  }
});

// GET /audit/webhooks: Webhook Lifecycle & Dead-Letter Audit
feesRouter.get('/audit/webhooks', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { page, limit, status, search } = req.query;
    const webhooks = await FinanceAuditService.getWebhooks(tenantOrgId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/webhooks] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'WEBHOOK_AUDIT_ERROR',
      message: error.message || 'Failed to fetch webhook audit register',
    });
  }
});

// GET /audit/accounting-readiness: Accounting Readiness & Control Audit
feesRouter.get(
  '/audit/accounting-readiness',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const readiness = await FinanceAuditService.getAccountingReadinessAudit(tenantOrgId);
      res.json({
        success: true,
        data: readiness,
      });
    } catch (error: any) {
      console.error('[GET /fees/audit/accounting-readiness] Error:', error);
      res.status(500).json({
        success: false,
        error: error.code || 'ACCOUNTING_READINESS_AUDIT_ERROR',
        message: error.message || 'Failed to fetch accounting readiness audit',
      });
    }
  },
);

// GET /audit/coverage: Control Evaluation Matrix & Limitations
feesRouter.get('/audit/coverage', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const coverage = await FinanceAuditService.getCoverage(tenantOrgId);
    res.json({
      success: true,
      data: coverage,
    });
  } catch (error: any) {
    console.error('[GET /fees/audit/coverage] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'AUDIT_COVERAGE_ERROR',
      message: error.message || 'Failed to fetch audit control coverage',
    });
  }
});

// GET /audit/export: Formula-sanitized CSV export for audit registers
feesRouter.get('/audit/export', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { exportType, startDate, endDate, status, search } = req.query;
    const validExportType =
      (exportType as string) === 'settlements'
        ? 'settlements'
        : (exportType as string) === 'concessions'
          ? 'concessions'
          : (exportType as string) === 'webhooks'
            ? 'webhooks'
            : (exportType as string) === 'controls'
              ? 'controls'
              : 'payments';

    const csvData = await FinanceAuditService.exportAuditCSV(tenantOrgId, validExportType, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance_audit_${validExportType}_${timestamp}.csv"`,
    );
    res.status(200).send(csvData);
  } catch (error: any) {
    console.error('[GET /fees/audit/export] Error:', error);
    res.status(500).json({
      success: false,
      error: error.code || 'AUDIT_EXPORT_ERROR',
      message: error.message || 'Failed to export audit CSV',
    });
  }
});

// ──────────────────────────────────────
// 14. FINANCE OPERATIONS & EXECUTIVE INSIGHTS (Phase 15)
// ──────────────────────────────────────
import { FinanceOperationsService } from './services/FinanceOperationsService';

// GET /operations/capabilities: Capabilities & compliance disclosures
feesRouter.get(
  '/operations/capabilities',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const capabilities = await FinanceOperationsService.getCapabilities(tenantOrgId);
      res.json({
        success: true,
        data: capabilities,
      });
    } catch (error: any) {
      console.error('[GET /fees/operations/capabilities] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'OPERATIONS_CAPABILITIES_ERROR',
        message: error.message || 'Failed to fetch operations capabilities',
      });
    }
  },
);

// GET /operations/overview: Executive Finance Overview (Module A)
feesRouter.get('/operations/overview', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { startDate, endDate, academicYearId } = req.query;
    const overview = await FinanceOperationsService.getOverview(tenantOrgId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      academicYearId: academicYearId as string | undefined,
    });

    res.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error('[GET /fees/operations/overview] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'OPERATIONS_OVERVIEW_ERROR',
      message: error.message || 'Failed to fetch executive overview',
    });
  }
});

// GET /operations/collections: Collections Performance Analysis (Module B)
feesRouter.get(
  '/operations/collections',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { startDate, endDate, academicYearId, paymentMethod } = req.query;
      const collections = await FinanceOperationsService.getCollections(tenantOrgId, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        academicYearId: academicYearId as string | undefined,
        paymentMethod: paymentMethod as string | undefined,
      });

      res.json({
        success: true,
        data: collections,
      });
    } catch (error: any) {
      console.error('[GET /fees/operations/collections] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'OPERATIONS_COLLECTIONS_ERROR',
        message: error.message || 'Failed to fetch collections performance',
      });
    }
  },
);

// GET /operations/receivables: Receivables and Ageing Insights (Module C)
feesRouter.get(
  '/operations/receivables',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId, gradeId } = req.query;
      const receivables = await FinanceOperationsService.getReceivables(tenantOrgId, {
        academicYearId: academicYearId as string | undefined,
        gradeId: gradeId as string | undefined,
      });

      res.json({
        success: true,
        data: receivables,
      });
    } catch (error: any) {
      console.error('[GET /fees/operations/receivables] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'OPERATIONS_RECEIVABLES_ERROR',
        message: error.message || 'Failed to fetch receivables and ageing',
      });
    }
  },
);

// GET /operations/exceptions: Exception Action Center (Module D)
feesRouter.get(
  '/operations/exceptions',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { category, severity, page, limit } = req.query;
      const exceptions = await FinanceOperationsService.getExceptions(tenantOrgId, {
        category: category as string | undefined,
        severity: severity as string | undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 25,
      });

      res.json({
        success: true,
        data: exceptions,
      });
    } catch (error: any) {
      console.error('[GET /fees/operations/exceptions] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'OPERATIONS_EXCEPTIONS_ERROR',
        message: error.message || 'Failed to fetch exception queue',
      });
    }
  },
);

// GET /operations/data-quality: Finance Data Quality and Readiness (Module E)
feesRouter.get(
  '/operations/data-quality',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const dataQuality = await FinanceOperationsService.getDataQuality(tenantOrgId);
      res.json({
        success: true,
        data: dataQuality,
      });
    } catch (error: any) {
      console.error('[GET /fees/operations/data-quality] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'OPERATIONS_DATA_QUALITY_ERROR',
        message: error.message || 'Failed to fetch data quality report',
      });
    }
  },
);

// GET /operations/export: Executive Export (Module F)
feesRouter.get('/operations/export', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { type, startDate, endDate, academicYearId, paymentMethod, category, severity } =
      req.query;
    const validExportType =
      (type as string) === 'collections'
        ? 'collections'
        : (type as string) === 'receivables'
          ? 'receivables'
          : (type as string) === 'exceptions'
            ? 'exceptions'
            : 'overview';

    const csvData = await FinanceOperationsService.exportCSV(tenantOrgId, validExportType, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      academicYearId: academicYearId as string | undefined,
      paymentMethod: paymentMethod as string | undefined,
      category: category as string | undefined,
      severity: severity as string | undefined,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance_operations_${validExportType}_${timestamp}.csv"`,
    );
    res.status(200).send(csvData);
  } catch (error: any) {
    console.error('[GET /fees/operations/export] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'OPERATIONS_EXPORT_ERROR',
      message: error.message || 'Failed to export operations CSV',
    });
  }
});

// Legacy fallback endpoints for existing frontends
feesRouter.get(
  '/reports/cash-closing',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const schoolId =
        req.context?.user?.school_id || (req as any).tenantOrgId || req.context?.user?.org_id;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const result = await ReportingService.cashClosingReport({ school_id: schoolId, date });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

feesRouter.get(
  '/reports/payment-mode',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const schoolId =
        req.context?.user?.school_id || (req as any).tenantOrgId || req.context?.user?.org_id;
      const today = new Date().toISOString().split('T')[0];
      const monthStart = `${today.substring(0, 7)}-01`;
      const { from = monthStart, to = today } = req.query;
      const result = await ReportingService.paymentModeReport({
        school_id: schoolId,
        from: from as string,
        to: to as string,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

feesRouter.get(
  '/reports/class-summary',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const schoolId =
        req.context?.user?.school_id || (req as any).tenantOrgId || req.context?.user?.org_id;
      const result = await ReportingService.classSummaryReport({ school_id: schoolId });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ──────────────────────────────────────
// FINANCE CONFIGURATION — PHASE 2
// ──────────────────────────────────────

// GET /configuration: Read full finance configuration
feesRouter.get('/configuration', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const configuration = await SettingsService.getConfiguration(tenantOrgId);
    res.json({
      success: true,
      data: configuration,
    });
  } catch (error: any) {
    console.error('[feesRouter.GET /configuration] Error:', error);
    res.status(500).json({
      success: false,
      error: 'CONFIGURATION_READ_ERROR',
      message: error.message || 'Failed to load finance configuration',
    });
  }
});

// PATCH /configuration: Update allowlisted finance configuration
feesRouter.patch('/configuration', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    const userId = req.context?.user?.id || 'system';

    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_PAYLOAD',
        message: 'Update payload must contain at least one editable configuration property.',
      });
    }

    const updatedConfiguration = await SettingsService.updateConfiguration(
      tenantOrgId,
      userId,
      req.body,
    );

    res.json({
      success: true,
      message: 'Finance configuration updated successfully.',
      data: updatedConfiguration,
    });
  } catch (error: any) {
    console.error('[feesRouter.PATCH /configuration] Error:', error);
    const isValidationError =
      error.message?.includes('immutable') ||
      error.message?.includes('Phone') ||
      error.message?.includes('email') ||
      error.message?.includes('window');

    res.status(isValidationError ? 422 : 500).json({
      success: false,
      error: isValidationError ? 'VALIDATION_ERROR' : 'CONFIGURATION_UPDATE_ERROR',
      message: error.message || 'Failed to update finance configuration',
    });
  }
});

// GET /configuration/razorpay/status: Check sanitized gateway configuration status
feesRouter.get(
  '/configuration/razorpay/status',
  checkPermission(PERMISSIONS.FEES_VIEW),
  (req, res) => {
    try {
      const gatewayStatus = SettingsService.getRazorpayStatus();
      res.json({
        success: true,
        data: gatewayStatus,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'GATEWAY_STATUS_ERROR',
        message: error.message || 'Failed to inspect payment gateway status',
      });
    }
  },
);

// POST /configuration/razorpay/test: Safe non-transactional credential probe
feesRouter.post(
  '/configuration/razorpay/test',
  checkPermission(PERMISSIONS.FEES_SETUP),
  async (req, res) => {
    try {
      const result = await SettingsService.testRazorpayConnection();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        status: 'FAILED',
        message: error.message || 'Gateway connectivity test failed',
        timestamp: new Date().toISOString(),
      });
    }
  },
);

// GET /configuration/audit: View recent configuration audit events
feesRouter.get('/configuration/audit', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    let auditEntries: any[] = [];
    try {
      const { data } = await supabase
        .from('finance_audit_logs')
        .select('*')
        .eq('entity_id', tenantOrgId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) auditEntries = data;
    } catch {
      // Table might not exist; fallback to empty audit list
    }

    res.json({
      success: true,
      data: auditEntries,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ──────────────────────────────────────
// SETTINGS — GET and PUT (LEGACY PHASE 1 COMPATIBILITY)
// ──────────────────────────────────────

feesRouter.get('/settings', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const schoolId =
      (req as any).tenantOrgId || req.context?.user?.school_id || req.context?.user?.org_id;
    const settings = await SettingsService.getSettings(schoolId);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

feesRouter.put('/settings', checkPermission(PERMISSIONS.FEES_SETUP), async (req, res) => {
  try {
    const schoolId =
      (req as any).tenantOrgId || req.context?.user?.school_id || req.context?.user?.org_id;
    const userId = req.context!.user.id;
    const settings = await SettingsService.upsertSettings(schoolId, {
      ...req.body,
      updated_by: userId,
    });
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ======================================
// 6. SCHOLARSHIPS & CONCESSIONS (Phase 7)
// ======================================
import { ScholarshipConcessionService } from './services/ScholarshipConcessionService';

// GET /scholarships/metrics: Live dashboard metrics
feesRouter.get(
  '/scholarships/metrics',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId } = req.query;
      const metrics = await ScholarshipConcessionService.getMetrics(
        tenantOrgId,
        academicYearId as string | undefined,
      );

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      console.error('[GET /fees/scholarships/metrics] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'SCHOLARSHIP_METRICS_ERROR',
        message: error.message || 'Failed to fetch scholarship metrics',
      });
    }
  },
);

// GET /scholarships/programs: Available institutional scholarship programs
feesRouter.get(
  '/scholarships/programs',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const programs = await ScholarshipConcessionService.getPrograms(tenantOrgId);

      res.json({
        success: true,
        data: programs,
      });
    } catch (error: any) {
      console.error('[GET /fees/scholarships/programs] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'PROGRAMS_FETCH_ERROR',
        message: error.message || 'Failed to fetch scholarship programs',
      });
    }
  },
);

// GET /scholarships/students: Search eligible students within tenant
feesRouter.get(
  '/scholarships/students',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { query, academicYearId, page, limit } = req.query;
      const students = await ScholarshipConcessionService.searchEligibleStudents(
        tenantOrgId,
        query as string | undefined,
        academicYearId as string | undefined,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20,
      );

      res.json({
        success: true,
        data: students,
      });
    } catch (error: any) {
      console.error('[GET /fees/scholarships/students] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'STUDENT_SEARCH_ERROR',
        message: error.message || 'Failed to search eligible students',
      });
    }
  },
);

// GET /scholarships/applications: Filterable, paginated register
feesRouter.get(
  '/scholarships/applications',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { status, scholarshipType, academicYearId, studentId, search, page, limit } = req.query;
      const result = await ScholarshipConcessionService.listApplications(tenantOrgId, {
        status: status as string | undefined,
        scholarshipType: scholarshipType as string | undefined,
        academicYearId: academicYearId as string | undefined,
        studentId: studentId as string | undefined,
        search: search as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.json({
        success: true,
        data: result.concessions,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error('[GET /fees/scholarships/applications] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'APPLICATIONS_FETCH_ERROR',
        message: error.message || 'Failed to fetch scholarship applications',
      });
    }
  },
);

// POST /scholarships/applications: Recommend / apply for a student
feesRouter.post(
  '/scholarships/applications',
  checkPermission(PERMISSIONS.FEES_WAIVER_APPROVE),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId =
        req.context?.user?.id ||
        (req.context?.user as any)?.user_id ||
        '00000000-0000-0000-0000-000000000000';
      const concession = await ScholarshipConcessionService.recommendConcession(
        tenantOrgId,
        userId,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: 'Scholarship recommendation submitted successfully',
        data: concession,
      });
    } catch (error: any) {
      console.error('[POST /fees/scholarships/applications] Error:', error);
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.code || 'CONCESSION_RECOMMEND_ERROR',
        message: error.message || 'Failed to submit scholarship recommendation',
      });
    }
  },
);

// GET /scholarships/applications/:id: Detail + full approval audit history
feesRouter.get(
  '/scholarships/applications/:id',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { id } = req.params;
      const result = await ScholarshipConcessionService.getApplicationById(tenantOrgId, id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error(`[GET /fees/scholarships/applications/${req.params.id}] Error:`, error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'APPLICATION_FETCH_ERROR',
        message: error.message || 'Failed to fetch scholarship application details',
      });
    }
  },
);

// POST /scholarships/applications/:id/decision: Approve or reject
feesRouter.post(
  '/scholarships/applications/:id/decision',
  checkPermission(PERMISSIONS.FEES_WAIVER_APPROVE),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId =
        req.context?.user?.id ||
        (req.context?.user as any)?.user_id ||
        '00000000-0000-0000-0000-000000000000';
      const { id } = req.params;
      const result = await ScholarshipConcessionService.reviewConcession(
        tenantOrgId,
        userId,
        id,
        req.body,
      );

      res.json({
        success: true,
        message: `Scholarship application ${req.body.action === 'approved' ? 'approved' : 'rejected'} successfully`,
        data: result,
      });
    } catch (error: any) {
      console.error(
        `[POST /fees/scholarships/applications/${req.params.id}/decision] Error:`,
        error,
      );
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.code || 'REVIEW_DECISION_ERROR',
        message: error.message || 'Failed to process scholarship decision',
      });
    }
  },
);

// POST /scholarships/applications/:id/apply: Apply approved concession to ledger dues
feesRouter.post(
  '/scholarships/applications/:id/apply',
  checkPermission(PERMISSIONS.FEES_WAIVER_APPROVE),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const userId =
        req.context?.user?.id ||
        (req.context?.user as any)?.user_id ||
        '00000000-0000-0000-0000-000000000000';
      const { id } = req.params;
      const result = await ScholarshipConcessionService.applyConcession(tenantOrgId, userId, id);

      res.json({
        success: true,
        message: 'Concession applied to student fee obligations successfully',
        data: result,
      });
    } catch (error: any) {
      console.error(`[POST /fees/scholarships/applications/${req.params.id}/apply] Error:`, error);
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.code || 'APPLY_CONCESSION_ERROR',
        message: error.message || 'Failed to apply concession to student dues',
      });
    }
  },
);

// GET /scholarships/student/:studentId: Student specific awards
feesRouter.get(
  '/scholarships/student/:studentId',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const result = await ScholarshipConcessionService.getStudentConcessions(
        tenantOrgId,
        studentId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error(`[GET /fees/scholarships/student/${req.params.studentId}] Error:`, error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'STUDENT_AWARDS_ERROR',
        message: error.message || 'Failed to fetch student scholarship awards',
      });
    }
  },
);

// GET /scholarships/reports: Aggregated reports
feesRouter.get(
  '/scholarships/reports',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { academicYearId } = req.query;
      const reports = await ScholarshipConcessionService.getReports(
        tenantOrgId,
        academicYearId as string | undefined,
      );

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      console.error('[GET /fees/scholarships/reports] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'REPORTS_FETCH_ERROR',
        message: error.message || 'Failed to fetch scholarship reports',
      });
    }
  },
);

// ======================================
// 10. RECEIVABLES & COLLECTIONS (Phase 8)
// ======================================
import { ReceivablesService } from './services/ReceivablesService';

// GET /receivables/summary: Receivables & Collections Overview KPIs
feesRouter.get('/receivables/summary', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { academicYearId } = req.query;
    const summary = await ReceivablesService.getSummary(
      tenantOrgId,
      academicYearId as string | undefined,
    );

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[GET /fees/receivables/summary] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'RECEIVABLES_SUMMARY_ERROR',
      message: error.message || 'Failed to fetch receivables summary',
    });
  }
});

// GET /receivables/register: Searchable, filterable, paginated student fee obligations
feesRouter.get(
  '/receivables/register',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const {
        academicYearId,
        gradeId,
        sectionId,
        feeComponentId,
        installmentTermId,
        status,
        ageingBucket,
        dueDateFrom,
        dueDateTo,
        minOutstanding,
        maxOutstanding,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const register = await ReceivablesService.getRegister(tenantOrgId, {
        academicYearId: academicYearId as string,
        gradeId: gradeId as string,
        sectionId: sectionId as string,
        feeComponentId: feeComponentId as string,
        installmentTermId: installmentTermId as string,
        status: status as string,
        ageingBucket: ageingBucket as string,
        dueDateFrom: dueDateFrom as string,
        dueDateTo: dueDateTo as string,
        minOutstanding: minOutstanding ? Number(minOutstanding) : undefined,
        maxOutstanding: maxOutstanding ? Number(maxOutstanding) : undefined,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        data: register,
      });
    } catch (error: any) {
      console.error('[GET /fees/receivables/register] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'RECEIVABLES_REGISTER_ERROR',
        message: error.message || 'Failed to fetch receivables register',
      });
    }
  },
);

// GET /receivables/ageing: Overdue ageing analysis by buckets
feesRouter.get('/receivables/ageing', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { academicYearId } = req.query;
    const ageing = await ReceivablesService.getAgeing(
      tenantOrgId,
      academicYearId as string | undefined,
    );

    res.json({
      success: true,
      data: ageing,
    });
  } catch (error: any) {
    console.error('[GET /fees/receivables/ageing] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'RECEIVABLES_AGEING_ERROR',
      message: error.message || 'Failed to fetch ageing analysis',
    });
  }
});

// GET /receivables/collections: Confirmed collections performance and trends
feesRouter.get(
  '/receivables/collections',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { period, startDate, endDate, academicYearId, gradeId } = req.query;
      const collections = await ReceivablesService.getCollections(tenantOrgId, {
        period: period as any,
        startDate: startDate as string,
        endDate: endDate as string,
        academicYearId: academicYearId as string,
        gradeId: gradeId as string,
      });

      res.json({
        success: true,
        data: collections,
      });
    } catch (error: any) {
      console.error('[GET /fees/receivables/collections] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'RECEIVABLES_COLLECTIONS_ERROR',
        message: error.message || 'Failed to fetch collections performance',
      });
    }
  },
);

// GET /receivables/students/:studentId: Detailed receivables for single student
feesRouter.get(
  '/receivables/students/:studentId',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { studentId } = req.params;
      const detail = await ReceivablesService.getStudentDetail(tenantOrgId, studentId);

      res.json({
        success: true,
        data: detail,
      });
    } catch (error: any) {
      console.error(`[GET /fees/receivables/students/${req.params.studentId}] Error:`, error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'STUDENT_RECEIVABLES_ERROR',
        message: error.message || 'Failed to fetch student receivables detail',
      });
    }
  },
);

// GET /receivables/follow-ups: Prioritized collections follow-up work queue
feesRouter.get(
  '/receivables/follow-ups',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { grouping, academicYearId, gradeId, search, page, limit, sortBy, sortOrder } =
        req.query;
      const queue = await ReceivablesService.getFollowUpQueue(tenantOrgId, {
        grouping: grouping as any,
        academicYearId: academicYearId as string,
        gradeId: gradeId as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        data: queue,
      });
    } catch (error: any) {
      console.error('[GET /fees/receivables/follow-ups] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'FOLLOW_UP_QUEUE_ERROR',
        message: error.message || 'Failed to fetch follow-up queue',
      });
    }
  },
);

// POST /receivables/follow-ups: Record follow-up mutation (Schema freeze disclosure)
feesRouter.post(
  '/receivables/follow-ups',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId =
        req.context?.user?.id ||
        (req.context?.user as any)?.user_id ||
        '00000000-0000-0000-0000-000000000000';

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      await ReceivablesService.recordFollowUp(tenantOrgId, userId, req.body);
    } catch (error: any) {
      const status = error.statusCode || 501;
      res.status(status).json({
        success: false,
        error: error.code || 'FEATURE_BLOCKED_SCHEMA_FREEZE',
        message: error.message || 'Follow-up recording is blocked by database schema freeze',
      });
    }
  },
);

// PATCH /receivables/follow-ups/:id: Update follow-up status (Schema freeze disclosure)
feesRouter.patch(
  '/receivables/follow-ups/:id',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    res.status(501).json({
      success: false,
      error: 'FEATURE_BLOCKED_SCHEMA_FREEZE',
      message:
        'Follow-up updating is blocked by database schema freeze (table `fee_collections_follow_ups` is unmapped).',
    });
  },
);

// GET /receivables/reports: Exportable structured reports
feesRouter.get('/receivables/reports', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { reportType, academicYearId } = req.query;
    const type = (reportType as any) || 'outstanding_by_grade';
    const report = await ReceivablesService.getReports(tenantOrgId, type, { academicYearId });

    res.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error('[GET /fees/receivables/reports] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'RECEIVABLES_REPORTS_ERROR',
      message: error.message || 'Failed to fetch receivables reports',
    });
  }
});

// ======================================
// 11. FINANCE NOTIFICATIONS & COMMUNICATION (Phase 9)
// ======================================
import { FinanceNotificationService } from './services/FinanceNotificationService';

// GET /notifications/summary: Notification KPI summary
feesRouter.get(
  '/notifications/summary',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const summary = await FinanceNotificationService.getSummary(tenantOrgId);
      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('[GET /fees/notifications/summary] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'NOTIFICATION_SUMMARY_ERROR',
        message: error.message || 'Failed to fetch notification summary',
      });
    }
  },
);

// GET /notifications: List finance notifications with filters and pagination
feesRouter.get('/notifications', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { type, channel, isRead, status, search, fromDate, toDate, page, limit } = req.query;
    const result = await FinanceNotificationService.getNotifications(tenantOrgId, {
      type: type as string,
      channel: channel as string,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      status: status as string,
      search: search as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[GET /fees/notifications] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'NOTIFICATIONS_LIST_ERROR',
      message: error.message || 'Failed to fetch notifications list',
    });
  }
});

// GET /notifications/templates: List available Finance message templates
feesRouter.get(
  '/notifications/templates',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const templates = FinanceNotificationService.getTemplates();
      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error('[GET /fees/notifications/templates] Error:', error);
      res.status(500).json({
        success: false,
        error: 'TEMPLATES_FETCH_ERROR',
        message: error.message || 'Failed to fetch templates',
      });
    }
  },
);

// GET /notifications/channels: List notification channel health and configuration status
feesRouter.get(
  '/notifications/channels',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const channels = FinanceNotificationService.getChannelHealth(tenantOrgId);
      res.json({
        success: true,
        data: channels,
      });
    } catch (error: any) {
      console.error('[GET /fees/notifications/channels] Error:', error);
      res.status(500).json({
        success: false,
        error: 'CHANNELS_FETCH_ERROR',
        message: error.message || 'Failed to fetch channel health',
      });
    }
  },
);

// GET /notifications/:id: Detail for single notification
feesRouter.get('/notifications/:id', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { id } = req.params;
    const notification = await FinanceNotificationService.getNotificationDetail(tenantOrgId, id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error(`[GET /fees/notifications/${req.params.id}] Error:`, error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'NOTIFICATION_DETAIL_ERROR',
      message: error.message || 'Failed to fetch notification detail',
    });
  }
});

// POST /notifications/preview: Preview template with sample data (Safe, does not send)
feesRouter.post(
  '/notifications/preview',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const { templateKey, sampleData } = req.body;
      if (!templateKey) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_TEMPLATE_KEY',
          message: 'Template key is required for preview',
        });
      }

      const preview = FinanceNotificationService.previewTemplate(templateKey, sampleData);
      res.json({
        success: true,
        data: preview,
      });
    } catch (error: any) {
      console.error('[POST /fees/notifications/preview] Error:', error);
      res.status(error.statusCode || 400).json({
        success: false,
        error: 'PREVIEW_ERROR',
        message: error.message || 'Failed to generate template preview',
      });
    }
  },
);

// POST /notifications/send-reminder: Explicitly trigger batch reminders for eligible dues
feesRouter.post(
  '/notifications/send-reminder',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      const userId =
        req.context?.user?.id ||
        (req.context?.user as any)?.user_id ||
        '00000000-0000-0000-0000-000000000000';

      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { reminderType, gradeId, academicYearId, minOutstanding, dryRun } = req.body;
      if (reminderType !== 'overdue' && reminderType !== 'due_soon') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_REMINDER_TYPE',
          message: "reminderType must be either 'overdue' or 'due_soon'",
        });
      }

      const result = await FinanceNotificationService.sendBatchReminders(tenantOrgId, userId, {
        reminderType,
        gradeId,
        academicYearId,
        minOutstanding,
        dryRun: !!dryRun,
      });

      res.json({
        success: true,
        message: dryRun
          ? `Reminder preview generated: ${result.totalEligible} eligible recipients identified.`
          : `Reminders dispatched: ${result.dispatchedCount} notifications sent successfully.`,
        data: result,
      });
    } catch (error: any) {
      console.error('[POST /fees/notifications/send-reminder] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'SEND_REMINDER_ERROR',
        message: error.message || 'Failed to send batch reminders',
      });
    }
  },
);

// POST /notifications/:id/retry: Retry dispatch for an existing notification
feesRouter.post(
  '/notifications/:id/retry',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId || req.context?.user?.org_id || req.context?.user?.school_id;
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { id } = req.params;
      const channel = req.body?.channel || 'in_app';

      const retryResult = await FinanceNotificationService.retryNotification(
        tenantOrgId,
        id,
        channel,
      );
      res.json({
        success: true,
        message: 'Notification retry processed',
        data: retryResult,
      });
    } catch (error: any) {
      console.error(`[POST /fees/notifications/${req.params.id}/retry] Error:`, error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'RETRY_ERROR',
        message: error.message || 'Failed to retry notification',
      });
    }
  },
);

// =========================================================================
// 8. FINANCE RECONCILIATION & SETTLEMENT CONTROL (PHASE 10)
// =========================================================================
import { ReconciliationService } from './services/ReconciliationService';

// GET /reconciliation/summary: High-level reconciliation KPIs
feesRouter.get(
  '/reconciliation/summary',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { startDate, endDate } = req.query;
      const summary = await ReconciliationService.getSummaryKPIs(tenantOrgId, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      });

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('[GET /fees/reconciliation/summary] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'RECONCILIATION_SUMMARY_ERROR',
        message: error.message || 'Failed to fetch reconciliation summary metrics',
      });
    }
  },
);

// GET /reconciliation/transactions: Paginated reconciliation transactions register
feesRouter.get(
  '/reconciliation/transactions',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const {
        startDate,
        endDate,
        paymentMethod,
        status,
        classification,
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await ReconciliationService.getTransactions(tenantOrgId, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        paymentMethod: paymentMethod as string | undefined,
        status: status as string | undefined,
        classification: classification as string | undefined,
        search: search as string | undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        sortBy: sortBy as string | undefined,
        sortOrder: (sortOrder as 'ASC' | 'DESC') || 'DESC',
      });

      res.json({
        success: true,
        data: result.transactions,
        total: result.totalCount,
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
      });
    } catch (error: any) {
      console.error('[GET /fees/reconciliation/transactions] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'RECONCILIATION_TRANSACTIONS_ERROR',
        message: error.message || 'Failed to fetch reconciliation transactions',
      });
    }
  },
);

// GET /reconciliation/transactions/:id: Detailed investigation view for drawer
feesRouter.get(
  '/reconciliation/transactions/:id',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { id } = req.params;
      const detail = await ReconciliationService.getTransactionDetail(tenantOrgId, id);

      res.json({
        success: true,
        data: detail,
      });
    } catch (error: any) {
      console.error(`[GET /fees/reconciliation/transactions/${req.params.id}] Error:`, error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'TRANSACTION_DETAIL_ERROR',
        message: error.message || 'Failed to fetch transaction investigation details',
      });
    }
  },
);

// GET /reconciliation/exceptions: Prioritized exception triage queue
feesRouter.get(
  '/reconciliation/exceptions',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { limit, offset } = req.query;
      const result = await ReconciliationService.getExceptions(tenantOrgId, {
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.json({
        success: true,
        data: result.exceptions,
        total: result.totalCount,
      });
    } catch (error: any) {
      console.error('[GET /fees/reconciliation/exceptions] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'EXCEPTIONS_QUEUE_ERROR',
        message: error.message || 'Failed to fetch reconciliation exceptions',
      });
    }
  },
);

// POST /reconciliation/preview: Read-only simulation of reconciliation run
feesRouter.post(
  '/reconciliation/preview',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { startDate, endDate, paymentMethod } = req.body || {};
      const preview = await ReconciliationService.previewReconciliationRun(tenantOrgId, {
        startDate,
        endDate,
        paymentMethod,
      });

      res.json({
        success: true,
        data: preview,
      });
    } catch (error: any) {
      console.error('[POST /fees/reconciliation/preview] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'PREVIEW_ERROR',
        message: error.message || 'Failed to generate reconciliation preview',
      });
    }
  },
);

// POST /reconciliation/run: Execute durable reconciliation run
feesRouter.post(
  '/reconciliation/run',
  checkPermission(PERMISSIONS.PAYMENT_RECORD),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { periodStart, periodEnd, notes } = req.body || {};
      const userId = req.context?.user?.id;

      const runResult = await ReconciliationService.executeReconciliationRun(
        tenantOrgId,
        { periodStart, periodEnd, notes },
        userId,
      );

      res.json({
        success: true,
        message: 'Reconciliation run executed successfully',
        data: runResult,
      });
    } catch (error: any) {
      console.error('[POST /fees/reconciliation/run] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'RECONCILIATION_RUN_ERROR',
        message: error.message || 'Failed to execute reconciliation run',
      });
    }
  },
);

// GET /reconciliation/runs: Historical reconciliation runs
feesRouter.get('/reconciliation/runs', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { limit } = req.query;
    const runs = await ReconciliationService.getReconciliationRuns(
      tenantOrgId,
      limit ? Number(limit) : 20,
    );

    res.json({
      success: true,
      data: runs,
    });
  } catch (error: any) {
    console.error('[GET /fees/reconciliation/runs] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'RUNS_FETCH_ERROR',
      message: error.message || 'Failed to fetch historical reconciliation runs',
    });
  }
});

// GET /reconciliation/export: CSV download with formula injection sanitization
feesRouter.get(
  '/reconciliation/export',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { startDate, endDate, paymentMethod, status, classification, search } = req.query;

      const csvData = await ReconciliationService.exportTransactionsCSV(tenantOrgId, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        paymentMethod: paymentMethod as string | undefined,
        status: status as string | undefined,
        classification: classification as string | undefined,
        search: search as string | undefined,
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="finance_reconciliation_${timestamp}.csv"`,
      );
      res.status(200).send(csvData);
    } catch (error: any) {
      console.error('[GET /fees/reconciliation/export] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'CSV_EXPORT_ERROR',
        message: error.message || 'Failed to export reconciliation CSV',
      });
    }
  },
);

// ======================================
// 10. ACCOUNTING & GENERAL LEDGER INTEGRATION (Phase 11)
// ======================================
import { AccountingService } from './services/AccountingService';

// GET /accounting/capabilities: Authoritative accounting capability matrix
feesRouter.get('/accounting/capabilities', checkPermission(PERMISSIONS.FEES_VIEW), (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const capabilities = AccountingService.getCapabilities(tenantOrgId);
    res.json({
      success: true,
      data: capabilities,
    });
  } catch (error: any) {
    console.error('[GET /fees/accounting/capabilities] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'CAPABILITIES_FETCH_ERROR',
      message: error.message || 'Failed to fetch accounting capabilities',
    });
  }
});

// GET /accounting/summary: Aggregated accounting readiness KPIs
feesRouter.get('/accounting/summary', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { startDate, endDate } = req.query;
    const summary = await AccountingService.getSummary(tenantOrgId, {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('[GET /fees/accounting/summary] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'SUMMARY_FETCH_ERROR',
      message: error.message || 'Failed to fetch accounting summary',
    });
  }
});

// GET /accounting/readiness: Operational financial transactions awaiting accounting treatment
feesRouter.get(
  '/accounting/readiness',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { sourceType, startDate, endDate, search, limit, offset } = req.query;

      const result = await AccountingService.getReadinessRegister(tenantOrgId, {
        sourceType: sourceType as any,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        search: search as string | undefined,
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
      });

      res.json({
        success: true,
        data: result.records,
        pagination: {
          total: result.totalCount,
          limit: limit ? Number(limit) : 20,
          offset: offset ? Number(offset) : 0,
        },
      });
    } catch (error: any) {
      console.error('[GET /fees/accounting/readiness] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'READINESS_FETCH_ERROR',
        message: error.message || 'Failed to fetch accounting readiness records',
      });
    }
  },
);

// GET /accounting/accounts: Standard educational chart of accounts model
feesRouter.get('/accounting/accounts', checkPermission(PERMISSIONS.FEES_VIEW), (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const accountsData = AccountingService.getAccounts(tenantOrgId);
    res.json({
      success: true,
      data: accountsData,
    });
  } catch (error: any) {
    console.error('[GET /fees/accounting/accounts] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'ACCOUNTS_FETCH_ERROR',
      message: error.message || 'Failed to fetch chart of accounts',
    });
  }
});

// GET /accounting/journals: Journal list (discloses blocked persistence)
feesRouter.get('/accounting/journals', checkPermission(PERMISSIONS.FEES_VIEW), (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const journalsData = AccountingService.getJournals(tenantOrgId);
    res.json({
      success: true,
      data: journalsData,
    });
  } catch (error: any) {
    console.error('[GET /fees/accounting/journals] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'JOURNALS_FETCH_ERROR',
      message: error.message || 'Failed to fetch journal records',
    });
  }
});

// GET /accounting/trial-balance: Trial balance (discloses blocked GL)
feesRouter.get(
  '/accounting/trial-balance',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const trialBalance = await AccountingService.getTrialBalance(tenantOrgId);
      res.json({
        success: true,
        data: trialBalance,
      });
    } catch (error: any) {
      console.error('[GET /fees/accounting/trial-balance] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'TRIAL_BALANCE_ERROR',
        message: error.message || 'Failed to fetch trial balance',
      });
    }
  },
);

// GET /accounting/general-ledger: General Ledger account reports (discloses blocked GL)
feesRouter.get('/accounting/general-ledger', checkPermission(PERMISSIONS.FEES_VIEW), (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const glData = AccountingService.getGeneralLedger(tenantOrgId);
    res.json({
      success: true,
      data: glData,
    });
  } catch (error: any) {
    console.error('[GET /fees/accounting/general-ledger] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'GL_REPORT_ERROR',
      message: error.message || 'Failed to fetch general ledger report',
    });
  }
});

// GET /accounting/exceptions: Prioritized accounting review queue
feesRouter.get(
  '/accounting/exceptions',
  checkPermission(PERMISSIONS.FEES_VIEW),
  async (req, res) => {
    try {
      const tenantOrgId =
        (req as any).tenantOrgId ||
        req.context?.user?.org_id ||
        req.context?.user?.school_id ||
        (req.headers['x-tenant-id'] as string);
      if (!tenantOrgId) {
        return res.status(400).json({
          success: false,
          error: 'TENANT_NOT_FOUND',
          message: 'Tenant organization could not be resolved from authenticated session.',
        });
      }

      const { limit, offset } = req.query;
      const exceptions = await AccountingService.getAccountingExceptions(tenantOrgId, {
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
      });

      res.json({
        success: true,
        data: exceptions,
      });
    } catch (error: any) {
      console.error('[GET /fees/accounting/exceptions] Error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.code || 'ACCOUNTING_EXCEPTIONS_ERROR',
        message: error.message || 'Failed to fetch accounting exceptions',
      });
    }
  },
);

// GET /accounting/export: Export readiness records as sanitized CSV
feesRouter.get('/accounting/export', checkPermission(PERMISSIONS.FEES_VIEW), async (req, res) => {
  try {
    const tenantOrgId =
      (req as any).tenantOrgId ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req.headers['x-tenant-id'] as string);
    if (!tenantOrgId) {
      return res.status(400).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: 'Tenant organization could not be resolved from authenticated session.',
      });
    }

    const { sourceType, startDate, endDate, search } = req.query;

    const csvData = await AccountingService.exportReadinessCSV(tenantOrgId, {
      sourceType: sourceType as any,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      search: search as string | undefined,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="finance_accounting_readiness_${timestamp}.csv"`,
    );
    res.status(200).send(csvData);
  } catch (error: any) {
    console.error('[GET /fees/accounting/export] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.code || 'CSV_EXPORT_ERROR',
      message: error.message || 'Failed to export accounting CSV',
    });
  }
});
