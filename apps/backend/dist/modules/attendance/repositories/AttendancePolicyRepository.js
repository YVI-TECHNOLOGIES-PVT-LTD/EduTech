"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancePolicyRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendancePolicyRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_policies');
    }
    async getPolicy(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        if (data)
            return data;
        // Default seed
        const { data: seeded, error: seedErr } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            minimum_percentage: 75.00,
            late_threshold_minutes: 15,
            condonation_limit: 5
        })
            .select()
            .single();
        if (seedErr)
            throw seedErr;
        return seeded;
    }
}
exports.AttendancePolicyRepository = AttendancePolicyRepository;
exports.default = AttendancePolicyRepository;
