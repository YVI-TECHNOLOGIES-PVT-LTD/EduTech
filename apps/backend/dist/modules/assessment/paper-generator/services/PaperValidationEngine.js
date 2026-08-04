"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperValidationEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const PaperRepository_1 = require("../repositories/PaperRepository");
const PaperValidationRepository_1 = require("../repositories/PaperValidationRepository");
class PaperValidationEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new PaperRepository_1.PaperRepository();
        this.valRepo = new PaperValidationRepository_1.PaperValidationRepository();
    }
    async validatePaper(paperId, schoolId, userId, correlationId) {
        this.logInfo(`Running verification pipeline on generated paper: ${paperId}`, correlationId);
        const errors = [];
        const warnings = [];
        const paper = await this.repo.findPaperById(paperId, schoolId);
        if (!paper)
            throw new Error('Generated paper not found.');
        // 1. Check sections length
        if (!paper.sections || paper.sections.length === 0) {
            errors.push('Sections mismatch: No sections mapped to this exam paper.');
        }
        // 2. Validate questions count in each section
        let totalAssignedQuestions = 0;
        let calculatedMarks = 0;
        for (const sec of paper.sections || []) {
            const assignedCount = sec.questions?.length || 0;
            totalAssignedQuestions += assignedCount;
            calculatedMarks += Number(sec.total_questions) * Number(sec.points_per_question);
            if (assignedCount < sec.total_questions) {
                errors.push(`Section "${sec.section_name}" requires ${sec.total_questions} questions, but only ${assignedCount} questions could be assembled.`);
            }
        }
        // 3. Compare with blueprint target marks
        if (Math.abs(calculatedMarks - Number(paper.total_marks)) > 0.01) {
            errors.push(`Marks mismatch: Sections calculated total is ${calculatedMarks} marks, but target marks is ${paper.total_marks}.`);
        }
        const success = errors.length === 0;
        const status = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARNING' : 'PASS';
        // Log validation history log record
        await this.valRepo.logValidation(paperId, status, errors, warnings, userId);
        return {
            success,
            status,
            errors,
            warnings
        };
    }
}
exports.PaperValidationEngine = PaperValidationEngine;
exports.default = PaperValidationEngine;
