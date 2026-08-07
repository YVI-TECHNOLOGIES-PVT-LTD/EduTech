import { admission_payment_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { RecordPaymentDto } from '../dto/request/record-payment.dto';

export class AdmissionPaymentRepository {
  static async upsert(applicationId: string, createdBy: string | null, dto: RecordPaymentDto) {
    const existing = await prisma.admission_fee_payments.findUnique({
      where: { application_id: applicationId },
    });

    if (existing) {
      return prisma.admission_fee_payments.update({
        where: { application_id: applicationId },
        data: {
          payment_status: dto.payment_status || admission_payment_status.pending,
          amount: dto.amount,
          payment_date: dto.payment_date ? new Date(dto.payment_date) : new Date(),
          transaction_reference: dto.transaction_reference || undefined,
          remarks: dto.remarks || undefined,
          updated_at: new Date(),
        },
      });
    }

    return prisma.admission_fee_payments.create({
      data: {
        application_id: applicationId,
        payment_status: dto.payment_status || admission_payment_status.pending,
        amount: dto.amount,
        payment_date: dto.payment_date ? new Date(dto.payment_date) : new Date(),
        transaction_reference: dto.transaction_reference || undefined,
        remarks: dto.remarks || undefined,
        created_by: createdBy || undefined,
      },
    });
  }

  static async findByApplicationId(application_id: string) {
    return prisma.admission_fee_payments.findUnique({
      where: { application_id },
    });
  }
}
