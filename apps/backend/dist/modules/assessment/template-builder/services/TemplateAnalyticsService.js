"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateAnalyticsService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class TemplateAnalyticsService extends BaseService_1.BaseService {
    async getMetrics(schoolId, correlationId) {
        this.logInfo(`Resolving template builder metrics for school: ${schoolId}`, correlationId);
        const { data, error } = await supabase_1.supabase
            .from('assessment_templates')
            .select('status, subject_id')
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
        if (error)
            throw error;
        const draft = data.filter(t => t.status === 'DRAFT').length;
        const review = data.filter(t => t.status === 'UNDER_REVIEW').length;
        const approved = data.filter(t => t.status === 'APPROVED').length;
        const published = data.filter(t => t.status === 'PUBLISHED').length;
        return {
            totalTemplates: data.length,
            statusDistribution: {
                DRAFT: draft,
                UNDER_REVIEW: review,
                APPROVED: approved,
                PUBLISHED: published
            }
        };
    }
}
exports.TemplateAnalyticsService = TemplateAnalyticsService;
exports.default = TemplateAnalyticsService;
