import { OfferValidator } from './OfferValidator';
import { FeeValidator } from './FeeValidator';
import { PaymentValidator } from './PaymentValidator';
import { ReceiptValidator } from './ReceiptValidator';
import { ConfirmationValidator } from './ConfirmationValidator';
import { StudentProvisionValidator } from './StudentProvisionValidator';
import { EnrollmentValidator } from './EnrollmentValidator';

export class EnrollmentValidationCoordinator {
    constructor(
        private readonly offerVal: OfferValidator,
        private readonly feeVal: FeeValidator,
        private readonly paymentVal: PaymentValidator,
        private readonly receiptVal: ReceiptValidator,
        private readonly confirmationVal: ConfirmationValidator,
        private readonly provisionVal: StudentProvisionValidator,
        private readonly enrollmentVal: EnrollmentValidator
    ) {}

    /**
     * Validates offer, fees, payments, and receipts before admission confirmation is created.
     */
    public async validatePreConfirmation(applicationId: string): Promise<void> {
        await this.offerVal.validate(applicationId);
        await this.feeVal.validate(applicationId);
        await this.paymentVal.validate(applicationId);
        await this.receiptVal.validate(applicationId);
    }

    /**
     * Executes sequential validation pipeline checks (post-confirmation / pre-provision).
     */
    public async validatePreEnrollment(applicationId: string): Promise<void> {
        await this.validatePreConfirmation(applicationId);
        await this.confirmationVal.validate(applicationId);
    }

    public async validateFullEnrollment(applicationId: string): Promise<void> {
        // Pre-checks
        await this.validatePreEnrollment(applicationId);

        // Step 6: ERP handovers completed jobs checks
        await this.provisionVal.validate(applicationId);

        // Step 7: Application status state checks
        await this.enrollmentVal.validate(applicationId);
    }
}
