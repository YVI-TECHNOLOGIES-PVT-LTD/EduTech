"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferLetter = void 0;
class OfferLetter {
    constructor(id, applicationId, offerNumber, templateId, issueDate, acceptanceDate, expiryDate, status, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.offerNumber = offerNumber;
        this.templateId = templateId;
        this.issueDate = issueDate;
        this.acceptanceDate = acceptanceDate;
        this.expiryDate = expiryDate;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    transition(newStatus) {
        this.status = newStatus;
        if (newStatus === 'ACCEPTED') {
            this.acceptanceDate = new Date();
        }
        this.updatedAt = new Date();
    }
}
exports.OfferLetter = OfferLetter;
