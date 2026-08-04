import { MeritRepository } from '../../repositories/evaluation/MeritRepository';
import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { InterviewRepository } from '../../repositories/evaluation/InterviewRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { WeightCalculator } from './WeightCalculator';
import { TieBreaker, CandidateMeritInput } from './TieBreaker';
import { RankGenerator } from './RankGenerator';
import { WaitlistGenerator } from './WaitlistGenerator';
import { MeritResult } from '../../domain/evaluation/MeritResult';
import { AuditService } from '../AuditService';
import { MeritValidator } from './validators/MeritValidator';

export class MeritCalculationService {
    constructor(
        private readonly meritRepo: MeritRepository,
        private readonly examRepo: ExamRepository,
        private readonly interviewRepo: InterviewRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly meritValidator: MeritValidator,
        private readonly weightCalc: WeightCalculator,
        private readonly rankGen: RankGenerator,
        private readonly waitlistGen: WaitlistGenerator,
        private readonly auditService: AuditService
    ) {}

    /**
     * Executes merit aggregation and seat allocations dynamically.
     */
    public async calculateMeritList(
        schoolId: string,
        academicYearId: string,
        intakeLimit: number = 20,
        performedBy: string | null,
        correlationId?: string
    ): Promise<MeritResult[]> {
        // 1. Fetch all applications
        const applications = await this.appRepo.findAllSubmitted(schoolId, academicYearId);
        
        // 2. Fetch weight settings rules
        const rule = await this.meritRepo.findRule(schoolId, academicYearId);
        const ruleId = rule ? rule.id : null;
        
        const weights: Record<string, number> = {};
        if (ruleId) {
            const components = await this.meritRepo.findComponents(ruleId);
            for (const comp of components) {
                weights[comp.componentName] = comp.weight;
            }
        }

        const candidateInputs: CandidateMeritInput[] = [];

        // 3. Process candidate scores
        for (const app of applications) {
            try {
                // Assert baseline completion validations
                await this.meritValidator.validate(app.id);

                // Fetch exam percentage
                const candidate = await this.examRepo.findCandidateByApplicationId(app.id);
                if (!candidate) continue;
                const results = await this.examRepo.findResultsByCandidateId(candidate.id);
                if (results.length === 0) continue;
                const examPct = results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length;

                // Fetch interview percentage
                const interview = await this.interviewRepo.findByApplicationId(app.id);
                if (!interview) continue;
                const interviewScores = await this.interviewRepo.findScoresByInterviewId(interview.id);
                if (interviewScores.length === 0) continue;
                const interviewPct = (interviewScores.reduce((acc, curr) => acc + curr.score, 0) / (interviewScores.length * 10)) * 100;

                // Calculate final weighted score
                const finalScore = this.weightCalc.calculate(examPct, interviewPct, weights);

                // Find student profile to resolve date of birth details
                const profile = await this.appRepo.findProfile(app.id);
                const dob = profile ? profile.dateOfBirth : new Date();

                candidateInputs.push({
                    applicationId: app.id,
                    finalScore,
                    examPercentage: examPct,
                    interviewPercentage: interviewPct,
                    dateOfBirth: dob,
                    applicationDate: app.createdAt
                });
            } catch (err) {
                // Skip candidate if ineligible/incomplete
                continue;
            }
        }

        // 4. Run Rank Generator
        const tieBreakerList = rule ? rule.tieBreakerRules : undefined;
        const ranked = this.rankGen.generateRanks(candidateInputs, tieBreakerList);

        // 5. Run Seat Selections & Waitlist allocations
        const allocations = this.waitlistGen.allocateSeats(ranked, intakeLimit);

        const results: MeritResult[] = [];

        // 6. Persist results
        for (const alloc of allocations) {
            const meritResult = new MeritResult(
                crypto.randomUUID(),
                alloc.applicationId,
                alloc.finalScore,
                alloc.rank,
                alloc.status,
                alloc.waitlistPriority,
                alloc.waitlistGroup,
                `Rank: ${alloc.rank}. Alloc Status: ${alloc.status}`,
                new Date(),
                new Date()
            );

            await this.meritRepo.saveResult(meritResult);
            results.push(meritResult);

            // Log timeline event
            const isSelected = alloc.status === 'SELECTED';
            const eventName = isSelected ? 'MERIT_SELECTED' : 'MERIT_WAITLISTED';
            await this.appRepo.logWorkflow(
                alloc.applicationId,
                eventName,
                null,
                'SUBMITTED',
                performedBy,
                `Merit List generated. Candidate ranked #${alloc.rank} and status marked: ${alloc.status}.`
            );
        }

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'MERIT_LIST_GENERATED',
            entityName: 'admission_merit_results',
            entityId: schoolId,
            afterState: { candidatesCount: results.length },
            userId: performedBy,
            correlationId
        });

        return results;
    }
}
