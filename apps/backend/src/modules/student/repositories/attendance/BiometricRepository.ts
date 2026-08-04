import { BiometricLog } from '../../domain/attendance/BiometricLog';
import { supabase } from '../../../../config/supabase';

export class BiometricRepository {
    public async findUnprocessedLogs(): Promise<BiometricLog[]> {
        const { data, error } = await supabase
            .from('student_biometric_logs')
            .select('*')
            .eq('status', 'UNPROCESSED')
            .order('scan_timestamp', { ascending: true });

        if (error) throw error;
        return (data || []).map((row: any) => new BiometricLog(
            row.id,
            row.device_code,
            row.student_admission_no,
            new Date(row.scan_timestamp),
            row.status as any,
            row.failure_reason,
            new Date(row.created_at)
        ));
    }

    public async saveLog(log: BiometricLog): Promise<void> {
        const { error } = await supabase
            .from('student_biometric_logs')
            .upsert({
                id: log.id,
                device_code: log.deviceCode,
                student_admission_no: log.studentAdmissionNo,
                scan_timestamp: log.scanTimestamp.toISOString(),
                status: log.status,
                failure_reason: log.failureReason
            });

        if (error) throw error;
    }

    public async saveDevice(device: any): Promise<void> {
        const { error } = await supabase
            .from('student_biometric_devices')
            .upsert(device);

        if (error) throw error;
    }

    public async saveSyncJob(job: any): Promise<void> {
        const { error } = await supabase
            .from('student_attendance_sync_jobs')
            .upsert({
                id: job.id,
                device_code: job.deviceCode,
                started_at: job.startedAt ? job.startedAt.toISOString() : null,
                completed_at: job.completedAt ? job.completedAt.toISOString() : null,
                records_processed: job.recordsProcessed,
                status: job.status
            });

        if (error) throw error;
    }
}
