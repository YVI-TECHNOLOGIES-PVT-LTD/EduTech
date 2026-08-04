"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamTemplate = void 0;
class ExamTemplate {
    constructor(id, name, grade, duration, totalMarks, passingMarks, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.grade = grade;
        this.duration = duration;
        this.totalMarks = totalMarks;
        this.passingMarks = passingMarks;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.ExamTemplate = ExamTemplate;
