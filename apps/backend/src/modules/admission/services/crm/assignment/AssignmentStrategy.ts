import { AdmissionLead } from '../../../domain/AdmissionLead';

export interface AssignmentStrategy {
    assign(lead: AdmissionLead): Promise<string>;
}
