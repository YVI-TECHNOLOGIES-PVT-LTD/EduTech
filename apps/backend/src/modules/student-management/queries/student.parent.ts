import { StudentParentRepository } from '../repositories/student.parent.repository';

export class StudentParentQuery {
  static async getParentsByStudentId(studentId: string) {
    return StudentParentRepository.findParentsByStudentId(studentId);
  }
}
