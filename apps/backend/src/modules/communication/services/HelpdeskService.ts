import prisma from '../../../lib/prismaClient';
import {
  helpdesk_ticket_type,
  helpdesk_priority,
  concern_status,
  helpdesk_message_type,
  helpdesk_history_action,
  helpdesk_history_actor_type,
} from '@prisma/client';

export interface CreateTicketDto {
  ticket_type: helpdesk_ticket_type;
  category_id: string;
  initial_description: string;
  priority?: helpdesk_priority;
  student_id?: string;
  requester_user_id?: string; // If created on behalf, staff passes parent/requester user id
}

export interface AddMessageDto {
  message_type: helpdesk_message_type;
  content: string;
  attachments?: {
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size_bytes: number;
  }[];
}

export class HelpdeskService {
  // ─── CATEGORIES ───────────────────────────────────────────────────────────

  public static async listCategories(orgId: string, onlyActive: boolean = true) {
    return await prisma.helpdesk_categories.findMany({
      where: {
        org_id: orgId,
        ...(onlyActive ? { is_active: true } : {}),
      },
      orderBy: { display_order: 'asc' },
    });
  }

  public static async createCategory(
    orgId: string,
    userId: string,
    data: { category_name: string; description?: string; display_order?: number },
  ) {
    const trimmed = data.category_name.trim();
    const existing = await prisma.helpdesk_categories.findFirst({
      where: {
        org_id: orgId,
        category_name: { equals: trimmed, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new Error(`Category '${trimmed}' already exists`);
    }

    return await prisma.helpdesk_categories.create({
      data: {
        org_id: orgId,
        category_name: trimmed,
        description: data.description?.trim() || null,
        display_order: data.display_order ?? 0,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  // ─── TICKETS ──────────────────────────────────────────────────────────────

  /**
   * Create a new ticket.
   * Atomically creates the ticket and inserts the first message with message_type = 'initial_description'.
   */
  public static async createTicket(orgId: string, creatorUserId: string, dto: CreateTicketDto) {
    // 1. Validate Category
    const category = await prisma.helpdesk_categories.findFirst({
      where: { category_id: dto.category_id, org_id: orgId, is_active: true },
    });
    if (!category) {
      throw new Error('Invalid or inactive helpdesk category');
    }

    // 2. Determine requester
    const requesterUserId = dto.requester_user_id || creatorUserId;

    // 3. Validate student if provided
    if (dto.student_id) {
      const student = await prisma.students.findFirst({
        where: { student_id: dto.student_id, org_id: orgId },
      });
      if (!student) {
        throw new Error('Student not found in this organization');
      }
    }

    const priority = dto.priority || 'normal';

    return await prisma.$transaction(async (tx) => {
      // 1. Create Ticket
      const ticket = await tx.helpdesk_tickets.create({
        data: {
          org_id: orgId,
          ticket_type: dto.ticket_type,
          requester_user_id: requesterUserId,
          created_by: creatorUserId,
          student_id: dto.student_id || null,
          category_id: dto.category_id,
          priority,
          status: 'open',
        },
      });

      // 2. Create Initial Description Message (mandatory first message)
      const initialMessage = await tx.helpdesk_messages.create({
        data: {
          org_id: orgId,
          ticket_id: ticket.ticket_id,
          author_user_id: creatorUserId,
          message_type: 'initial_description',
          content: dto.initial_description.trim(),
        },
      });

      // 3. Record Initial History Entry
      await tx.helpdesk_ticket_history.create({
        data: {
          org_id: orgId,
          ticket_id: ticket.ticket_id,
          action_type: 'status_changed',
          actor_type: 'user',
          action_by: creatorUserId,
          new_value: { status: 'open', priority },
          triggering_message_id: initialMessage.message_id,
        },
      });

      return {
        ...ticket,
        initial_message: initialMessage,
      };
    });
  }

  /**
   * List tickets with unified role-based scoping:
   * - Management (Administrator, Super Admin, Principal): full oversight across tenant.
   * - Teachers: class/section/academic-related tickets or assigned tickets.
   * - Finance: fees and billing inquiries or assigned tickets.
   * - Front Office: general parent inquiries, staff_on_behalf tickets, or assigned tickets.
   * - Parents: strictly limited to own tickets or linked children.
   */
  public static async listTickets(
    orgId: string,
    userContext: {
      userId: string;
      isStaff: boolean;
      isParent?: boolean;
      isManagement?: boolean;
      isTeacher?: boolean;
      isFinance?: boolean;
      isFrontOffice?: boolean;
    },
    query: {
      status?: concern_status;
      category_id?: string;
      priority?: helpdesk_priority;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = {
      org_id: orgId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.category_id ? { category_id: query.category_id } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    if (!userContext.isStaff) {
      // 1. Parent Experience: strictly scoped to own tickets or authorized linked students
      const linkedParents = await prisma.parents.findMany({
        where: { user_id: userContext.userId, org_id: orgId },
        select: {
          student_parents: {
            select: { student_id: true },
          },
        },
      });

      const studentIds = new Set<string>();
      for (const p of linkedParents) {
        for (const sp of p.student_parents) {
          studentIds.add(sp.student_id);
        }
      }

      where.OR = [
        { requester_user_id: userContext.userId },
        { student_id: { in: Array.from(studentIds) } },
      ];
    } else if (userContext.isManagement) {
      // 2. Management (Administrator, Super Admin, Principal):
      // Full institutional oversight across the school organization.
    } else if (userContext.isTeacher) {
      // 3. Teachers:
      // Scope to class/section/academic tickets + tickets assigned to/created by them
      const teacherStaff = await prisma.staff.findFirst({
        where: { user_id: userContext.userId, org_id: orgId },
        include: {
          sections: {
            include: {
              student_enrollments: {
                where: { status: 'active' },
                select: { student_id: true },
              },
            },
          },
        },
      });

      const sectionStudentIds: string[] = [];
      if (teacherStaff?.sections) {
        for (const sec of teacherStaff.sections) {
          for (const enr of sec.student_enrollments) {
            sectionStudentIds.push(enr.student_id);
          }
        }
      }

      const teacherOrConditions: any[] = [
        { assigned_to_user_id: userContext.userId },
        { requester_user_id: userContext.userId },
        { helpdesk_categories: { category_name: { in: ['Academics', 'Attendance'] } } },
      ];
      if (sectionStudentIds.length > 0) {
        teacherOrConditions.push({ student_id: { in: sectionStudentIds } });
      }
      where.OR = teacherOrConditions;
    } else if (userContext.isFinance) {
      // 4. Finance:
      // Scope to fees & payments inquiries + tickets assigned to/created by them
      where.OR = [
        { assigned_to_user_id: userContext.userId },
        { requester_user_id: userContext.userId },
        { helpdesk_categories: { category_name: { in: ['Fees & Payments', 'Fees'] } } },
      ];
    } else if (userContext.isFrontOffice) {
      // 5. Front Office:
      // Scope to general inquiries, admissions, documents, tickets raised on behalf of parents
      where.OR = [
        { assigned_to_user_id: userContext.userId },
        { requester_user_id: userContext.userId },
        { ticket_type: 'staff_on_behalf' },
        {
          helpdesk_categories: {
            category_name: {
              in: [
                'Admissions',
                'Documents',
                'Technical Support',
                'Facilities & Safety',
                'Staff & Administration',
                'Other',
              ],
            },
          },
        },
      ];
    } else {
      // Fallback staff boundary: assigned or created
      where.OR = [
        { assigned_to_user_id: userContext.userId },
        { requester_user_id: userContext.userId },
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.helpdesk_tickets.count({ where }),
      prisma.helpdesk_tickets.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          helpdesk_categories: {
            select: { category_id: true, category_name: true },
          },
          students: {
            select: { student_id: true, first_name: true, last_name: true, admission_no: true },
          },
          staff: {
            select: { staff_id: true, employee_code: true },
          },
        },
      }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ticket details by ID with messages filtered for parents (never exposes internal_note).
   */
  public static async getTicketById(
    orgId: string,
    ticketId: string,
    userContext: {
      userId: string;
      isStaff: boolean;
      isManagement?: boolean;
      isTeacher?: boolean;
      isFinance?: boolean;
      isFrontOffice?: boolean;
    },
  ) {
    const ticket = await prisma.helpdesk_tickets.findFirst({
      where: { ticket_id: ticketId, org_id: orgId },
      include: {
        helpdesk_categories: true,
        students: {
          select: { student_id: true, first_name: true, last_name: true, admission_no: true },
        },
        staff: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Role-based authorization verification
    if (!userContext.isStaff) {
      const isRequester = ticket.requester_user_id === userContext.userId;
      let isAuthorizedGuardian = false;

      if (ticket.student_id) {
        const guardianLink = await prisma.student_parents.findFirst({
          where: {
            student_id: ticket.student_id,
            parents: { user_id: userContext.userId, org_id: orgId },
          },
        });
        if (guardianLink) isAuthorizedGuardian = true;
      }

      if (!isRequester && !isAuthorizedGuardian) {
        throw new Error('Unauthorized to access this ticket');
      }
    } else if (userContext.isManagement) {
      // Management: authorized for all organization tickets
    } else {
      // Staff authorization boundary check
      const isAssigned = ticket.assigned_to_user_id === userContext.userId;
      const isRequester = ticket.requester_user_id === userContext.userId;
      const categoryName = ticket.helpdesk_categories?.category_name || '';

      let isRoleAuthorized = false;
      if (userContext.isTeacher) {
        if (['Academics', 'Attendance'].includes(categoryName)) isRoleAuthorized = true;
      } else if (userContext.isFinance) {
        if (['Fees & Payments', 'Fees'].includes(categoryName)) isRoleAuthorized = true;
      } else if (userContext.isFrontOffice) {
        if (
          ticket.ticket_type === 'staff_on_behalf' ||
          [
            'Admissions',
            'Documents',
            'Technical Support',
            'Facilities & Safety',
            'Staff & Administration',
            'Other',
          ].includes(categoryName)
        ) {
          isRoleAuthorized = true;
        }
      }

      if (!isAssigned && !isRequester && !isRoleAuthorized) {
        throw new Error('Unauthorized to access this ticket');
      }
    }

    // Messages: Filter out internal_note if user is not staff
    const messages = await prisma.helpdesk_messages.findMany({
      where: {
        ticket_id: ticketId,
        org_id: orgId,
        ...(!userContext.isStaff ? { message_type: { not: 'internal_note' } } : {}),
      },
      orderBy: { created_at: 'asc' },
      include: {
        helpdesk_attachments: {
          where: { removed_at: null },
        },
        users: {
          select: { user_id: true, first_name: true, last_name: true, email: true },
        },
      },
    });

    // History: Available for staff or filtered summary for parent
    const history = userContext.isStaff
      ? await prisma.helpdesk_ticket_history.findMany({
          where: { ticket_id: ticketId, org_id: orgId },
          orderBy: { action_at: 'desc' },
        })
      : [];

    return {
      ticket,
      messages,
      history,
    };
  }

  /**
   * Transition ticket status (open -> in_progress -> waiting_for_parent -> resolved -> closed).
   * Transactionally records history.
   */
  public static async updateTicketStatus(
    orgId: string,
    ticketId: string,
    userId: string,
    newStatus: concern_status,
    remarks?: string,
  ) {
    const existing = await prisma.helpdesk_tickets.findFirst({
      where: { ticket_id: ticketId, org_id: orgId },
    });

    if (!existing) {
      throw new Error('Ticket not found');
    }

    const resolvedAt = newStatus === 'resolved' ? new Date() : existing.resolved_at;
    const closedAt = newStatus === 'closed' ? new Date() : existing.closed_at;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.helpdesk_tickets.update({
        where: { ticket_id: ticketId },
        data: {
          status: newStatus,
          resolved_at: resolvedAt,
          closed_at: closedAt,
          updated_at: new Date(),
        },
      });

      await tx.helpdesk_ticket_history.create({
        data: {
          org_id: orgId,
          ticket_id: ticketId,
          action_type: 'status_changed',
          actor_type: 'user',
          action_by: userId,
          old_value: { status: existing.status },
          new_value: { status: newStatus, remarks: remarks || null },
        },
      });

      return updated;
    });
  }

  /**
   * Assign or reassign ticket to a staff member.
   * Transactionally records assignment history.
   */
  public static async assignTicket(
    orgId: string,
    ticketId: string,
    actionByUserId: string,
    assignedToUserId: string,
  ) {
    const existing = await prisma.helpdesk_tickets.findFirst({
      where: { ticket_id: ticketId, org_id: orgId },
    });

    if (!existing) {
      throw new Error('Ticket not found');
    }

    // Verify staff exists in organization
    const staff = await prisma.staff.findFirst({
      where: { user_id: assignedToUserId, org_id: orgId, is_active: true },
    });

    if (!staff) {
      throw new Error('Assigned user is not an active staff member in this organization');
    }

    const isReassignment = Boolean(existing.assigned_to_user_id);
    const actionType: helpdesk_history_action = isReassignment ? 'reassigned' : 'assigned';

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.helpdesk_tickets.update({
        where: { ticket_id: ticketId },
        data: {
          assigned_to_user_id: assignedToUserId,
          updated_at: new Date(),
        },
      });

      await tx.helpdesk_ticket_history.create({
        data: {
          org_id: orgId,
          ticket_id: ticketId,
          action_type: actionType,
          actor_type: 'user',
          action_by: actionByUserId,
          recipient_user_id: assignedToUserId,
          old_value: { assigned_to_user_id: existing.assigned_to_user_id },
          new_value: { assigned_to_user_id: assignedToUserId },
        },
      });

      return updated;
    });
  }

  // ─── MESSAGES & ATTACHMENTS ───────────────────────────────────────────────

  /**
   * Add a conversation message (public_reply or internal_note).
   * Internal notes are strictly prohibited for non-staff roles.
   */
  public static async addMessage(
    orgId: string,
    ticketId: string,
    authorUserId: string,
    isStaff: boolean,
    dto: AddMessageDto,
  ) {
    if (dto.message_type === 'internal_note' && !isStaff) {
      throw new Error('Only staff members can post internal notes');
    }

    const ticket = await prisma.helpdesk_tickets.findFirst({
      where: { ticket_id: ticketId, org_id: orgId },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'closed') {
      throw new Error('Cannot add messages to a closed ticket');
    }

    return await prisma.$transaction(async (tx) => {
      const message = await tx.helpdesk_messages.create({
        data: {
          org_id: orgId,
          ticket_id: ticketId,
          author_user_id: authorUserId,
          message_type: dto.message_type,
          content: dto.content.trim(),
        },
      });

      // Handle attachments if provided
      if (dto.attachments && dto.attachments.length > 0) {
        await tx.helpdesk_attachments.createMany({
          data: dto.attachments.map((att) => ({
            org_id: orgId,
            message_id: message.message_id,
            file_name: att.file_name,
            file_path: att.file_path,
            mime_type: att.mime_type,
            file_size_bytes: BigInt(att.file_size_bytes),
            uploaded_by: authorUserId,
          })),
        });
      }

      // If parent replies, move from waiting_for_parent to in_progress
      if (!isStaff && ticket.status === 'waiting_for_parent') {
        await tx.helpdesk_tickets.update({
          where: { ticket_id: ticketId },
          data: { status: 'in_progress', updated_at: new Date() },
        });
      }

      return message;
    });
  }
}
