import { OfferRepository } from '../../../repositories/evaluation/OfferRepository';
import { ApplicationRepository } from '../../../repositories/application/ApplicationRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

const CRM_APPROVED_STATUSES = new Set(['OFFERED', 'FEE_VERIFIED', 'FEE_PENDING']);

export class OfferValidator {
    constructor(
        private readonly offerRepo: OfferRepository,
        private readonly appRepo: ApplicationRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        const offer = await this.offerRepo.findByApplicationId(applicationId);
        if (offer) {
            if (offer.status !== 'ACCEPTED') {
                throw new BusinessRuleError(
                    `Admission Offer status is "${offer.status}". Must be ACCEPTED before proceeding.`
                );
            }
            return;
        }

        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new BusinessRuleError(`Application with ID ${applicationId} not found`);
        }

        if (!CRM_APPROVED_STATUSES.has(application.status)) {
            throw new BusinessRuleError(
                'Application must be approved before enrollment. Generate/accept an offer or complete committee approval.'
            );
        }
    }
}
