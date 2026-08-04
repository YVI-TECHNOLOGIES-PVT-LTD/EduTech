"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperStatisticsService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class PaperStatisticsService extends BaseService_1.BaseService {
    async getMetrics(schoolId, correlationId) {
        this.logInfo(`Resolving generation analytics for school: ${schoolId}`, correlationId);
        const { data, error } = await supabase_1.supabase
            .from('assessment_generated_papers')
            .select('status')
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
        if (error)
            throw error;
        const total = data.length;
        const generated = data.filter(p => p.status === 'GENERATED').length;
        const published = data.filter(p => p.status === 'PUBLISHED').length;
        // Locks check count
        const { count: locksCount } = await supabase_1.supabase
            .from('assessment_generation_locks')
            .select('*', { count: 'exact', head: true })
            .gt('expires_at', new Date().toISOString());
        return {
            totalPapers: total,
            statusDistribution: {
                GENERATED: generated,
                PUBLISHED: published
            },
            activeLocks: locksCount || 0
        };
    }
}
exports.PaperStatisticsService = PaperStatisticsService;
exports.default = PaperStatisticsService;
