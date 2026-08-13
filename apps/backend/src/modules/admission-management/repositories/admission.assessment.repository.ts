import prisma from '../../../lib/prismaClient';
import { RecordAssessmentDto } from '../dto/request/record-assessment.dto';

export class AdmissionAssessmentRepository {
  static async upsert(applicationId: string, createdBy: string | null, dto: RecordAssessmentDto) {
    const existing = await prisma.application_assessments.findUnique({
      where: { application_id: applicationId },
    });

    if (existing) {
      return prisma.application_assessments.update({
        where: { application_id: applicationId },
        data: {
          config_id: dto.config_id || undefined,
          assessment_date: new Date(dto.assessment_date),
          maximum_marks: dto.maximum_marks !== undefined ? dto.maximum_marks : undefined,
          marks_obtained: dto.marks_obtained !== undefined ? dto.marks_obtained : undefined,
          percentage: dto.percentage !== undefined ? dto.percentage : undefined,
          result: dto.result || undefined,
          remarks: dto.remarks || undefined,
          assessed_by: dto.assessed_by || createdBy || undefined,
          updated_at: new Date(),
        },
      });
    }

    return prisma.application_assessments.create({
      data: {
        application_id: applicationId,
        config_id: dto.config_id || '',
        assessment_date: new Date(dto.assessment_date),
        maximum_marks: dto.maximum_marks !== undefined ? dto.maximum_marks : undefined,
        marks_obtained: dto.marks_obtained !== undefined ? dto.marks_obtained : undefined,
        percentage: dto.percentage !== undefined ? dto.percentage : undefined,
        result: dto.result || undefined,
        remarks: dto.remarks || undefined,
        assessed_by: dto.assessed_by || createdBy || undefined,
        created_by: createdBy || undefined,
      },
    });
  }

  static async findByApplicationId(application_id: string) {
    return prisma.application_assessments.findUnique({
      where: { application_id },
      include: { assessment_configurations: true },
    });
  }
}
