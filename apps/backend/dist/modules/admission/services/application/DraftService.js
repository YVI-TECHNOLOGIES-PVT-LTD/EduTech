"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftService = void 0;
const BaseService_1 = require("../BaseService");
const ApplicationProfile_1 = require("../../domain/application/ApplicationProfile");
const ApplicationDeclaration_1 = require("../../domain/application/ApplicationDeclaration");
const NotFoundError_1 = require("../../errors/NotFoundError");
const ConflictError_1 = require("../../errors/ConflictError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
const supabase_1 = require("../../../../config/supabase");
class DraftService extends BaseService_1.BaseService {
    constructor(appRepo, auditService) {
        super();
        this.appRepo = appRepo;
        this.auditService = auditService;
    }
    /**
     * Resumes a draft by retrieving its consolidated aggregate details.
     */
    async resumeDraft(id) {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${id} not found`);
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
    async loadEnquiryForApplication(leadId) {
        if (!leadId)
            return null;
        const { data: lead } = await supabase_1.supabase
            .from('admission_leads')
            .select('enquiry_id')
            .eq('id', leadId)
            .maybeSingle();
        if (!lead?.enquiry_id)
            return null;
        const { data: enquiry } = await supabase_1.supabase
            .from('admission_enquiries')
            .select('*')
            .eq('id', lead.enquiry_id)
            .maybeSingle();
        return enquiry ?? null;
    }
    /**
     * Partially updates a draft section with optimistic locking.
     */
    async patchDraftSection(id, section, payload, expectedUpdatedAt, correlationId) {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application draft with ID ${id} not found`);
        }
        if (application.status === 'SUBMITTED') {
            throw new BusinessRuleError_1.BusinessRuleError('Cannot update draft. The application has already been submitted and frozen.');
        }
        // Optimistic Locking Check
        const actualTime = application.updatedAt.toISOString();
        if (actualTime !== expectedUpdatedAt) {
            throw new ConflictError_1.ConflictError('Concurrent modification conflict. The application draft was updated by another process.');
        }
        // Execute save based on section type
        if (section === 'profile') {
            let profile = await this.appRepo.findProfile(id);
            if (!profile) {
                profile = new ApplicationProfile_1.ApplicationProfile(crypto.randomUUID(), id, new Date(payload.date_of_birth), payload.gender, payload.blood_group || null, payload.nationality || null, payload.religion || null, payload.category || null, payload.aadhaar || null, payload.photo_url || null, payload.allergies || null, payload.medical_conditions || null, payload.emergency_notes || null, new Date(), new Date());
            }
            else {
                profile.update({
                    ...payload,
                    dateOfBirth: payload.date_of_birth ? new Date(payload.date_of_birth) : profile.dateOfBirth
                });
            }
            await this.appRepo.saveProfile(profile);
        }
        else if (section === 'parents') {
            await this.appRepo.saveParents(id, payload);
        }
        else if (section === 'education') {
            await this.appRepo.savePreviousEducation(id, payload);
        }
        else if (section === 'preferences') {
            await this.appRepo.savePreferences(id, payload);
        }
        else if (section === 'declaration') {
            let dec = await this.appRepo.findDeclaration(id);
            if (!dec) {
                dec = new ApplicationDeclaration_1.ApplicationDeclaration(crypto.randomUUID(), id, payload.agreed_to_terms, payload.parent_signature || null, payload.date_signed ? new Date(payload.date_signed) : null, new Date(), new Date());
            }
            else {
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
    async deleteDraft(id, correlationId) {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application draft with ID ${id} not found`);
        }
        if (application.status === 'SUBMITTED') {
            throw new BusinessRuleError_1.BusinessRuleError('Cannot delete draft. The application has already been submitted.');
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
exports.DraftService = DraftService;
