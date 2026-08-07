import prisma from '../../../lib/prismaClient';
import { LinkParentDto } from '../dto/request/link-parent.dto';

const db: any = prisma;

export class StudentParentRepository {
  static async linkParent(studentId: string, createdBy: string | null, dto: LinkParentDto) {
    return db.student_parents.upsert({
      where: {
        student_id_parent_id: {
          student_id: studentId,
          parent_id: dto.parent_id,
        },
      },
      update: {
        relationship: dto.relationship,
        is_primary_contact: dto.is_primary_contact || false,
        updated_at: new Date(),
      },
      create: {
        student_id: studentId,
        parent_id: dto.parent_id,
        relationship: dto.relationship,
        is_primary_contact: dto.is_primary_contact || false,
        created_by: createdBy || undefined,
      },
      include: {
        parents: {
          include: {
            users_parents_user_idTousers: true,
          },
        },
      },
    });
  }

  static async unlinkParent(student_id: string, parent_id: string) {
    return db.student_parents.delete({
      where: {
        student_id_parent_id: {
          student_id,
          parent_id,
        },
      },
    });
  }

  static async findParentsByStudentId(student_id: string) {
    return db.student_parents.findMany({
      where: { student_id },
      include: {
        parents: {
          include: {
            users_parents_user_idTousers: true,
          },
        },
      },
    });
  }
}
