import { ConfirmationRepository } from '../../repositories/enrollment/ConfirmationRepository';

export class AdmissionNumberGenerator {
    constructor(private readonly confirmRepo: ConfirmationRepository) {}

    /**
     * Policy-driven formatted sequential sequence generator.
     */
    public async generateNextNumber(schoolId: string): Promise<string> {
        let seq = await this.confirmRepo.findSequence(schoolId);
        if (!seq) {
            seq = {
                id: crypto.randomUUID(),
                school_id: schoolId,
                prefix: 'SCH-2026-',
                suffix: '',
                current_value: 1
            };
        }

        const value = seq.current_value;
        const num = `${seq.prefix}${value.toString().padStart(6, '0')}${seq.suffix}`;

        // Increment current pointer
        seq.current_value = value + 1;
        await this.confirmRepo.saveSequence(seq);

        return num;
    }
}
