"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicSnapshotService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
const crypto_1 = require("crypto");
class AcademicSnapshotService extends BaseService_1.BaseService {
    async captureSnapshot(academicRecordId, payload) {
        const jsonStr = JSON.stringify(payload);
        const signedHash = (0, crypto_1.createHash)('sha256').update(jsonStr).digest('hex');
        const { data, error } = await supabase_1.supabase
            .from('student_academic_record_snapshots')
            .insert({
            academic_record_id: academicRecordId,
            snapshot_json: payload,
            snapshot_hash: signedHash
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AcademicSnapshotService = AcademicSnapshotService;
exports.default = AcademicSnapshotService;
