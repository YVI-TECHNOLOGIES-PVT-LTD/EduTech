"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintAnalyticsService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const BlueprintAnalyticsRepository_1 = require("../repositories/BlueprintAnalyticsRepository");
class BlueprintAnalyticsService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.analyticsRepo = new BlueprintAnalyticsRepository_1.BlueprintAnalyticsRepository();
    }
    async getMetrics(schoolId, correlationId) {
        this.logInfo(`Resolving blueprints metrics for school: ${schoolId}`, correlationId);
        const data = await this.analyticsRepo.getBlueprintStats(schoolId);
        const draft = data.filter(b => b.status === 'DRAFT').length;
        const review = data.filter(b => b.status === 'UNDER_REVIEW').length;
        const approved = data.filter(b => b.status === 'APPROVED').length;
        const published = data.filter(b => b.status === 'PUBLISHED').length;
        // Group by subject counts
        const subjectCounts = {};
        for (const item of data) {
            subjectCounts[item.subject_id] = (subjectCounts[item.subject_id] || 0) + 1;
        }
        return {
            totalBlueprints: data.length,
            statusDistribution: {
                DRAFT: draft,
                UNDER_REVIEW: review,
                APPROVED: approved,
                PUBLISHED: published
            },
            subjectDistribution: subjectCounts
        };
    }
}
exports.BlueprintAnalyticsService = BlueprintAnalyticsService;
exports.default = BlueprintAnalyticsService;
