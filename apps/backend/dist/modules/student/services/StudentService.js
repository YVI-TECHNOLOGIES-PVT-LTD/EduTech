"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const Student_1 = require("../domain/Student");
class StudentService {
    constructor(studentRepo, auditService) {
        this.studentRepo = studentRepo;
        this.auditService = auditService;
    }
    /**
     * Enrolls core student records and activates statuses.
     */
    async createStudent(payload, performedBy = null, correlationId) {
        const existing = await this.studentRepo.findByAdmissionNo(payload.admission_no);
        if (existing) {
            throw new Error(`Student with Admission Number ${payload.admission_no} already exists`);
        }
        const student = new Student_1.Student(crypto.randomUUID(), payload.user_id || null, payload.admission_no, payload.first_name, payload.last_name, 'NEW', payload.school_id, payload.academic_year_id, new Date(), new Date());
        await this.studentRepo.save(student);
        student.transitionStatus('ACTIVE');
        await this.studentRepo.save(student);
        await this.studentRepo.logStatusChange({
            student_id: student.id,
            old_status: 'NEW',
            new_status: 'ACTIVE',
            reason: 'Student master created post enrollment.',
            changed_by: performedBy
        });
        await this.auditService.logAudit({
            action: 'STUDENT_RECORD_CREATED',
            entityName: 'students',
            entityId: student.id,
            afterState: { admissionNo: student.admissionNo },
            userId: performedBy,
            correlationId
        });
        return student;
    }
    async getStudent(id) {
        return this.studentRepo.findById(id);
    }
    async listStudents(params) {
        return this.studentRepo.list(params);
    }
}
exports.StudentService = StudentService;
