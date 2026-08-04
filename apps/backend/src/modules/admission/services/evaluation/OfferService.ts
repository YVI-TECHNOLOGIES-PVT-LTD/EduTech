import { OfferRepository } from '../../repositories/evaluation/OfferRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { OfferLetter, OfferStatus } from '../../domain/evaluation/OfferLetter';
import { OfferStateMachine } from './state-machine/OfferStateMachine';
import { AuditService } from '../AuditService';
import { BusinessRuleError } from '../../errors/BusinessRuleError';
import { supabase } from '../../../../config/supabase';

export class OfferService {
    constructor(
        private readonly offerRepo: OfferRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly stateMachine: OfferStateMachine,
        private readonly auditService: AuditService
    ) {}

    public async generateOffer(
        applicationId: string,
        templateId: string,
        expiryDays: number,
        officerId: string | null,
        correlationId?: string
    ): Promise<OfferLetter> {
        // Fetch active templates
        const template = await this.offerRepo.findTemplateById(templateId);
        if (!template) {
            throw new Error(`Offer Letter Template with ID ${templateId} not found`);
        }

        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(issueDate.getDate() + expiryDays);

        const offerNum = `OFFER-${applicationId.substring(0, 6).toUpperCase()}-${Date.now().toString().substring(8)}`;

        const offer = new OfferLetter(
            crypto.randomUUID(),
            applicationId,
            offerNum,
            templateId,
            issueDate,
            null,
            expiryDate,
            'GENERATED',
            new Date(),
            new Date()
        );
        await this.offerRepo.save(offer);

        // Auto transition to SENT status for presentation
        await this.stateMachine.validateTransition('GENERATED', 'SENT', 'admission_officer');
        offer.transition('SENT');
        await this.offerRepo.save(offer);

        // Update application workflow timeline logs
        await this.appRepo.logWorkflow(
            applicationId,
            'OFFER_GENERATED',
            null,
            'SUBMITTED',
            officerId,
            `Admission Offer generated: ${offerNum}. Valid until ${expiryDate.toLocaleDateString()}`
        );

        // Update application status history records
        await supabase
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

    public async acceptOffer(
        applicationId: string,
        role: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<OfferLetter> {
        const offer = await this.offerRepo.findByApplicationId(applicationId);
        if (!offer) {
            throw new Error(`Offer letter not found for application ${applicationId}`);
        }

        const today = new Date();
        if (offer.expiryDate < today) {
            offer.transition('EXPIRED');
            await this.offerRepo.save(offer);
            throw new BusinessRuleError('Cannot accept offer. The offer letter validity has expired.');
        }

        const oldStatus = offer.status;
        await this.stateMachine.validateTransition(oldStatus, 'ACCEPTED', role);

        offer.transition('ACCEPTED');
        await this.offerRepo.save(offer);

        // Timeline log
        await this.appRepo.logWorkflow(
            applicationId,
            'OFFER_ACCEPTED',
            null,
            'SUBMITTED',
            performedBy,
            `Offer letter accepted. Awaiting fee collection enrollment steps.`
        );

        // Update status history
        await supabase
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

    public async rejectOffer(
        applicationId: string,
        role: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<OfferLetter> {
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
        await this.appRepo.logWorkflow(
            applicationId,
            'OFFER_REJECTED',
            null,
            'SUBMITTED',
            performedBy,
            `Offer letter declined or expired.`
        );

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
