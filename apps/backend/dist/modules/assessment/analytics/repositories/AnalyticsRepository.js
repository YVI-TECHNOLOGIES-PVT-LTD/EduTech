"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class AnalyticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_analytics_snapshots');
    }
    async saveSnapshot(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            snapshot_type: payload.snapshot_type,
            academic_year_id: payload.academic_year_id,
            payload: payload.payload
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async getSnapshots(schoolId, type) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId);
        if (type) {
            query = query.eq('snapshot_type', type);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
}
exports.AnalyticsRepository = AnalyticsRepository;
exports.default = AnalyticsRepository;
