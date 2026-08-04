import { AdmissionLead } from '../../../domain/AdmissionLead';
import { AssignmentStrategy } from './AssignmentStrategy';

export class ManualAssignmentStrategy implements AssignmentStrategy {
    constructor(private readonly counselorId: string) {}

    public async assign(lead: AdmissionLead): Promise<string> {
        if (!this.counselorId) {
            throw new Error('Counselor ID must be provided for manual assignment');
        }
        return this.counselorId;
    }
}
