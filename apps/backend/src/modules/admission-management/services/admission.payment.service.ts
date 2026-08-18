import crypto from 'crypto';
import { Prisma, admission_payment_status, admission_payment_mode } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { AdmissionPaymentRepository } from '../repositories/admission.payment.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import {
  ApplicationNotFoundError,
  ApplicationValidationError,
  ApplicationForbiddenError,
} from '../errors/admission.errors';
import { RecordPaymentDto } from '../dto/request/record-payment.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export interface OrgBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch?: string;
}

/**
 * Organization-scoped static bank account configuration for institution fee remittance.
 * Scoped authoritatively to organization UUID.
 */
export const ORG_BANK_CONFIG: Record<string, OrgBankDetails> = {
  // Greenwood School, Delhi (ORG-001)
  '624efc1b-4144-43a4-90b8-552d945cbef7': {
    bankName: 'State Bank of India',
    accountName: 'Greenwood School Educational Society',
    accountNumber: '389201948201',
    ifscCode: 'SBIN0001234',
    branch: 'Connaught Place Main Branch, New Delhi',
  },
  // National Public School, Ahmedabad (ORG-004)
  '5205f1f3-4e31-42d9-9b53-77fc84ad40df': {
    bankName: 'HDFC Bank',
    accountName: 'National Public School Education Trust',
    accountNumber: '50200039281920',
    ifscCode: 'HDFC0000456',
    branch: 'Navrangpura Branch, Ahmedabad',
  },
};

export class AdmissionPaymentService {
  /**
   * Authoritative Fee Calculation for an existing application.
   * Scoped strictly to application.org_id and application.academic_year_id.
   */
  static async getApplicationFee(
    applicationId: string,
    orgId?: string,
    userId?: string | null,
    isParentOnly?: boolean,
  ) {
    const app = await AdmissionRepository.findById(
      applicationId,
      orgId,
      isParentOnly ? userId || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const authoritativeOrgId = app.org_id;
    const authoritativeAcademicYearId = app.academic_year_id;

    // Load authoritative fee configuration
    const config = await prisma.admission_configurations.findFirst({
      where: {
        org_id: authoritativeOrgId,
        academic_year_id: authoritativeAcademicYearId,
      },
    });

    const applicationFee = config?.application_fee
      ? new Prisma.Decimal(config.application_fee)
      : new Prisma.Decimal(1000);
    const processingFee = config?.processing_fee
      ? new Prisma.Decimal(config.processing_fee)
      : new Prisma.Decimal(200);
    const totalFee = applicationFee.plus(processingFee);

    // Check optional decision/scholarship percentage
    const decision = await prisma.admission_decisions.findUnique({
      where: { application_id: applicationId },
      select: { scholarship_percentage: true, decision_status: true },
    });

    // Check existing payment
    const payment = await prisma.admission_fee_payments.findUnique({
      where: { application_id: applicationId },
    });

    const bankDetails = ORG_BANK_CONFIG[authoritativeOrgId] || null;

    return {
      application_id: app.application_id,
      application_number:
        app.application_number || `APP-${app.application_id.slice(0, 8).toUpperCase()}`,
      org_id: authoritativeOrgId,
      org_name: (app as any).organizations?.org_name || null,
      academic_year_id: authoritativeAcademicYearId,
      currency: 'INR',
      application_fee: applicationFee.toNumber(),
      processing_fee: processingFee.toNumber(),
      total_fee: totalFee.toNumber(),
      scholarship_percentage: decision?.scholarship_percentage
        ? Number(decision.scholarship_percentage)
        : null,
      payment_status: payment?.payment_status || 'pending',
      bank_details: bankDetails,
      payment: payment
        ? {
            payment_id: payment.payment_id,
            payment_status: payment.payment_status,
            amount: Number(payment.amount),
            payment_date: payment.payment_date ? payment.payment_date.toISOString() : null,
            transaction_reference: payment.transaction_reference,
            payment_mode: payment.payment_mode,
            card_name: payment.card_name,
            card_last_four: payment.card_last_four,
            remarks: payment.remarks,
          }
        : null,
    };
  }

  /**
   * Pre-application fee configuration query scoped to active organization.
   */
  static async getFeeConfig(orgId?: string, academicYearId?: string) {
    let targetOrgId = orgId;
    if (targetOrgId) {
      const validOrg = await prisma.organizations.findFirst({
        where: { org_id: targetOrgId, status: 'active' },
      });
      if (!validOrg) {
        throw new ApplicationValidationError('Invalid or inactive organization requested');
      }
    } else {
      const defaultOrg = await prisma.organizations.findFirst({
        where: { status: 'active' },
        orderBy: { created_at: 'asc' },
      });
      targetOrgId = defaultOrg?.org_id;
    }

    if (!targetOrgId) {
      throw new ApplicationValidationError('Organization context could not be resolved');
    }

    const config = await prisma.admission_configurations.findFirst({
      where: {
        org_id: targetOrgId,
        ...(academicYearId ? { academic_year_id: academicYearId } : {}),
      },
      orderBy: { created_at: 'desc' },
    });

    const applicationFee = config?.application_fee
      ? new Prisma.Decimal(config.application_fee)
      : new Prisma.Decimal(1000);
    const processingFee = config?.processing_fee
      ? new Prisma.Decimal(config.processing_fee)
      : new Prisma.Decimal(200);
    const totalFee = applicationFee.plus(processingFee);

    return {
      org_id: targetOrgId,
      academic_year_id: config?.academic_year_id || academicYearId || null,
      currency: 'INR',
      application_fee: applicationFee.toNumber(),
      processing_fee: processingFee.toNumber(),
      total_fee: totalFee.toNumber(),
      bank_details: ORG_BANK_CONFIG[targetOrgId] || null,
    };
  }

  /**
   * Record / Settle Fee Payment for an Application.
   * Server determines authoritative amount. Prevents client tampering and duplicate downgrades.
   */
  static async recordPayment(
    applicationId: string,
    actorId: string | null,
    dto: RecordPaymentDto,
    orgId?: string,
    isParentOnly?: boolean,
  ) {
    const app = await AdmissionRepository.findById(
      applicationId,
      orgId,
      isParentOnly ? actorId || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const authoritativeOrgId = app.org_id;
    const authoritativeAcademicYearId = app.academic_year_id;

    // Load authoritative fee configuration
    const config = await prisma.admission_configurations.findFirst({
      where: {
        org_id: authoritativeOrgId,
        academic_year_id: authoritativeAcademicYearId,
      },
    });

    const applicationFee = config?.application_fee
      ? new Prisma.Decimal(config.application_fee)
      : new Prisma.Decimal(1000);
    const processingFee = config?.processing_fee
      ? new Prisma.Decimal(config.processing_fee)
      : new Prisma.Decimal(200);
    const authoritativeTotalFee = applicationFee.plus(processingFee);

    // Check existing payment status
    const existingPayment = await prisma.admission_fee_payments.findUnique({
      where: { application_id: applicationId },
    });

    if (
      existingPayment &&
      existingPayment.payment_status === admission_payment_status.paid &&
      isParentOnly
    ) {
      // Idempotent: already paid, do not re-process or downgrade
      return existingPayment;
    }

    let finalAmount: Prisma.Decimal;
    let finalStatus: admission_payment_status;
    let finalTxnRef: string;
    let finalMode: admission_payment_mode | null;
    let finalDate: Date;

    if (isParentOnly) {
      // Parent MVP Simulation: server enforces exact authoritative amount and status
      finalAmount = authoritativeTotalFee;
      finalStatus = admission_payment_status.paid;
      finalTxnRef =
        dto.transaction_reference ||
        `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      finalMode = dto.payment_mode || admission_payment_mode.card;
      finalDate = new Date();
    } else {
      // Staff-authorized manual / offline entry
      finalAmount =
        dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : authoritativeTotalFee;
      finalStatus = dto.payment_status || admission_payment_status.paid;
      finalTxnRef = dto.transaction_reference || `TXN-STAFF-${Date.now()}`;
      finalMode = dto.payment_mode || admission_payment_mode.cash;
      finalDate = dto.payment_date ? new Date(dto.payment_date) : new Date();
    }

    const payment = await AdmissionPaymentRepository.upsert(applicationId, actorId, {
      ...dto,
      amount: finalAmount,
      payment_status: finalStatus,
      payment_date: finalDate.toISOString(),
      transaction_reference: finalTxnRef,
      payment_mode: finalMode,
    });

    logger.info(`Fee payment recorded for application ${applicationId}`, {
      applicationId,
      paymentId: payment.payment_id,
      amount: Number(payment.amount),
      status: payment.payment_status,
      actorId,
      mode: payment.payment_mode,
      txnRef: payment.transaction_reference,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.PAYMENT_RECORDED, {
      applicationId,
      performedBy: actorId,
      timestamp: new Date().toISOString(),
      metadata: {
        paymentId: payment.payment_id,
        amount: Number(payment.amount),
        paymentStatus: payment.payment_status,
        transactionReference: payment.transaction_reference,
      },
    });

    return payment;
  }

  static async getPaymentByApplication(
    applicationId: string,
    orgId?: string,
    parentUserId?: string,
    isParentOnly?: boolean,
  ) {
    const app = await AdmissionRepository.findById(
      applicationId,
      orgId,
      isParentOnly ? parentUserId || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionPaymentRepository.findByApplicationId(applicationId);
  }
}
