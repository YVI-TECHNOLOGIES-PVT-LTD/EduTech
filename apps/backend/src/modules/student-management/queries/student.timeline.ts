import prisma from '../../../lib/prismaClient';
import { StudentTimelineDto, StudentTimelineEventDto } from '../dto/response/student-timeline.dto';

const db: any = prisma;

export class StudentTimelineQuery {
  static async execute(studentId: string): Promise<StudentTimelineDto> {
    const student = await db.students.findUnique({
      where: { student_id: studentId },
      include: {
        student_enrollments: {
          include: { sections: true },
        },
        student_parents: {
          include: {
            parents: {
              include: { users_parents_user_idTousers: true },
            },
          },
        },
      },
    });

    if (!student) {
      return { student_id: studentId, timeline: [] };
    }

    const timeline: StudentTimelineEventDto[] = [];

    // 1. Student Profile Creation
    if (student.created_at) {
      timeline.push({
        id: `created-${student.student_id}`,
        type: 'STUDENT_CREATED',
        title: 'Student Profile Created',
        description:
          `Admission No: ${student.admission_no} (${student.first_name} ${student.last_name || ''})`.trim(),
        performed_by: student.created_by || null,
        timestamp: new Date(student.created_at).toISOString(),
      });
    }

    // 2. Enrollments & Section Assignments
    for (const enr of student.student_enrollments || []) {
      if (enr.enrollment_date || enr.created_at) {
        timeline.push({
          id: `enr-${enr.enrollment_id}`,
          type: 'ENROLLMENT_RECORDED',
          title: `Academic Enrollment (${enr.status})`,
          description: `Roll Number: ${enr.roll_number || 'N/A'} | Section: ${enr.sections?.section_name || 'Unassigned'}`,
          performed_by: enr.created_by || null,
          timestamp: new Date(enr.enrollment_date || enr.created_at).toISOString(),
        });
      }
      if (enr.section_id && enr.updated_at) {
        timeline.push({
          id: `sec-${enr.enrollment_id}`,
          type: 'SECTION_ASSIGNED',
          title: 'Section Assigned',
          description: `Section: ${enr.sections?.section_name || enr.section_id} | Roll No: ${enr.roll_number || 'N/A'}`,
          performed_by: enr.updated_by || null,
          timestamp: new Date(enr.updated_at).toISOString(),
        });
      }
    }

    // 3. Parent Linkage
    for (const sp of student.student_parents || []) {
      if (sp.created_at) {
        const parentName = [
          sp.parents?.users_parents_user_idTousers?.first_name,
          sp.parents?.users_parents_user_idTousers?.last_name,
        ]
          .filter(Boolean)
          .join(' ');
        timeline.push({
          id: `parent-${sp.parent_id}`,
          type: 'PARENT_LINKED',
          title: `Parent Linked (${sp.relationship})`,
          description: `Parent: ${parentName || sp.parent_id} | Primary: ${sp.is_primary_contact ? 'Yes' : 'No'}`,
          performed_by: sp.created_by || null,
          timestamp: new Date(sp.created_at).toISOString(),
        });
      }
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      student_id: studentId,
      timeline,
    };
  }
}
