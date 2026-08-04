import { AdmissionError } from './AdmissionError';

export class PermissionError extends AdmissionError {
    constructor(message: string = 'Access denied') {
        super(message, 403);
    }
}
