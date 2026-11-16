import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { RecordDecisionDto } from '../dto/request/record-decision.dto';

const isValidUuid = (val?: string | null): val is string =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

export class AdmissionDecisionRepository {
  static async upsert(
    applicationId: string,
    createdBy: string | null,
    dto: RecordDecisionDto,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client = tx || prisma;
    const existing = await client.admission_decisions.findUnique({
      where: { application_id: applicationId },
    });

    const decidedBy = isValidUuid(dto.decided_by)
      ? dto.decided_by
      : isValidUuid(createdBy)
        ? createdBy
        : undefined;
    const authorId = isValidUuid(createdBy) ? createdBy : undefined;

    const offerExpiryDate =
      dto.offer_expiry_date && dto.offer_expiry_date.trim() !== ''
        ? new Date(dto.offer_expiry_date)
        : undefined;

    const decisionDate =
      dto.decision_date && dto.decision_date.trim() !== ''
        ? new Date(dto.decision_date)
        : new Date();

    if (existing) {
      return client.admission_decisions.update({
        where: { application_id: applicationId },
        data: {
          decision_status: dto.decision_status,
          decision_date: decisionDate,
          decided_by: decidedBy,
          reason: dto.reason || undefined,
          remarks: dto.remarks || undefined,
          offer_expiry_date: offerExpiryDate,
          waitlist_position:
            dto.waitlist_position !== undefined ? dto.waitlist_position : undefined,
          scholarship_percentage:
            dto.scholarship_percentage !== undefined ? dto.scholarship_percentage : undefined,
          updated_at: new Date(),
          updated_by: authorId,
        },
      });
    }

    return client.admission_decisions.create({
      data: {
        application_id: applicationId,
        decision_status: dto.decision_status,
        decision_date: decisionDate,
        decided_by: decidedBy,
        reason: dto.reason || undefined,
        remarks: dto.remarks || undefined,
        offer_expiry_date: offerExpiryDate,
        waitlist_position: dto.waitlist_position !== undefined ? dto.waitlist_position : undefined,
        scholarship_percentage:
          dto.scholarship_percentage !== undefined ? dto.scholarship_percentage : undefined,
        created_by: authorId,
      },
    });
  }

  static async findByApplicationId(
    application_id: string,
    tx?: Prisma.TransactionClient | typeof prisma,
  ) {
    const client = tx || prisma;
    return client.admission_decisions.findUnique({
      where: { application_id },
    });
  }
}
