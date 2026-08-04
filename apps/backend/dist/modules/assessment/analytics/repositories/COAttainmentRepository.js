"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COAttainmentRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class COAttainmentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_co_attainment');
    }
    async saveCoAttainment(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            subject_id: payload.subject_id,
            co_code: payload.co_code,
            attainment_target_pct: payload.attainment_target_pct,
            actual_attainment_pct: payload.actual_attainment_pct,
            status: payload.status
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.COAttainmentRepository = COAttainmentRepository;
exports.default = COAttainmentRepository;
