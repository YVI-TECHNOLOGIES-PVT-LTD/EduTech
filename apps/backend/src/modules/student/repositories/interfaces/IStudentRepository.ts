import { Student } from '../../domain/Student';
import { StudentProfile } from '../../domain/StudentProfile';
import { StudentParent } from '../../domain/StudentParent';

export interface IStudentRepository {
    findById(id: string): Promise<Student | null>;
    findByAdmissionNo(admissionNo: string): Promise<Student | null>;
    save(student: Student): Promise<void>;
    
    findProfile(studentId: string): Promise<StudentProfile | null>;
    saveProfile(profile: StudentProfile): Promise<void>;
    
    findParents(studentId: string): Promise<StudentParent[]>;
    saveParent(parent: StudentParent): Promise<void>;

    list(params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        grade?: string;
        section?: string;
        academic_year?: string;
        school_id: string | null;
    }): Promise<{ data: any[]; total: number }>;
}
