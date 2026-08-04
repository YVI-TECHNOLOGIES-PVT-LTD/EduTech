import { EvaluationRepository } from '../../repositories/evaluation/EvaluationRepository';

export class EvaluationService {
    constructor(private readonly evalRepo: EvaluationRepository) {}

    public async getSummary(applicationId: string): Promise<any> {
        return this.evalRepo.getEvaluationSummary(applicationId);
    }
}
