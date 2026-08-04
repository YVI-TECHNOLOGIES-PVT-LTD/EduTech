import { AttendanceCorrection } from '../../../domain/attendance/AttendanceCorrection';
import { BusinessRuleError } from '../../../../admission/errors/BusinessRuleError';

export class CorrectionValidator {
    public validatePending(correction: AttendanceCorrection): void {
        if (correction.status !== 'PENDING') {
            throw new BusinessRuleError(`Correction status is "${correction.status}". Only PENDING requests can be processed.`);
        }
    }
}
