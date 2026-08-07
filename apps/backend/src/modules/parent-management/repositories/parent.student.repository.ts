import prisma from '../../../lib/prismaClient';
import { LinkStudentDto } from '../dto/request/link-student.dto';

const db: any = prisma;

export class ParentStudentRepository {
  static async linkStudent(parentId: string, createdBy: string | null, dto: LinkStudentDto) {
    return db.student_parents.upsert({
      where: {
        student_id_parent_id: {
          student_id: dto.student_id,
          parent_id: parentId,
        },
      },
      update: {
        relationship: dto.relationship,
        is_primary_contact: dto.is_primary_contact || false,
        updated_at: new Date(),
      },
      create: {
        student_id: dto.student_id,
        parent_id: parentId,
        relationship: dto.relationship,
        is_primary_contact: dto.is_primary_contact || false,
        created_by: createdBy || undefined,
      },
      include: {
        students: true,
      },
    });
  }

  static async unlinkStudent(parent_id: string, student_id: string) {
    return db.student_parents.delete({
      where: {
        student_id_parent_id: {
          student_id,
          parent_id,
        },
      },
    });
  }

  static async findStudentsByParentId(parent_id: string) {
    return db.student_parents.findMany({
      where: { parent_id },
      include: {
        students: true,
      },
    });
  }
}
