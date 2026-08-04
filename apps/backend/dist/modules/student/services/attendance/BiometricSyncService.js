"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BiometricSyncService = void 0;
class BiometricSyncService {
    constructor(biometricRepo, attendanceService, studentRepo, sessionService) {
        this.biometricRepo = biometricRepo;
        this.attendanceService = attendanceService;
        this.studentRepo = studentRepo;
        this.sessionService = sessionService;
    }
    async syncLogs(deviceCode) {
        const unprocessed = await this.biometricRepo.findUnprocessedLogs();
        if (unprocessed.length === 0)
            return 0;
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
                    const session = await this.sessionService.getOrCreateSession(student.schoolId, student.academicYearId, 'Grade 1', crypto.randomUUID(), // mock section
                    log.scanTimestamp, null);
                    await this.attendanceService.markAttendance(session.id, student.id, 'PRESENT', `Biometric check-in scan: device [${deviceCode}]`, null);
                    const processedLog = {
                        id: log.id,
                        deviceCode: log.deviceCode,
                        studentAdmissionNo: log.studentAdmissionNo,
                        scanTimestamp: log.scanTimestamp,
                        status: 'PROCESSED',
                        failureReason: null,
                        createdAt: log.createdAt
                    };
                    await this.biometricRepo.saveLog(processedLog);
                    count++;
                }
                else {
                    throw new Error('Student admission number not found');
                }
            }
            catch (err) {
                const failedLog = {
                    id: log.id,
                    deviceCode: log.deviceCode,
                    studentAdmissionNo: log.studentAdmissionNo,
                    scanTimestamp: log.scanTimestamp,
                    status: 'FAILED',
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
exports.BiometricSyncService = BiometricSyncService;
