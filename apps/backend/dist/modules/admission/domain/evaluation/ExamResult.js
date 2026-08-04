"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamResult = void 0;
class ExamResult {
    constructor(id, candidateId, subjectId, marksObtained, percentage, pass, evaluatorId, createdAt, updatedAt) {
        this.id = id;
        this.candidateId = candidateId;
        this.subjectId = subjectId;
        this.marksObtained = marksObtained;
        this.percentage = percentage;
        this.pass = pass;
        this.evaluatorId = evaluatorId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.ExamResult = ExamResult;
