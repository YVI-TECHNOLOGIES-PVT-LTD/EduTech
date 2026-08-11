import prisma from '../../../../lib/prismaClient';
import { BaseService } from '../BaseService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { NotFoundError } from '../../errors/NotFoundError';

export class DraftService extends BaseService {
  constructor(
    private readonly appRepo: ApplicationRepository,
    private readonly auditService?: any,
  ) {
    super();
  }

  public async resumeDraft(id: string): Promise<{ application: any; enquiry: any }> {
    const app = await this.appRepo.findById(id);
    if (!app) {
      throw new NotFoundError(`Application draft with ID ${id} not found`);
    }
    const enquiry = await this.loadEnquiryForApplication(app.leadId || null);
    return { application: app, enquiry };
  }

  public async loadEnquiryForApplication(
    leadId: string | null,
  ): Promise<Record<string, unknown> | null> {
    if (!leadId) return null;
    const lead = await prisma.leads.findUnique({
      where: { lead_id: leadId },
      include: {
        academic_year_grades: {
          include: { grades: true },
        },
      },
    });
    if (!lead) return null;
    const studentName = lead.student_last_name
      ? `${lead.student_first_name} ${lead.student_last_name}`
      : lead.student_first_name;
    return {
      id: lead.lead_id,
      student_name: studentName,
      parent_name: lead.contact_name,
      parent_email: lead.contact_email,
      parent_phone: lead.contact_phone,
      grade_applied_for: lead.academic_year_grades?.grades?.grade_name || 'Grade 1',
      remarks: lead.remarks,
    };
  }

  public async patchDraftSection(
    id: string,
    section: string,
    payload: any,
    expectedUpdatedAt?: string,
    correlationId?: string,
  ): Promise<void> {
    const app = await this.appRepo.findById(id);
    if (!app) {
      throw new NotFoundError(`Application with ID ${id} not found`);
    }
  }

  public async deleteDraft(id: string, correlationId?: string): Promise<void> {
    const app = await this.appRepo.findById(id);
    if (!app) {
      throw new NotFoundError(`Application draft with ID ${id} not found`);
    }
    await this.appRepo.softDelete(id);
  }
}
