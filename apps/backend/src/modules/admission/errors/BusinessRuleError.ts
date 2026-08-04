import { AdmissionError } from './AdmissionError';

export class BusinessRuleError extends AdmissionError {
    constructor(message: string) {
        super(message, 422);
    }
}
