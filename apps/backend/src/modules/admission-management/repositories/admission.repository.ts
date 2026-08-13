import { application_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { CreateApplicationDto } from '../dto/request/create-application.dto';
import { UpdateApplicationDto } from '../dto/request/update-application.dto';

export class AdmissionRepository {
  static async findById(application_id: string, org_id?: string, parentUserId?: string) {
    const where: any = { application_id };
    if (org_id) where.org_id = org_id;
    if (parentUserId) where.created_by = parentUserId;

    return prisma.admissions_applications.findFirst({
      where,
      include: {
        leads: true,
        academic_years: true,
        admission_documents: {
          include: { document_types: true },
        },
        application_assessments: true,
        admission_decisions: true,
        admission_fee_payments: true,
      },
    });
  }

  static async findByLeadId(lead_id: string, org_id?: string) {
    const where: any = { lead_id };
    if (org_id) where.org_id = org_id;

    return prisma.admissions_applications.findFirst({
      where,
      include: {
        leads: true,
        academic_years: true,
        admission_documents: true,
        application_assessments: true,
        admission_decisions: true,
        admission_fee_payments: true,
      },
    });
  }

  static async create(dto: CreateApplicationDto, createdBy?: string | null) {
    const year = new Date().getFullYear();
    const count = await prisma.admissions_applications.count();
    let appSeq = count + 1;
    let application_number = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
    while (await prisma.admissions_applications.findUnique({ where: { application_number } })) {
      appSeq++;
      application_number = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
    }

    return prisma.admissions_applications.create({
      data: {
        lead_id: dto.lead_id!,
        org_id: dto.org_id!,
        academic_year_id: dto.academic_year_id!,
        application_number,
        application_date: dto.application_date ? new Date(dto.application_date) : new Date(),
        status: dto.status || application_status.submitted,
        created_by: createdBy || undefined,
      },
      include: {
        leads: true,
        academic_years: true,
      },
    });
  }

  static async update(application_id: string, dto: UpdateApplicationDto) {
    const data: any = { updated_at: new Date() };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.academic_year_id !== undefined) data.academic_year_id = dto.academic_year_id;

    return prisma.admissions_applications.update({
      where: { application_id },
      data,
      include: {
        leads: true,
        academic_years: true,
        admission_documents: true,
        application_assessments: true,
        admission_decisions: true,
        admission_fee_payments: true,
      },
    });
  }

  static async updateStatus(application_id: string, status: application_status) {
    return prisma.admissions_applications.update({
      where: { application_id },
      data: {
        status,
        updated_at: new Date(),
      },
      include: {
        leads: true,
        academic_years: true,
      },
    });
  }

  static async delete(application_id: string) {
    return prisma.admissions_applications.delete({
      where: { application_id },
    });
  }
}
