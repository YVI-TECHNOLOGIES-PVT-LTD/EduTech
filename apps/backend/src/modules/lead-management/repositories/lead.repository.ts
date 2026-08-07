import { lead_stage, lead_source, lead_priority } from '../constants/lead.constants';

import prisma from '../../../lib/prismaClient';
import { CreateLeadDto } from '../dto/request/create-lead.dto';
import { UpdateLeadDto } from '../dto/request/update-lead.dto';

const db: any = prisma;

export class LeadRepository {
  static async findById(lead_id: string) {
    return db.leads.findUnique({
      where: { lead_id },
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        academic_year_grades: true,
      },
    });
  }

  static async findDuplicates(phone: string, email?: string | null, contactName?: string) {
    const whereOr: any[] = [{ contact_phone: phone }];
    if (email && email.trim() !== '') {
      whereOr.push({ contact_email: email });
    }
    if (contactName && contactName.trim() !== '') {
      whereOr.push({ contact_name: contactName });
    }

    return db.leads.findMany({
      where: {
        OR: whereOr,
      },
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async create(dto: CreateLeadDto) {
    const year = new Date().getFullYear();
    const count = await db.leads.count();
    const lead_number = `LEAD-${year}-${String(count + 1).padStart(5, '0')}`;

    return db.leads.create({
      data: {
        lead_number,
        org_id: dto.org_id,
        academic_year_grade_id: dto.academic_year_grade_id || undefined,
        student_first_name: dto.student_first_name,
        student_last_name: dto.student_last_name || undefined,
        contact_name: dto.contact_name,
        contact_phone: dto.contact_phone,
        contact_email: dto.contact_email || undefined,
        contact_relationship: dto.contact_relationship || undefined,
        source: dto.source || (lead_source as any)?.website || 'website',
        stage: dto.stage || (lead_stage as any)?.enquiry_received || 'enquiry_received',
        priority: dto.priority || (lead_priority as any)?.warm || 'warm',
        assigned_counsellor_id: dto.assigned_counsellor_id || undefined,
        dob: dto.dob ? new Date(dto.dob as string) : undefined,
        gender: dto.gender || undefined,
        curriculum_preference: dto.curriculum_preference || undefined,
        scholarship_interest: dto.scholarship_interest || false,
        remarks: dto.remarks || undefined,
      },
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async update(lead_id: string, dto: UpdateLeadDto) {
    const data: any = {
      updated_at: new Date(),
    };

    if (dto.student_first_name !== undefined) data.student_first_name = dto.student_first_name;
    if (dto.student_last_name !== undefined) data.student_last_name = dto.student_last_name;
    if (dto.contact_name !== undefined) data.contact_name = dto.contact_name;
    if (dto.contact_phone !== undefined) data.contact_phone = dto.contact_phone;
    if (dto.contact_email !== undefined) data.contact_email = dto.contact_email;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.stage !== undefined) data.stage = dto.stage;
    if ((dto as any).status !== undefined) data.stage = (dto as any).status;

    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assigned_counsellor_id !== undefined)
      data.assigned_counsellor_id = dto.assigned_counsellor_id;
    if (dto.dob !== undefined) data.dob = dto.dob ? new Date(dto.dob as string) : null;

    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.curriculum_preference !== undefined)
      data.curriculum_preference = dto.curriculum_preference;
    if (dto.scholarship_interest !== undefined)
      data.scholarship_interest = dto.scholarship_interest;
    if (dto.remarks !== undefined) data.remarks = dto.remarks;

    return db.leads.update({
      where: { lead_id },
      data,
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async updateStatus(lead_id: string, stage: lead_stage, remarks?: string | null) {
    const data: any = {
      stage,
      updated_at: new Date(),
    };
    if (remarks !== undefined) {
      data.remarks = remarks;
    }

    return db.leads.update({
      where: { lead_id },
      data,
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async assignCounselor(lead_id: string, assigned_counsellor_id: string, remarks?: string) {
    const data: any = {
      assigned_counsellor_id,
      updated_at: new Date(),
    };
    if (remarks) {
      data.remarks = remarks;
    }

    return db.leads.update({
      where: { lead_id },
      data,
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  static async bulkAssignCounselor(lead_ids: string[], assigned_counsellor_id: string) {
    return db.leads.updateMany({
      where: {
        lead_id: { in: lead_ids },
      },
      data: {
        assigned_counsellor_id,
        updated_at: new Date(),
      },
    });
  }

  static async delete(lead_id: string) {
    return db.leads.delete({
      where: { lead_id },
    });
  }
}
