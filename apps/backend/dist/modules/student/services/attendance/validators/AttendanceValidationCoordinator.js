"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceValidationCoordinator = void 0;
class AttendanceValidationCoordinator {
    constructor(studentVal, attendanceVal, sessionVal, leaveVal, holidayVal, correctionVal, biometricVal) {
        this.studentVal = studentVal;
        this.attendanceVal = attendanceVal;
        this.sessionVal = sessionVal;
        this.leaveVal = leaveVal;
        this.holidayVal = holidayVal;
        this.correctionVal = correctionVal;
        this.biometricVal = biometricVal;
    }
    async validateDailyMarking(studentId, schoolId, date, sessionId) {
        await this.studentVal.validate(studentId);
        await this.holidayVal.validateWorkingDay(schoolId, date);
        await this.attendanceVal.validateDuplicate(studentId, sessionId);
    }
    async validateLeaveApplication(studentId, leaveTypeId, requestedDays) {
        await this.studentVal.validate(studentId);
        await this.leaveVal.validateBalance(studentId, leaveTypeId, requestedDays);
    }
}
exports.AttendanceValidationCoordinator = AttendanceValidationCoordinator;
