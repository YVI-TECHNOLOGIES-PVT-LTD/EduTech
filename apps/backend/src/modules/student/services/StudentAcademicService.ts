import { AcademicRepository } from '../repositories/AcademicRepository';
import { StudentAcademicRecord } from '../domain/StudentAcademicRecord';

export class StudentAcademicService {
    constructor(private readonly academicRepo: AcademicRepository) {}

    public async getAcademicRecords(studentId: string): Promise<StudentAcademicRecord[]> {
        return this.academicRepo.findRecords(studentId);
    }
}
