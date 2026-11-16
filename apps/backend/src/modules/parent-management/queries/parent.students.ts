import { ParentStudentRepository } from '../repositories/parent.student.repository';

export class ParentStudentsQuery {
  static async getStudentsByParentId(parentId: string) {
    return ParentStudentRepository.findStudentsByParentId(parentId);
  }
}
