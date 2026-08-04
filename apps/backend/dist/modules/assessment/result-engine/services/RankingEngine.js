"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const RankingRepository_1 = require("../repositories/RankingRepository");
const StudentResultRepository_1 = require("../repositories/StudentResultRepository");
class RankingEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new RankingRepository_1.RankingRepository();
        this.studentResultsRepo = new StudentResultRepository_1.StudentResultRepository();
    }
    async calculateCohortRankings(sessionId, correlationId) {
        this.logInfo(`Running ranking engine for session cohort: ${sessionId}`, correlationId);
        const results = await this.studentResultsRepo.listResultsBySession(sessionId);
        // Sort students desc by CGPA
        const sorted = [...results].sort((a, b) => Number(b.cgpa) - Number(a.cgpa));
        for (let idx = 0; idx < sorted.length; idx++) {
            const item = sorted[idx];
            await this.repo.saveStudentRank(sessionId, item.student_id, item.cgpa, idx + 1);
        }
    }
}
exports.RankingEngine = RankingEngine;
exports.default = RankingEngine;
