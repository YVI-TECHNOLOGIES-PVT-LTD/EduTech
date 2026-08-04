"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationAnalyticsService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class EvaluationAnalyticsService extends BaseService_1.BaseService {
    async getDashboardMetrics(schoolId, correlationId) {
        this.logInfo(`Resolving dashboard metrics for school: ${schoolId}`, correlationId);
        const { data: sessions, error } = await supabase_1.supabase
            .from('assessment_evaluation_sessions')
            .select('status')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        const total = sessions?.length || 0;
        const finalized = sessions?.filter(s => s.status === 'FINALIZED' || s.status === 'LOCKED').length || 0;
        const pending = total - finalized;
        return {
            totalScripts: total,
            finalizedScripts: finalized,
            pendingScripts: pending,
            completionRatePct: total > 0 ? (finalized / total) * 100.00 : 0.00
        };
    }
}
exports.EvaluationAnalyticsService = EvaluationAnalyticsService;
exports.default = EvaluationAnalyticsService;
