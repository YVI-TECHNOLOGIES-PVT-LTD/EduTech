import { document_verify_status, admission_payment_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';

export class AdmissionPendingQuery {
  static async execute(orgId?: string) {
    const whereBase: any = {};
    if (orgId) whereBase.org_id = orgId;

    const [pendingDocuments, pendingAssessments, pendingPayments] = await Promise.all([
      prisma.admission_documents.findMany({
        where: {
          verify_status: document_verify_status.pending,
          admissions_applications: whereBase,
        },
        include: {
          admissions_applications: {
            include: { leads: true },
          },
          document_types: true,
        },
        take: 50,
      }),
      prisma.admissions_applications.findMany({
        where: {
          ...whereBase,
          application_assessments: null,
        },
        include: { leads: true },
        take: 50,
      }),
      prisma.admission_fee_payments.findMany({
        where: {
          payment_status: admission_payment_status.pending,
          admissions_applications: whereBase,
        },
        include: {
          admissions_applications: {
            include: { leads: true },
          },
        },
        take: 50,
      }),
    ]);

    return {
      pending_documents: pendingDocuments,
      pending_assessments: pendingAssessments,
      pending_payments: pendingPayments,
    };
  }
}
