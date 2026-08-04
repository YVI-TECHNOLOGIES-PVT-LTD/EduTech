"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeritValidator = void 0;
const BusinessRuleError_1 = require("../../../errors/BusinessRuleError");
class MeritValidator {
    constructor(examRepo, interviewRepo) {
        this.examRepo = examRepo;
        this.interviewRepo = interviewRepo;
    }
    async validate(applicationId) {
        // 1. Verify exam results recorded
        const candidate = await this.examRepo.findCandidateByApplicationId(applicationId);
        if (!candidate) {
            throw new BusinessRuleError_1.BusinessRuleError(`Candidate is missing exam session details.`);
        }
        const examResults = await this.examRepo.findResultsByCandidateId(candidate.id);
        if (!examResults || examResults.length === 0) {
            throw new BusinessRuleError_1.BusinessRuleError(`Exam marks have not been recorded.`);
        }
        // 2. Verify interview score details recorded
        const interview = await this.interviewRepo.findByApplicationId(applicationId);
        if (!interview) {
            throw new BusinessRuleError_1.BusinessRuleError(`Candidate is missing scheduled interview details.`);
        }
        const interviewScores = await this.interviewRepo.findScoresByInterviewId(interview.id);
        if (!interviewScores || interviewScores.length === 0) {
            throw new BusinessRuleError_1.BusinessRuleError(`Interview scores have not been recorded.`);
        }
    }
}
exports.MeritValidator = MeritValidator;
