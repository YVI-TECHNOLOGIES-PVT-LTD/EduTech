import { BiometricRepository } from '../../repositories/attendance/BiometricRepository';
import { AttendanceService } from './AttendanceService';
import { StudentRepository } from '../../repositories/StudentRepository';
import { AttendanceSessionService } from './AttendanceSessionService';

export class BiometricSyncService {
    constructor(
        private readonly biometricRepo: BiometricRepository,
        private readonly attendanceService: AttendanceService,
        private readonly studentRepo: StudentRepository,
        private readonly sessionService: AttendanceSessionService
    ) {}

    public async syncLogs(deviceCode: string): Promise<number> {
        const unprocessed = await this.biometricRepo.findUnprocessedLogs();
        if (unprocessed.length === 0) return 0;

        const jobId = crypto.randomUUID();
        await this.biometricRepo.saveSyncJob({
            id: jobId,
            deviceCode,
            startedAt: new Date(),
            completedAt: null,
            recordsProcessed: 0,
            status: 'RUNNING'
        });

        let count = 0;
        for (const log of unprocessed) {
            try {
                const student = await this.studentRepo.findByAdmissionNo(log.studentAdmissionNo);
                if (student) {
                    const session = await this.sessionService.getOrCreateSession(
                        student.schoolId,
                        student.academicYearId,
                        'Grade 1',
                        crypto.randomUUID(), // mock section
                        log.scanTimestamp,
                        null
                    );

                    await this.attendanceService.markAttendance(
                        session.id,
                        student.id,
                        'PRESENT',
                        `Biometric check-in scan: device [${deviceCode}]`,
                        null
                    );

                    const processedLog = {
                        id: log.id,
                        deviceCode: log.deviceCode,
                        studentAdmissionNo: log.studentAdmissionNo,
                        scanTimestamp: log.scanTimestamp,
                        status: 'PROCESSED' as any,
                        failureReason: null,
                        createdAt: log.createdAt
                    };
                    await this.biometricRepo.saveLog(processedLog);
                    count++;
                } else {
                    throw new Error('Student admission number not found');
                }
            } catch (err: any) {
                const failedLog = {
                    id: log.id,
                    deviceCode: log.deviceCode,
                    studentAdmissionNo: log.studentAdmissionNo,
                    scanTimestamp: log.scanTimestamp,
                    status: 'FAILED' as any,
                    failureReason: err.message || 'Sync failed',
                    createdAt: log.createdAt
                };
                await this.biometricRepo.saveLog(failedLog);
            }
        }

        await this.biometricRepo.saveSyncJob({
            id: jobId,
            deviceCode,
            startedAt: null,
            completedAt: new Date(),
            recordsProcessed: count,
            status: 'COMPLETED'
        });

        return count;
    }
}
