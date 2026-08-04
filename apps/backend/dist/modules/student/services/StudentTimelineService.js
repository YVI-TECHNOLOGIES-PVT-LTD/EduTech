"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentTimelineService = void 0;
class StudentTimelineService {
    constructor(studentRepo) {
        this.studentRepo = studentRepo;
    }
    async getTimeline(studentId) {
        return this.studentRepo.findTimeline(studentId);
    }
}
exports.StudentTimelineService = StudentTimelineService;
