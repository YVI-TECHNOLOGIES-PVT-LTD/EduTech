"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentValidationCoordinator = void 0;
class EnrollmentValidationCoordinator {
    constructor(offerVal, feeVal, paymentVal, receiptVal, confirmationVal, provisionVal, enrollmentVal) {
        this.offerVal = offerVal;
        this.feeVal = feeVal;
        this.paymentVal = paymentVal;
        this.receiptVal = receiptVal;
        this.confirmationVal = confirmationVal;
        this.provisionVal = provisionVal;
        this.enrollmentVal = enrollmentVal;
    }
    /**
     * Validates offer, fees, payments, and receipts before admission confirmation is created.
     */
    async validatePreConfirmation(applicationId) {
        await this.offerVal.validate(applicationId);
        await this.feeVal.validate(applicationId);
        await this.paymentVal.validate(applicationId);
        await this.receiptVal.validate(applicationId);
    }
    /**
     * Executes sequential validation pipeline checks (post-confirmation / pre-provision).
     */
    async validatePreEnrollment(applicationId) {
        await this.validatePreConfirmation(applicationId);
        await this.confirmationVal.validate(applicationId);
    }
    async validateFullEnrollment(applicationId) {
        // Pre-checks
        await this.validatePreEnrollment(applicationId);
        // Step 6: ERP handovers completed jobs checks
        await this.provisionVal.validate(applicationId);
        // Step 7: Application status state checks
        await this.enrollmentVal.validate(applicationId);
    }
}
exports.EnrollmentValidationCoordinator = EnrollmentValidationCoordinator;
