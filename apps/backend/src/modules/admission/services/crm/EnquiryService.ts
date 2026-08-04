import { BaseService } from '../BaseService';
import { EnquiryRepository } from '../../repositories/crm/EnquiryRepository';
import { LeadRepository } from '../../repositories/crm/LeadRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { AdmissionEnquiry, EnquirySource } from '../../domain/AdmissionEnquiry';
import { createEnquirySchema } from '../../dto/create-enquiry.dto';
import { updateEnquirySchema } from '../../dto/update-enquiry.dto';
import { AdmissionCRMTransactionService } from './AdmissionCRMTransactionService';
import { ApplicationService } from '../application/ApplicationService';
import { AuditService } from '../AuditService';
import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';
import { ValidationError } from '../../errors/ValidationError';
import { mapEnquiryToApiRecord, resolveAssignmentHistory, resolveCounselorNames } from './CrmRecordMapper';

export class EnquiryService extends BaseService {
    constructor(
        private readonly enquiryRepo: EnquiryRepository,
        private readonly transactionService: AdmissionCRMTransactionService,
        private readonly auditService: AuditService,
        private readonly leadRepo: LeadRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly applicationService: ApplicationService
    ) {
        super();
    }

    public async createEnquiry(schoolId: string, academicYearId: string, payload: any, correlationId?: string): Promise<AdmissionEnquiry> {
        const validated = this.validate(createEnquirySchema, payload);

        // Check for duplicates
        const dupCheck = await this.checkDuplicates({
            ...validated,
            academic_year_id: academicYearId
        });

        if (dupCheck.status === 'exact_match' && !payload.ignore_duplicate) {
            throw new ConflictError('Exact duplicate enquiry found', { matches: dupCheck.matches });
        }

        const id = crypto.randomUUID();
        const enquiry = new AdmissionEnquiry(
            id,
            schoolId,
            academicYearId,
            validated.student_name,
            validated.grade_applied_for,
            validated.parent_name,
            validated.parent_email,
            validated.parent_phone,
            validated.source as EnquirySource,
            'new',
            new Date(),
            new Date(),
            null,
            validated.date_of_birth ? new Date(validated.date_of_birth) : null,
            validated.gender || null,
            validated.current_school || null,
            validated.address || null,
            validated.remarks || null
        );

        const saved = await this.enquiryRepo.save(enquiry);

        await this.auditService.logAudit({
            userId: null,
            action: 'INSERT',
            entityName: 'admission_enquiries',
            entityId: saved.id,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async updateEnquiry(id: string, payload: any, correlationId?: string): Promise<AdmissionEnquiry> {
        const validated = this.validate(updateEnquirySchema, payload);
        const existing = await this.enquiryRepo.findById(id);
        if (!existing) {
            throw new NotFoundError(`Enquiry with ID ${id} not found`);
        }

        const beforeState = { ...existing };

        // Map values
        const updated = new AdmissionEnquiry(
            existing.id,
            existing.schoolId,
            existing.academicYearId,
            validated.student_name !== undefined ? validated.student_name : existing.studentName,
            validated.grade_applied_for !== undefined ? validated.grade_applied_for : existing.gradeAppliedFor,
            validated.parent_name !== undefined ? validated.parent_name : existing.parentName,
            validated.parent_email !== undefined ? validated.parent_email : existing.parentEmail,
            validated.parent_phone !== undefined ? validated.parent_phone : existing.parentPhone,
            validated.source !== undefined ? validated.source as EnquirySource : existing.source,
            existing.status,
            existing.createdAt,
            new Date(),
            existing.deletedAt,
            validated.date_of_birth !== undefined ? (validated.date_of_birth ? new Date(validated.date_of_birth) : null) : existing.dateOfBirth,
            validated.gender !== undefined ? validated.gender : existing.gender,
            validated.current_school !== undefined ? validated.current_school : existing.currentSchool,
            validated.address !== undefined ? validated.address : existing.address,
            validated.remarks !== undefined ? validated.remarks : existing.remarks
        );

        const saved = await this.enquiryRepo.save(updated);

        await this.auditService.logAudit({
            userId: null,
            action: 'UPDATE',
            entityName: 'admission_enquiries',
            entityId: saved.id,
            beforeState,
            afterState: saved,
            correlationId
        });

        return saved;
    }

    public async getEnquiryById(id: string): Promise<Record<string, unknown>> {
        const enquiry = await this.enquiryRepo.findById(id);
        if (!enquiry) {
            throw new NotFoundError(`Enquiry with ID ${id} not found`);
        }
        const lead = await this.leadRepo.findByEnquiryId(id);
        const applicationId = lead ? (await this.appRepo.findCurrentByLeadId(lead.id))?.id ?? null : null;
        const counselorName = lead?.counselorId
            ? (await resolveCounselorNames([lead.counselorId])).get(lead.counselorId) ?? null
            : null;
        const assignmentMap = lead ? await resolveAssignmentHistory([lead.id]) : new Map();
        return mapEnquiryToApiRecord(enquiry, lead, applicationId, counselorName, lead ? assignmentMap.get(lead.id) : undefined);
    }

    public async deleteEnquiry(id: string, correlationId?: string): Promise<void> {
        const existing = await this.enquiryRepo.findById(id);
        if (!existing) {
            throw new NotFoundError(`Enquiry with ID ${id} not found`);
        }

        await this.enquiryRepo.softDelete(id);

        await this.auditService.logAudit({
            userId: null,
            action: 'DELETE',
            entityName: 'admission_enquiries',
            entityId: id,
            beforeState: existing,
            correlationId
        });
    }

    public async listEnquiries(
        schoolId: string,
        page: number,
        limit: number,
        filters?: Record<string, any>,
        search?: string,
        sortColumn?: string,
        sortOrder?: 'asc' | 'desc'
    ): Promise<{ data: Record<string, unknown>[]; total: number }> {
        const { data: enquiries, total } = await this.enquiryRepo.findAll(
            schoolId,
            page,
            limit,
            filters,
            search,
            sortColumn,
            sortOrder
        );

        const enquiryIds = enquiries.map(e => e.id);
        const leadMap = await this.leadRepo.findByEnquiryIds(enquiryIds);
        const applicationMap = await this.appRepo.findCurrentIdsByLeadIds(
            [...leadMap.values()].map(l => l.id)
        );
        const counselorNames = await resolveCounselorNames(
            [...leadMap.values()].map(l => l.counselorId).filter(Boolean) as string[]
        );
        const assignmentMap = await resolveAssignmentHistory([...leadMap.values()].map(l => l.id));

        const data = await Promise.all(
            enquiries.map(enquiry => {
                const lead = leadMap.get(enquiry.id) ?? null;
                const applicationId = lead ? applicationMap.get(lead.id) ?? null : null;
                const counselorName = lead?.counselorId ? counselorNames.get(lead.counselorId) ?? null : null;
                return mapEnquiryToApiRecord(
                    enquiry,
                    lead,
                    applicationId,
                    counselorName,
                    lead ? assignmentMap.get(lead.id) : undefined
                );
            })
        );

        return { data, total };
    }

    public async convertToLead(enquiryId: string, correlationId?: string, userId?: string | null): Promise<string> {
        const enquiry = await this.enquiryRepo.findById(enquiryId);
        if (!enquiry) {
            throw new NotFoundError(`Enquiry with ID ${enquiryId} not found`);
        }

        if (enquiry.status === 'converted') {
            throw new ConflictError('Enquiry is already converted to a lead');
        }

        // Step 1: Look up an existing lead for this enquiry (created during assignment)
        let existingLead = await this.leadRepo.findByEnquiryId(enquiryId);

        // Step 2: Resolve counselorId — prefer lead.counselorId over remarks fallback
        let counselorId: string | null | undefined = existingLead?.counselorId ?? null;

        if (!counselorId) {
            // Fallback: check remarks for legacy compatibility
            let remarksObj: Record<string, any> = {};
            if (enquiry.remarks) {
                try {
                    remarksObj = JSON.parse(enquiry.remarks);
                } catch (e) {
                    // Ignore parse errors for non-JSON remarks
                }
            }
            counselorId = remarksObj.counselor_id || null;
        }

        if (!counselorId) {
            throw new BusinessRuleError('Inquiry must be assigned a counselor before conversion');
        }

        let leadId: string;

        if (existingLead) {
            // Lead already exists (created during assignment) — only mark enquiry as converted
            leadId = existingLead.id;
            const { error } = await (await import('../../../../config/supabase')).supabase
                .from('admission_enquiries')
                .update({ status: 'converted', updated_at: new Date().toISOString() })
                .eq('id', enquiryId);
            if (error) {
                this.logError('Failed to mark enquiry as converted', error, correlationId);
                throw new Error(`Failed to update enquiry status: ${error.message}`);
            }
        } else {
            // No lead yet — create it atomically via transaction
            leadId = crypto.randomUUID();
            await this.transactionService.convertEnquiryToLead(enquiryId, leadId, correlationId, counselorId);
        }

        await this.auditService.logAudit({
            userId: userId || null,
            action: 'CONVERT_ENQUIRY',
            entityName: 'admission_enquiries',
            entityId: enquiryId,
            afterState: { leadId, counselorId },
            correlationId
        });

        return leadId;
    }

    /**
     * Converts an enquiry to a lead and creates exactly one CRM application.
     * Idempotent: returns existing application if already created for the lead.
     */
    public async convertToApplication(
        enquiryId: string,
        correlationId?: string,
        userId?: string | null
    ): Promise<{ leadId: string; applicationId: string }> {
        const enquiry = await this.enquiryRepo.findById(enquiryId);
        if (!enquiry) {
            throw new NotFoundError(`Enquiry with ID ${enquiryId} not found`);
        }

        let leadId: string;
        if (enquiry.status === 'converted') {
            const existingLead = await this.leadRepo.findByEnquiryId(enquiryId);
            if (!existingLead) {
                throw new BusinessRuleError('Enquiry is converted but no lead record exists');
            }
            leadId = existingLead.id;
        } else {
            leadId = await this.convertToLead(enquiryId, correlationId, userId);
        }

        const existingApp = await this.appRepo.findCurrentByLeadId(leadId);
        if (existingApp) {
            return { leadId, applicationId: existingApp.id };
        }

        if (!enquiry.dateOfBirth) {
            throw new ValidationError('Date of birth is required on the inquiry before converting to an application');
        }

        const application = await this.applicationService.createApplication(
            enquiry.schoolId,
            enquiry.academicYearId,
            userId ?? null,
            {
                lead_id: leadId,
                grade: enquiry.gradeAppliedFor,
                student_name: enquiry.studentName,
                date_of_birth: enquiry.dateOfBirth.toISOString().split('T')[0],
                gender: enquiry.gender || 'Other',
            },
            correlationId
        );

        await this.auditService.logStatusChange({
            entityName: 'admission_leads',
            entityId: leadId,
            oldStatus: null,
            newStatus: 'INTERESTED',
            changedBy: userId ?? null,
            reason: 'Lead converted to application',
            correlationId,
            eventName: 'LeadConverted'
        });

        return { leadId, applicationId: application.id };
    }

    public async checkDuplicates(enquiryData: any): Promise<{ status: 'no_duplicate' | 'potentials_found' | 'exact_match' | 'merge_candidate'; matches: any[] }> {
        const potentialMatches = await this.enquiryRepo.findPossibleDuplicates(
            enquiryData.student_name,
            enquiryData.parent_phone,
            enquiryData.parent_email,
            enquiryData.date_of_birth ? new Date(enquiryData.date_of_birth) : null,
            enquiryData.grade_applied_for,
            enquiryData.academic_year_id
        );

        if (potentialMatches.length === 0) {
            return { status: 'no_duplicate', matches: [] };
        }

        const matches = potentialMatches.map(m => {
            let matchType: 'exact_match' | 'potential_match' | 'merge_candidate' = 'potential_match';
            
            const dobMatches = m.dateOfBirth && enquiryData.date_of_birth && 
                new Date(m.dateOfBirth).toISOString().split('T')[0] === new Date(enquiryData.date_of_birth).toISOString().split('T')[0];
            
            const emailMatches = m.parentEmail === enquiryData.parent_email;
            const phoneMatches = m.parentPhone === enquiryData.parent_phone;
            const nameMatches = m.studentName.toLowerCase() === enquiryData.student_name.toLowerCase();

            if (nameMatches && phoneMatches && emailMatches && dobMatches) {
                matchType = 'exact_match';
            } else if (nameMatches && (phoneMatches || emailMatches)) {
                matchType = 'merge_candidate';
            }

            return { enquiry: m, matchType };
        });

        const hasExact = matches.some(m => m.matchType === 'exact_match');
        const hasMerge = matches.some(m => m.matchType === 'merge_candidate');

        let status: 'no_duplicate' | 'potentials_found' | 'exact_match' | 'merge_candidate' = 'potentials_found';
        if (hasExact) status = 'exact_match';
        else if (hasMerge) status = 'merge_candidate';

        return { status, matches };
    }
}
