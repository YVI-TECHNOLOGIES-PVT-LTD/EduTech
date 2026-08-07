import prisma from '../../../lib/prismaClient';
import { ParentTimelineDto, ParentTimelineEventDto } from '../dto/response/parent-timeline.dto';

const db: any = prisma;

export class ParentTimelineQuery {
  static async execute(parentId: string): Promise<ParentTimelineDto> {
    const parent = await db.parents.findUnique({
      where: { parent_id: parentId },
      include: {
        student_parents: {
          include: { students: true },
        },
      },
    });

    if (!parent) {
      return { parent_id: parentId, timeline: [] };
    }

    const timeline: ParentTimelineEventDto[] = [];

    // 1. Parent Profile Creation
    if (parent.created_at) {
      timeline.push({
        id: `created-${parent.parent_id}`,
        type: 'PARENT_CREATED',
        title: 'Parent Profile Created',
        description:
          `Name: ${parent.first_name} ${parent.last_name || ''} | Phone: ${parent.phone}`.trim(),
        performed_by: parent.created_by || null,
        timestamp: new Date(parent.created_at).toISOString(),
      });
    }

    // 2. Parent Profile Updates
    if (
      parent.updated_at &&
      parent.created_at &&
      new Date(parent.updated_at).getTime() > new Date(parent.created_at).getTime() + 1000
    ) {
      timeline.push({
        id: `updated-${parent.parent_id}-${new Date(parent.updated_at).getTime()}`,
        type: 'PARENT_UPDATED',
        title: 'Parent Profile Updated',
        description: `Occupation: ${parent.occupation || 'N/A'} | Email: ${parent.email || 'N/A'}`,
        performed_by: parent.updated_by || null,
        timestamp: new Date(parent.updated_at).toISOString(),
      });
    }

    // 3. Student Linkage Events
    for (const sp of parent.student_parents || []) {
      if (sp.created_at) {
        const studentName = sp.students
          ? [sp.students.first_name, sp.students.last_name].filter(Boolean).join(' ')
          : sp.student_id;
        timeline.push({
          id: `student-${sp.student_id}`,
          type: 'STUDENT_LINKED',
          title: `Student Linked (${sp.relationship})`,
          description: `Student: ${studentName} | Primary Contact: ${sp.is_primary_contact ? 'Yes' : 'No'}`,
          performed_by: sp.created_by || null,
          timestamp: new Date(sp.created_at).toISOString(),
        });
      }
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      parent_id: parentId,
      timeline,
    };
  }
}
