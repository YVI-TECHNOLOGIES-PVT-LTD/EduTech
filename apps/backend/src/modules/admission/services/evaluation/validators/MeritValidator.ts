import { ExamRepository } from '../../../repositories/evaluation/ExamRepository';
import { InterviewRepository } from '../../../repositories/evaluation/InterviewRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class MeritValidator {
    constructor(
        private readonly examRepo: ExamRepository,
        private readonly interviewRepo: InterviewRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        // 1. Verify exam results recorded
        const candidate = await this.examRepo.findCandidateByApplicationId(applicationId);
        if (!candidate) {
            throw new BusinessRuleError(`Candidate is missing exam session details.`);
        }
        const examResults = await this.examRepo.findResultsByCandidateId(candidate.id);
        if (!examResults || examResults.length === 0) {
            throw new BusinessRuleError(`Exam marks have not been recorded.`);
        }

        // 2. Verify interview score details recorded
        const interview = await this.interviewRepo.findByApplicationId(applicationId);
        if (!interview) {
            throw new BusinessRuleError(`Candidate is missing scheduled interview details.`);
        }
        const interviewScores = await this.interviewRepo.findScoresByInterviewId(interview.id);
        if (!interviewScores || interviewScores.length === 0) {
            throw new BusinessRuleError(`Interview scores have not been recorded.`);
        }
    }
}
