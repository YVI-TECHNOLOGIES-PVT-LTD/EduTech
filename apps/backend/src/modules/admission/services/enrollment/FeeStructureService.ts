import { FeeRepository } from '../../repositories/enrollment/FeeRepository';
import { AdmissionFeeStructure } from '../../domain/enrollment/AdmissionFee';

export class FeeStructureService {
    constructor(private readonly feeRepo: FeeRepository) {}

    public async getStructure(id: string): Promise<AdmissionFeeStructure | null> {
        return this.feeRepo.findStructureById(id);
    }
}
