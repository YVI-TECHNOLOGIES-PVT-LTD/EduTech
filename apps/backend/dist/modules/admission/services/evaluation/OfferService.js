"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferService = void 0;
const OfferLetter_1 = require("../../domain/evaluation/OfferLetter");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
const supabase_1 = require("../../../../config/supabase");
class OfferService {
    constructor(offerRepo, appRepo, stateMachine, auditService) {
        this.offerRepo = offerRepo;
        this.appRepo = appRepo;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
    }
    async generateOffer(applicationId, templateId, expiryDays, officerId, correlationId) {
        // Fetch active templates
        const template = await this.offerRepo.findTemplateById(templateId);
        if (!template) {
            throw new Error(`Offer Letter Template with ID ${templateId} not found`);
        }
        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(issueDate.getDate() + expiryDays);
        const offerNum = `OFFER-${applicationId.substring(0, 6).toUpperCase()}-${Date.now().toString().substring(8)}`;
        const offer = new OfferLetter_1.OfferLetter(crypto.randomUUID(), applicationId, offerNum, templateId, issueDate, null, expiryDate, 'GENERATED', new Date(), new Date());
        await this.offerRepo.save(offer);
        // Auto transition to SENT status for presentation
        await this.stateMachine.validateTransition('GENERATED', 'SENT', 'admission_officer');
        offer.transition('SENT');
        await this.offerRepo.save(offer);
        // Update application workflow timeline logs
        await this.appRepo.logWorkflow(applicationId, 'OFFER_GENERATED', null, 'SUBMITTED', officerId, `Admission Offer generated: ${offerNum}. Valid until ${expiryDate.toLocaleDateString()}`);
        // Update application status history records
        await supabase_1.supabase
            .from('status_history')
            .insert({
            entity_name: 'admission_offer_letters',
            entity_id: offer.id,
            old_status: null,
            new_status: 'SENT',
            reason: 'Generated and dispatched offer letter to parent.',
            changed_by: officerId,
            correlation_id: correlationId,
            event_name: 'OfferDispatched'
        });
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'OFFER_GENERATED_SENT',
            entityName: 'admission_offer_letters',
            entityId: offer.id,
            afterState: { offerNum, expiryDate: expiryDate.toISOString() },
            userId: officerId,
            correlationId
        });
        return offer;
    }
    async acceptOffer(applicationId, role, performedBy, correlationId) {
        const offer = await this.offerRepo.findByApplicationId(applicationId);
        if (!offer) {
            throw new Error(`Offer letter not found for application ${applicationId}`);
        }
        const today = new Date();
        if (offer.expiryDate < today) {
            offer.transition('EXPIRED');
            await this.offerRepo.save(offer);
            throw new BusinessRuleError_1.BusinessRuleError('Cannot accept offer. The offer letter validity has expired.');
        }
        const oldStatus = offer.status;
        await this.stateMachine.validateTransition(oldStatus, 'ACCEPTED', role);
        offer.transition('ACCEPTED');
        await this.offerRepo.save(offer);
        // Timeline log
        await this.appRepo.logWorkflow(applicationId, 'OFFER_ACCEPTED', null, 'SUBMITTED', performedBy, `Offer letter accepted. Awaiting fee collection enrollment steps.`);
        // Update status history
        await supabase_1.supabase
            .from('status_history')
            .insert({
            entity_name: 'admission_offer_letters',
            entity_id: offer.id,
            old_status: oldStatus,
            new_status: 'ACCEPTED',
            reason: 'Dispatched offer accepted by parent.',
            changed_by: performedBy,
            correlation_id: correlationId,
            event_name: 'OfferAccepted'
        });
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'OFFER_ACCEPTED',
            entityName: 'admission_offer_letters',
            entityId: offer.id,
            beforeState: { status: oldStatus },
            afterState: { status: 'ACCEPTED' },
            userId: performedBy,
            correlationId
        });
        return offer;
    }
    async rejectOffer(applicationId, role, performedBy, correlationId) {
        const offer = await this.offerRepo.findByApplicationId(applicationId);
        if (!offer) {
            throw new Error(`Offer letter not found for application ${applicationId}`);
        }
        // To reject is equivalent to cancelling the offer. For workflow compliance, we mark status as EXPIRED or EXPIRED/REJECTED.
        // As per OfferStateMachine paths: SENT -> EXPIRED.
        const oldStatus = offer.status;
        await this.stateMachine.validateTransition(oldStatus, 'EXPIRED', role);
        offer.transition('EXPIRED');
        await this.offerRepo.save(offer);
        // Timeline log
        await this.appRepo.logWorkflow(applicationId, 'OFFER_REJECTED', null, 'SUBMITTED', performedBy, `Offer letter declined or expired.`);
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'OFFER_DECLINED_REJECTED',
            entityName: 'admission_offer_letters',
            entityId: offer.id,
            beforeState: { status: oldStatus },
            afterState: { status: 'EXPIRED' },
            userId: performedBy,
            correlationId
        });
        return offer;
    }
}
exports.OfferService = OfferService;
