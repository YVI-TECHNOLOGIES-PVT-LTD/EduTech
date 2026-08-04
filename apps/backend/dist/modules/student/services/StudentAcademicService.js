"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAcademicService = void 0;
class StudentAcademicService {
    constructor(academicRepo) {
        this.academicRepo = academicRepo;
    }
    async getAcademicRecords(studentId) {
        return this.academicRepo.findRecords(studentId);
    }
}
exports.StudentAcademicService = StudentAcademicService;
