import { application_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { CreateApplicationDto } from '../dto/request/create-application.dto';
import { UpdateApplicationDto } from '../dto/request/update-application.dto';

export class AdmissionRepository {
  static async findById(application_id: string, org_id?: string, parentUserId?: string) {
    const where: any = { application_id };
    if (org_id) where.org_id = org_id;
    if (parentUserId) {
      where.OR = [
        { leads: { parents: { user_id: parentUserId } } },
        { created_by: parentUserId },
        { leads: { created_by: parentUserId } },
      ];
    }

    return prisma.admissions_applications.findFirst({
      where,
      include: {
        leads: {
          include: {
            parents: true,
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
            staff: {
              include: {
                users_staff_user_idTousers: true,
              },
            },
          },
        },
        academic_years: true,
        organizations: true,
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
        leads: {
          include: {
            parents: true,
            academic_year_grades: {
              include: {
                grades: true,
                academic_years: true,
              },
            },
            staff: {
              include: {
                users_staff_user_idTousers: true,
              },
            },
          },
        },
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

  static async create(dto: CreateApplicationDto, createdBy?: string | null) {
    const year = new Date().getFullYear();
    const lastApp = await prisma.admissions_applications.findFirst({
      where: { application_number: { startsWith: `APP-${year}-` } },
      orderBy: { application_number: 'desc' },
      select: { application_number: true },
    });
    let appSeq = 1;
    if (lastApp?.application_number) {
      const match = lastApp.application_number.match(/(\d+)$/);
      if (match) appSeq = parseInt(match[1], 10) + 1;
    }
    const application_number = `APP-${year}-${String(appSeq).padStart(5, '0')}`;

    return prisma.admissions_applications.create({
      data: {
        lead_id: dto.lead_id!,
        org_id: dto.org_id!,
        academic_year_id: dto.academic_year_id!,
        application_number,
        application_date: dto.application_date ? new Date(dto.application_date) : new Date(),
        status: dto.status || application_status.submitted,
        created_by: createdBy || undefined,
        nationality: dto.nationality || undefined,
        previous_school_name: dto.previous_school_name || dto.previous_school || undefined,
        previous_school_address: dto.previous_school_address || undefined,
        previous_school_board: dto.previous_school_board || undefined,
        previous_grade: dto.previous_grade || undefined,
        previous_school_year: dto.previous_school_year || undefined,
      } as any,
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
    if (dto.nationality !== undefined) data.nationality = dto.nationality;
    if (dto.previous_school_name !== undefined)
      data.previous_school_name = dto.previous_school_name;
    if (dto.previous_school_address !== undefined)
      data.previous_school_address = dto.previous_school_address;
    if (dto.previous_school_board !== undefined)
      data.previous_school_board = dto.previous_school_board;
    if (dto.previous_grade !== undefined) data.previous_grade = dto.previous_grade;
    if (dto.previous_school_year !== undefined)
      data.previous_school_year = dto.previous_school_year;

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
