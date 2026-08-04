import { StudentRepository } from '../repositories/StudentRepository';

export class StudentTimelineService {
    constructor(private readonly studentRepo: StudentRepository) {}

    public async getTimeline(studentId: string): Promise<any[]> {
        return this.studentRepo.findTimeline(studentId);
    }
}
