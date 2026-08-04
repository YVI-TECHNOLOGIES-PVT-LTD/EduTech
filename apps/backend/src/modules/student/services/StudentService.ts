import { StudentRepository } from '../repositories/StudentRepository';
import { Student } from '../domain/Student';
import { AuditService } from '../../admission/services/AuditService';

export class StudentService {
    constructor(
        private readonly studentRepo: StudentRepository,
        private readonly auditService: AuditService
    ) {}

    /**
     * Enrolls core student records and activates statuses.
     */
    public async createStudent(
        payload: {
            admission_no: string;
            first_name: string;
            last_name: string;
            school_id: string;
            academic_year_id: string;
            user_id?: string;
        },
        performedBy: string | null = null,
        correlationId?: string
    ): Promise<Student> {
        const existing = await this.studentRepo.findByAdmissionNo(payload.admission_no);
        if (existing) {
            throw new Error(`Student with Admission Number ${payload.admission_no} already exists`);
        }

        const student = new Student(
            crypto.randomUUID(),
            payload.user_id || null,
            payload.admission_no,
            payload.first_name,
            payload.last_name,
            'NEW',
            payload.school_id,
            payload.academic_year_id,
            new Date(),
            new Date()
        );
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

    public async getStudent(id: string): Promise<Student | null> {
        return this.studentRepo.findById(id);
    }

    public async listStudents(params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        grade?: string;
        section?: string;
        academic_year?: string;
        school_id: string | null;
    }) {
        return this.studentRepo.list(params);
    }
}
