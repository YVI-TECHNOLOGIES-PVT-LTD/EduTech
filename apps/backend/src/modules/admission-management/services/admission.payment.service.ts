import { AdmissionPaymentRepository } from '../repositories/admission.payment.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import { ApplicationNotFoundError } from '../errors/admission.errors';
import { RecordPaymentDto } from '../dto/request/record-payment.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export class AdmissionPaymentService {
  static async recordPayment(
    applicationId: string,
    createdBy: string | null,
    dto: RecordPaymentDto,
    orgId?: string,
  ) {
    const isParentOnly = createdBy ? true : false;
    const app = await AdmissionRepository.findById(
      applicationId,
      orgId,
      isParentOnly ? createdBy || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const payment = await AdmissionPaymentRepository.upsert(applicationId, createdBy, dto);

    logger.info(`Fee payment recorded for application ${applicationId}`, {
      applicationId,
      paymentId: payment.payment_id,
      amount: Number(payment.amount),
      status: payment.payment_status,
      createdBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.PAYMENT_RECORDED, {
      applicationId,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
      metadata: {
        paymentId: payment.payment_id,
        amount: Number(payment.amount),
        paymentStatus: payment.payment_status,
      },
    });

    return payment;
  }

  static async getPaymentByApplication(
    applicationId: string,
    orgId?: string,
    parentUserId?: string,
  ) {
    const app = await AdmissionRepository.findById(applicationId, orgId, parentUserId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionPaymentRepository.findByApplicationId(applicationId);
  }
}
