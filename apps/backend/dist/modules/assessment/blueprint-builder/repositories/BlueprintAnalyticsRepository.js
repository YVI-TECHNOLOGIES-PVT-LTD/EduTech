"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintAnalyticsRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class BlueprintAnalyticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_blueprints');
    }
    async getBlueprintStats(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('status, subject_id, total_marks')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        return data || [];
    }
}
exports.BlueprintAnalyticsRepository = BlueprintAnalyticsRepository;
exports.default = BlueprintAnalyticsRepository;
