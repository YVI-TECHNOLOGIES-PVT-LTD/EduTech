import { IdentityRepository } from '../repositories/IdentityRepository';

export class BarcodeService {
    constructor(private readonly identityRepo: IdentityRepository) {}

    public async getBarcode(studentId: string): Promise<any | null> {
        return this.identityRepo.findBarcodeByStudentId(studentId);
    }
}
