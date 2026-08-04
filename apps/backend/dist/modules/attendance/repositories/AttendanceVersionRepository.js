"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceVersionRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendanceVersionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_record_versions');
    }
    async getRecordVersions(recordId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('attendance_record_id', recordId)
            .order('changed_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
}
exports.AttendanceVersionRepository = AttendanceVersionRepository;
exports.default = AttendanceVersionRepository;
