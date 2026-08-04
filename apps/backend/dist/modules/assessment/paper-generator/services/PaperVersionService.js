"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperVersionService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class PaperVersionService extends BaseService_1.BaseService {
    async getHistory(paperId, correlationId) {
        this.logInfo(`Resolving version snapshots for paper: ${paperId}`, correlationId);
        const { data, error } = await supabase_1.supabase
            .from('assessment_generated_versions')
            .select('*')
            .eq('paper_id', paperId)
            .order('version', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
}
exports.PaperVersionService = PaperVersionService;
exports.default = PaperVersionService;
