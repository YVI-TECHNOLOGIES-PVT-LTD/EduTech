import { AdmissionError } from './AdmissionError';

export class ConflictError extends AdmissionError {
    constructor(message: string, public readonly details?: any) {
        super(message, 409);
    }
}
