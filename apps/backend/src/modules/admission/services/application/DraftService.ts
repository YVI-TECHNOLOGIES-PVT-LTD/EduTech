import { BaseService } from '../BaseService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { AdmissionApplication } from '../../domain/application/AdmissionApplication';
import { ApplicationProfile } from '../../domain/application/ApplicationProfile';
import { ApplicationDeclaration } from '../../domain/application/ApplicationDeclaration';
import { NotFoundError } from '../../errors/NotFoundError';
import { ConflictError } from '../../errors/ConflictError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';
import { AuditService } from '../AuditService';
import { supabase } from '../../../../config/supabase';

export class DraftService extends BaseService {
    constructor(
        private readonly appRepo: ApplicationRepository,
        private readonly auditService: AuditService
    ) {
        super();
    }

    /**
     * Resumes a draft by retrieving its consolidated aggregate details.
     */
    public async resumeDraft(id: string): Promise<any> {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError(`Application with ID ${id} not found`);
        }

        const [profile, parents, education, preferences, declaration, enquiry] = await Promise.all([
            this.appRepo.findProfile(id),
            this.appRepo.findParents(id),
            this.appRepo.findPreviousEducation(id),
            this.appRepo.findPreferences(id),
            this.appRepo.findDeclaration(id),
            this.loadEnquiryForApplication(application.leadId),
        ]);

        return {
            application,
            profile,
            parents,
            education,
            preferences,
            declaration,
            enquiry,
        };
    }

    private async loadEnquiryForApplication(leadId: string | null): Promise<Record<string, unknown> | null> {
        if (!leadId) return null;
        const { data: lead } = await supabase
            .from('admission_leads')
            .select('enquiry_id')
            .eq('id', leadId)
            .maybeSingle();
        if (!lead?.enquiry_id) return null;
        const { data: enquiry } = await supabase
            .from('admission_enquiries')
            .select('*')
            .eq('id', lead.enquiry_id)
            .maybeSingle();
        return enquiry ?? null;
    }

    /**
     * Partially updates a draft section with optimistic locking.
     */
    public async patchDraftSection(
        id: string,
        section: 'profile' | 'parents' | 'education' | 'preferences' | 'declaration',
        payload: any,
        expectedUpdatedAt: string,
        correlationId?: string
    ): Promise<void> {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError(`Application draft with ID ${id} not found`);
        }

        if (application.status === 'SUBMITTED') {
            throw new BusinessRuleError('Cannot update draft. The application has already been submitted and frozen.');
        }

        // Optimistic Locking Check
        const actualTime = application.updatedAt.toISOString();
        if (actualTime !== expectedUpdatedAt) {
            throw new ConflictError(
                'Concurrent modification conflict. The application draft was updated by another process.'
            );
        }

        // Execute save based on section type
        if (section === 'profile') {
            let profile = await this.appRepo.findProfile(id);
            if (!profile) {
                profile = new ApplicationProfile(
                    crypto.randomUUID(),
                    id,
                    new Date(payload.date_of_birth),
                    payload.gender,
                    payload.blood_group || null,
                    payload.nationality || null,
                    payload.religion || null,
                    payload.category || null,
                    payload.aadhaar || null,
                    payload.photo_url || null,
                    payload.allergies || null,
                    payload.medical_conditions || null,
                    payload.emergency_notes || null,
                    new Date(),
                    new Date()
                );
            } else {
                profile.update({
                    ...payload,
                    dateOfBirth: payload.date_of_birth ? new Date(payload.date_of_birth) : profile.dateOfBirth
                });
            }
            await this.appRepo.saveProfile(profile);
        } else if (section === 'parents') {
            await this.appRepo.saveParents(id, payload);
        } else if (section === 'education') {
            await this.appRepo.savePreviousEducation(id, payload);
        } else if (section === 'preferences') {
            await this.appRepo.savePreferences(id, payload);
        } else if (section === 'declaration') {
            let dec = await this.appRepo.findDeclaration(id);
            if (!dec) {
                dec = new ApplicationDeclaration(
                    crypto.randomUUID(),
                    id,
                    payload.agreed_to_terms,
                    payload.parent_signature || null,
                    payload.date_signed ? new Date(payload.date_signed) : null,
                    new Date(),
                    new Date()
                );
            } else {
                if (payload.parent_signature) {
                    dec.sign(payload.parent_signature);
                }
            }
            await this.appRepo.saveDeclaration(dec);
        }

        // Update header metadata, incrementing version number
        application.incrementVersion(`Updated section: ${section}`);
        await this.appRepo.save(application);

        // Audit mutation log
        await this.auditService.logAudit({
            action: `DRAFT_SECTION_PATCHED_${section.toUpperCase()}`,
            entityName: 'admission_applications',
            entityId: id,
            afterState: payload,
            userId: application.createdBy,
            correlationId
        });
    }

    /**
     * Soft deletes an application draft.
     */
    public async deleteDraft(id: string, correlationId?: string): Promise<void> {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError(`Application draft with ID ${id} not found`);
        }

        if (application.status === 'SUBMITTED') {
            throw new BusinessRuleError('Cannot delete draft. The application has already been submitted.');
        }

        application.softDelete();
        await this.appRepo.save(application);

        await this.auditService.logAudit({
            action: 'DRAFT_DELETED',
            entityName: 'admission_applications',
            entityId: id,
            afterState: { status: 'DELETED' },
            userId: application.createdBy,
            correlationId
        });
    }
}
