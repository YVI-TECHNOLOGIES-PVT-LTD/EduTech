"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricRepository = void 0;
const BiometricLog_1 = require("../../domain/attendance/BiometricLog");
const supabase_1 = require("../../../../config/supabase");
class BiometricRepository {
    async findUnprocessedLogs() {
        const { data, error } = await supabase_1.supabase
            .from('student_biometric_logs')
            .select('*')
            .eq('status', 'UNPROCESSED')
            .order('scan_timestamp', { ascending: true });
        if (error)
            throw error;
        return (data || []).map((row) => new BiometricLog_1.BiometricLog(row.id, row.device_code, row.student_admission_no, new Date(row.scan_timestamp), row.status, row.failure_reason, new Date(row.created_at)));
    }
    async saveLog(log) {
        const { error } = await supabase_1.supabase
            .from('student_biometric_logs')
            .upsert({
            id: log.id,
            device_code: log.deviceCode,
            student_admission_no: log.studentAdmissionNo,
            scan_timestamp: log.scanTimestamp.toISOString(),
            status: log.status,
            failure_reason: log.failureReason
        });
        if (error)
            throw error;
    }
    async saveDevice(device) {
        const { error } = await supabase_1.supabase
            .from('student_biometric_devices')
            .upsert(device);
        if (error)
            throw error;
    }
    async saveSyncJob(job) {
        const { error } = await supabase_1.supabase
            .from('student_attendance_sync_jobs')
            .upsert({
            id: job.id,
            device_code: job.deviceCode,
            started_at: job.startedAt ? job.startedAt.toISOString() : null,
            completed_at: job.completedAt ? job.completedAt.toISOString() : null,
            records_processed: job.recordsProcessed,
            status: job.status
        });
        if (error)
            throw error;
    }
}
exports.BiometricRepository = BiometricRepository;
