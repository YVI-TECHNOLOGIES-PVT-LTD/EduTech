import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { RecordDecisionDto } from '../dto/request/record-decision.dto';

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

    if (existing) {
      return client.admission_decisions.update({
        where: { application_id: applicationId },
        data: {
          decision_status: dto.decision_status,
          decision_date: dto.decision_date ? new Date(dto.decision_date) : new Date(),
          decided_by: dto.decided_by || createdBy || undefined,
          reason: dto.reason || undefined,
          remarks: dto.remarks || undefined,
          offer_expiry_date: dto.offer_expiry_date ? new Date(dto.offer_expiry_date) : undefined,
          waitlist_position:
            dto.waitlist_position !== undefined ? dto.waitlist_position : undefined,
          scholarship_percentage:
            dto.scholarship_percentage !== undefined ? dto.scholarship_percentage : undefined,
          updated_at: new Date(),
        },
      });
    }

    return client.admission_decisions.create({
      data: {
        application_id: applicationId,
        decision_status: dto.decision_status,
        decision_date: dto.decision_date ? new Date(dto.decision_date) : new Date(),
        decided_by: dto.decided_by || createdBy || undefined,
        reason: dto.reason || undefined,
        remarks: dto.remarks || undefined,
        offer_expiry_date: dto.offer_expiry_date ? new Date(dto.offer_expiry_date) : undefined,
        waitlist_position: dto.waitlist_position !== undefined ? dto.waitlist_position : undefined,
        scholarship_percentage:
          dto.scholarship_percentage !== undefined ? dto.scholarship_percentage : undefined,
        created_by: createdBy || undefined,
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
