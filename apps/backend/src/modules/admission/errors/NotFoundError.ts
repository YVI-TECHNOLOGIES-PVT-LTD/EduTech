import { AdmissionError } from './AdmissionError';

export class NotFoundError extends AdmissionError {
    constructor(message: string) {
        super(message, 404);
    }
}
