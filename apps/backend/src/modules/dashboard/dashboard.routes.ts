import { Router, Request, Response } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import prisma from '../../lib/prismaClient';
import { ParentOverviewService } from './services/parent-overview.service';

export const dashboardRouter = Router();

// ======================================
// CONSOLIDATED DASHBOARD SUMMARY (Role & Tenant Scoped)
// ======================================
dashboardRouter.get('/summary', async (req: Request, res: Response) => {
  const user = req.context?.user;
  const orgId =
    user?.org_id || user?.school_id || (req as any).user?.org_id || (req as any).user?.school_id;

  if (!orgId) {
    return res.status(403).json({
      error: 'UNAUTHORIZED_TENANT',
      message: 'User is not assigned to an organization',
    });
  }

  try {
    const [totalStudents, totalLeads, activeApplications, pendingAssessments] = await Promise.all([
      prisma.students.count({
        where: { org_id: orgId, status: 'active' },
      }),
      prisma.leads.count({
        where: { org_id: orgId },
      }),
      prisma.admissions_applications.count({
        where: {
          org_id: orgId,
          status: { in: ['submitted', 'under_review', 'approved'] },
        },
      }),
      prisma.admissions_applications.count({
        where: {
          org_id: orgId,
          status: { in: ['assessment_pending', 'documents_pending'] },
        },
      }),
    ]);

    const kpis = {
      totalLeads: totalLeads || 0,
      activeApplications: activeApplications || 0,
      studentsEnrolled: totalStudents || 0,
      pendingAssessments: pendingAssessments || 0,
      feeCollectionTotal: 0,
      conversionRate: totalLeads > 0 ? Math.round((activeApplications / totalLeads) * 100) : 0,
    };

    res.json({
      kpis,
      students: totalStudents || 0,
      totalApplications: activeApplications || 0,
      pendingAdmissions: activeApplications || 0,
      feeCollection: 0,
      funnel: [
        { stage: 'Inquiries', count: totalLeads },
        { stage: 'Applications', count: activeApplications },
        { stage: 'Assessments', count: pendingAssessments },
        { stage: 'Enrolled', count: totalStudents },
      ],
      recentActivities: [],
      pendingTasks: [],
    });
  } catch (err: any) {
    console.error('[DASHBOARD SUMMARY ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// ======================================
// ADMIN OVERVIEW
// ======================================
dashboardRouter.get(
  '/admin/overview',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_ADMIN),
  async (req: Request, res: Response) => {
    const orgId =
      req.context?.user?.org_id ||
      req.context?.user?.school_id ||
      (req as any).user?.org_id ||
      (req as any).user?.school_id;

    if (!orgId) {
      return res.status(403).json({
        error: 'UNAUTHORIZED_TENANT',
        message: 'User is not assigned to an organization',
      });
    }

    try {
      const [studentsCount, sectionsCount, pendingAdmissionsCount, totalApplicationsCount, feeAgg] =
        await Promise.all([
          prisma.students.count({
            where: { org_id: orgId, status: 'active' },
          }),
          prisma.sections.count({
            where: { academic_year_grades: { academic_years: { org_id: orgId } } },
          }),
          prisma.admissions_applications.count({
            where: {
              org_id: orgId,
              status: { in: ['submitted', 'under_review', 'documents_pending'] },
            },
          }),
          prisma.admissions_applications.count({
            where: { org_id: orgId },
          }),
          prisma.payment_transactions.aggregate({
            where: {
              payment_orders: {
                students: {
                  org_id: orgId,
                },
              },
              status: 'success',
            },
            _sum: { amount: true },
          }),
        ]);

      const feeCollection = Number(feeAgg?._sum?.amount || 0);
      const attendanceRate = '0 Sessions Today';

      res.json({
        students: studentsCount || 0,
        classes: sectionsCount || 0,
        exams: 0,
        pendingAdmissions: pendingAdmissionsCount || 0,
        totalApplications: totalApplicationsCount || 0,
        feeCollection,
        attendanceRate,
      });
    } catch (err: any) {
      console.error('[DASHBOARD ERROR]', err);
      res.status(500).json({ error: err.message });
    }
  },
);

// ======================================
// FACULTY OVERVIEW
// ======================================
dashboardRouter.get(
  '/faculty/overview',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_FACULTY),
  async (req: Request, res: Response) => {
    const userId = req.context?.user?.id || (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing user context' });
    }

    try {
      // Sections Handled: Count sections where class_teacher staff has this user_id
      const sectionsCount = await prisma.sections.count({
        where: {
          staff: {
            user_id: userId,
          },
          is_active: true,
        },
      });

      res.json({
        sections_count: sectionsCount || 0,
        classes_today: 0,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ======================================
// LIVE TIMELINE (Personalized)
// ======================================
dashboardRouter.get('/timeline', async (req: Request, res: Response) => {
  const user = req.context?.user || (req as any).user;
  const orgId = user?.org_id || user?.school_id;

  if (!orgId) {
    return res.status(403).json({
      error: 'UNAUTHORIZED_TENANT',
      message: 'User is not assigned to an organization',
    });
  }

  try {
    const [applications, payments] = await Promise.all([
      prisma.admissions_applications.findMany({
        where: { org_id: orgId },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          application_id: true,
          application_number: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.payment_transactions.findMany({
        where: {
          payment_orders: {
            students: {
              org_id: orgId,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          payment_transaction_id: true,
          amount: true,
          payment_method: true,
          status: true,
          created_at: true,
        },
      }),
    ]);

    const admissionEvents = applications.map((app) => ({
      id: app.application_id,
      type: 'ADMISSION',
      title: `Application ${app.application_number}`,
      description: `Application status: ${app.status}`,
      time: app.created_at,
      icon: 'FileText',
      color: 'amber',
    }));

    const paymentEvents = payments.map((p) => ({
      id: p.payment_transaction_id,
      type: 'PAYMENT',
      title: `Fee Payment: Rs. ${Number(p.amount)}`,
      description: `Method: ${p.payment_method} - Status: ${p.status}`,
      time: p.created_at,
      icon: 'CreditCard',
      color: 'emerald',
    }));

    const events = [...admissionEvents, ...paymentEvents]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 15);

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================
// PARENT OVERVIEW
// ======================================
dashboardRouter.get(
  '/parent/overview',
  checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT),
  async (req: Request, res: Response) => {
    try {
      const user = req.context?.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: No session context' });
      }

      const orgId = user.org_id || user.school_id;
      if (!orgId) {
        return res.status(403).json({
          error: 'UNAUTHORIZED_TENANT',
          message: 'User is not assigned to an organization',
        });
      }

      const overview = await ParentOverviewService.getParentOverview(orgId, user.id, user.email);

      return res.json(overview);
    } catch (err: any) {
      console.error('[DashboardRouter] Error fetching parent overview:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },
);
