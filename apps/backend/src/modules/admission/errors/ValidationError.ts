import { AdmissionError } from './AdmissionError';

export class ValidationError extends AdmissionError {
    constructor(message: string, public readonly errors?: any) {
        super(message, 400);
    }
}
