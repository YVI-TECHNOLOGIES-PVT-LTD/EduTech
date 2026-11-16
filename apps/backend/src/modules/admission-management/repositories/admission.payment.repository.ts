import { admission_payment_status, Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { RecordPaymentDto } from '../dto/request/record-payment.dto';

export class AdmissionPaymentRepository {
  static async upsert(
    applicationId: string,
    actorId: string | null,
    dto: Omit<RecordPaymentDto, 'amount'> & { amount: number | Prisma.Decimal },
  ) {
    const existing = await prisma.admission_fee_payments.findUnique({
      where: { application_id: applicationId },
    });

    const paymentDate = dto.payment_date
      ? new Date(dto.payment_date)
      : dto.payment_status === admission_payment_status.paid
        ? new Date()
        : null;

    if (existing) {
      return prisma.admission_fee_payments.update({
        where: { application_id: applicationId },
        data: {
          payment_status: dto.payment_status || admission_payment_status.pending,
          amount: dto.amount,
          payment_date: paymentDate,
          transaction_reference: dto.transaction_reference || existing.transaction_reference,
          payment_mode: dto.payment_mode || existing.payment_mode,
          card_name: dto.card_name || existing.card_name,
          card_last_four: dto.card_last_four || existing.card_last_four,
          remarks: dto.remarks !== undefined ? dto.remarks : existing.remarks,
          updated_by: actorId || undefined,
          updated_at: new Date(),
        },
      });
    }

    try {
      return await prisma.admission_fee_payments.create({
        data: {
          application_id: applicationId,
          payment_status: dto.payment_status || admission_payment_status.pending,
          amount: dto.amount,
          payment_date: paymentDate,
          transaction_reference: dto.transaction_reference || undefined,
          payment_mode: dto.payment_mode || undefined,
          card_name: dto.card_name || undefined,
          card_last_four: dto.card_last_four || undefined,
          remarks: dto.remarks || undefined,
          created_by: actorId || undefined,
          updated_by: actorId || undefined,
        },
      });
    } catch (err: any) {
      // Concurrency protection: If race condition creates record first, fallback to update
      if (err.code === 'P2002') {
        return prisma.admission_fee_payments.update({
          where: { application_id: applicationId },
          data: {
            payment_status: dto.payment_status || admission_payment_status.pending,
            amount: dto.amount,
            payment_date: paymentDate,
            transaction_reference: dto.transaction_reference || undefined,
            payment_mode: dto.payment_mode || undefined,
            card_name: dto.card_name || undefined,
            card_last_four: dto.card_last_four || undefined,
            remarks: dto.remarks !== undefined ? dto.remarks : undefined,
            updated_by: actorId || undefined,
            updated_at: new Date(),
          },
        });
      }
      throw err;
    }
  }

  static async findByApplicationId(application_id: string) {
    return prisma.admission_fee_payments.findUnique({
      where: { application_id },
    });
  }
}
