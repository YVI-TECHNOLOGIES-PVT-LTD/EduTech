"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POAttainmentRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class POAttainmentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_po_attainment');
    }
    async savePoAttainment(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            po_code: payload.po_code,
            attainment_score: payload.attainment_score,
            target_score: payload.target_score
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.POAttainmentRepository = POAttainmentRepository;
exports.default = POAttainmentRepository;
