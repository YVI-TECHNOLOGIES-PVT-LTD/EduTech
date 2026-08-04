import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class BiometricValidator {
    public validateRecord(deviceCode: string, studentAdmissionNo: string): void {
        if (!deviceCode || !studentAdmissionNo) {
            throw new BusinessRuleError('Biometric record is missing scanner identifiers.');
        }
    }
}
