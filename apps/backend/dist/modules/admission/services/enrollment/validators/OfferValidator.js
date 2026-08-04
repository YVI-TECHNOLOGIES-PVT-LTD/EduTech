"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
const CRM_APPROVED_STATUSES = new Set(['OFFERED', 'FEE_VERIFIED', 'FEE_PENDING']);
class OfferValidator {
    constructor(offerRepo, appRepo) {
        this.offerRepo = offerRepo;
        this.appRepo = appRepo;
    }
    async validate(applicationId) {
        const offer = await this.offerRepo.findByApplicationId(applicationId);
        if (offer) {
            if (offer.status !== 'ACCEPTED') {
                throw new BusinessRuleError_1.BusinessRuleError(`Admission Offer status is "${offer.status}". Must be ACCEPTED before proceeding.`);
            }
            return;
        }
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new BusinessRuleError_1.BusinessRuleError(`Application with ID ${applicationId} not found`);
        }
        if (!CRM_APPROVED_STATUSES.has(application.status)) {
            throw new BusinessRuleError_1.BusinessRuleError('Application must be approved before enrollment. Generate/accept an offer or complete committee approval.');
        }
    }
}
exports.OfferValidator = OfferValidator;
