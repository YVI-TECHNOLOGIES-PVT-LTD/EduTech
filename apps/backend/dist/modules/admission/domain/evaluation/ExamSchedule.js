"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSchedule = void 0;
class ExamSchedule {
    constructor(id, templateId, schoolId, academicYearId, roomName, invigilatorName, examDate, status, createdAt, updatedAt) {
        this.id = id;
        this.templateId = templateId;
        this.schoolId = schoolId;
        this.academicYearId = academicYearId;
        this.roomName = roomName;
        this.invigilatorName = invigilatorName;
        this.examDate = examDate;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    transition(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
exports.ExamSchedule = ExamSchedule;
