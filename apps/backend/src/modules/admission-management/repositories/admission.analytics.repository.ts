import { document_verify_status, admission_payment_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';

export class AdmissionAnalyticsRepository {
  static async getDashboardMetrics(orgId?: string) {
    const whereBase: any = {};
    if (orgId) whereBase.org_id = orgId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalApplications,
      todayApplications,
      statusCounts,
      pendingDocs,
      pendingAssessments,
      pendingPayments,
    ] = await Promise.all([
      prisma.admissions_applications.count({ where: whereBase }),
      prisma.admissions_applications.count({
        where: {
          ...whereBase,
          created_at: { gte: todayStart },
        },
      }),
      prisma.admissions_applications.groupBy({
        by: ['status'],
        where: whereBase,
        _count: { status: true },
      }),
      prisma.admission_documents.count({
        where: {
          verify_status: document_verify_status.pending,
          admissions_applications: whereBase,
        },
      }),
      prisma.admissions_applications.count({
        where: {
          ...whereBase,
          application_assessments: null,
        },
      }),
      prisma.admission_fee_payments.count({
        where: {
          payment_status: admission_payment_status.pending,
          admissions_applications: whereBase,
        },
      }),
    ]);

    const applicationsByStatus: Record<string, number> = {};
    for (const item of statusCounts) {
      applicationsByStatus[item.status] = item._count.status;
    }

    return {
      total_applications: totalApplications,
      today_applications: todayApplications,
      approved_applications: applicationsByStatus['approved'] || 0,
      rejected_applications: applicationsByStatus['rejected'] || 0,
      pending_documents: pendingDocs,
      pending_assessments: pendingAssessments,
      pending_payments: pendingPayments,
      applications_by_status: applicationsByStatus,
    };
  }
}
