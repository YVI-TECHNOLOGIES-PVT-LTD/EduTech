"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccreditationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class AccreditationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_accreditation_reports');
    }
    async saveReport(schoolId, payload, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            report_type: payload.report_type,
            attainment_metrics_json: payload.attainment_metrics_json,
            generated_by: userId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AccreditationRepository = AccreditationRepository;
exports.default = AccreditationRepository;
