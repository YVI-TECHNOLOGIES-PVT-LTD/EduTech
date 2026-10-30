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
  ticket_type?: helpdesk_ticket_type;
  category_id: string;
  title?: string;
  initial_description?: string;
  description?: string;
  priority?: helpdesk_priority;
  student_id?: string;
  requester_user_id?: string; // If created on behalf, staff passes parent/requester user id
  attachments?: {
    file_name: string;
    file_path: string;
    mime_type: string;
    file_size_bytes: number;
  }[];
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
  public static async createTicket(
    orgId: string,
    creatorUserId: string,
    dto: CreateTicketDto,
    userContext?: {
      isStaff?: boolean;
      isParent?: boolean;
      isStudent?: boolean;
      isManagement?: boolean;
    },
  ) {
    const title = (dto.title || '').trim();
    const description = (dto.description || dto.initial_description || '').trim();
    const rawContent =
      title && description ? `${title}\n\n${description}` : title || description || '';
    if (!rawContent.trim()) {
      const err: any = new Error('Initial description cannot be empty');
      err.status = 400;
      err.code = 'INVALID_DESCRIPTION';
      throw err;
    }

    // 1. Validate Category
    const category = await prisma.helpdesk_categories.findFirst({
      where: { category_id: dto.category_id, org_id: orgId, is_active: true },
    });
    if (!category) {
      const err: any = new Error('Invalid or inactive helpdesk category');
      err.status = 400;
      err.code = 'INVALID_CATEGORY';
      throw err;
    }

    // 2. Determine requester & role authorization
    const isStaff = userContext ? Boolean(userContext.isStaff) : true;
    let requesterUserId = creatorUserId;
    let finalStudentId = dto.student_id || null;
    let ticketType: helpdesk_ticket_type = dto.ticket_type || 'parent_submitted';

    if (userContext?.isParent) {
      ticketType = 'parent_submitted';
      requesterUserId = creatorUserId;

      const user = await prisma.users.findUnique({
        where: { user_id: creatorUserId },
        select: { email: true },
      });

      if (dto.student_id) {
        // Enforce parent-to-student verification
        const isLinked = await prisma.student_parents.findFirst({
          where: {
            student_id: dto.student_id,
            parents: {
              org_id: orgId,
              OR: [
                { user_id: creatorUserId },
                ...(user?.email
                  ? [{ email: { equals: user.email.trim(), mode: 'insensitive' as const } }]
                  : []),
              ],
            },
          },
        });
        if (!isLinked) {
          const err: any = new Error('Parent is not authorized to submit tickets for this student');
          err.status = 403;
          err.code = 'FORBIDDEN_STUDENT';
          throw err;
        }
      } else {
        // If parent has exactly 1 linked student, automatically associate the ticket with that student
        const parentRecords = await prisma.parents.findMany({
          where: {
            org_id: orgId,
            OR: [
              { user_id: creatorUserId },
              ...(user?.email
                ? [{ email: { equals: user.email.trim(), mode: 'insensitive' as const } }]
                : []),
            ],
          },
          include: { student_parents: true },
        });
        const linkedStudentIds = parentRecords.flatMap((p) =>
          p.student_parents.map((sp) => sp.student_id),
        );
        if (linkedStudentIds.length === 1) {
          finalStudentId = linkedStudentIds[0];
        }
      }
    } else if (userContext?.isStudent) {
      requesterUserId = creatorUserId;
      // In PostgreSQL enum helpdesk_ticket_type, available values are: parent_submitted, staff_on_behalf, internal
      // Database freeze prohibits schema changes; default to staff_on_behalf or parent_submitted
      ticketType = dto.ticket_type || 'staff_on_behalf';

      // Look up student record for user
      const studentRec = await prisma.students.findFirst({
        where: { user_id: creatorUserId, org_id: orgId },
        select: { student_id: true },
      });
      if (studentRec) {
        finalStudentId = studentRec.student_id;
      }
    } else if (isStaff) {
      if (dto.requester_user_id) {
        requesterUserId = dto.requester_user_id;
      }
      if (dto.ticket_type) {
        ticketType = dto.ticket_type;
      } else {
        ticketType = dto.requester_user_id ? 'staff_on_behalf' : 'internal';
      }
    }

    // 3. Validate student if provided
    if (finalStudentId) {
      const student = await prisma.students.findFirst({
        where: { student_id: finalStudentId, org_id: orgId },
      });
      if (!student) {
        const err: any = new Error('Student not found in this organization');
        err.status = 404;
        err.code = 'STUDENT_NOT_FOUND';
        throw err;
      }
    }

    const priority = dto.priority || 'normal';

    return await prisma.$transaction(async (tx) => {
      // 1. Create Ticket
      const ticket = await tx.helpdesk_tickets.create({
        data: {
          org_id: orgId,
          ticket_type: ticketType,
          requester_user_id: requesterUserId,
          created_by: creatorUserId,
          student_id: finalStudentId,
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
          content: rawContent.trim(),
        },
      });

      // Handle optional attachments for initial message
      let createdAttachments: any[] = [];
      if (dto.attachments && dto.attachments.length > 0) {
        await tx.helpdesk_attachments.createMany({
          data: dto.attachments.map((att) => ({
            org_id: orgId,
            message_id: initialMessage.message_id,
            file_name: att.file_name,
            file_path: att.file_path,
            mime_type: att.mime_type,
            file_size_bytes: BigInt(att.file_size_bytes),
            uploaded_by: creatorUserId,
          })),
        });
        createdAttachments = dto.attachments.map((att) => ({
          ...att,
          file_size_bytes: Number(att.file_size_bytes),
        }));
      }

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
        initial_message: {
          ...initialMessage,
          helpdesk_attachments: createdAttachments,
        },
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
      isStudent?: boolean;
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
      if (userContext.isStudent) {
        // Student Experience: strictly scoped to own tickets or tickets referencing own student_id
        const student = await prisma.students.findFirst({
          where: { user_id: userContext.userId, org_id: orgId },
          select: { student_id: true },
        });
        where.OR = [
          { requester_user_id: userContext.userId },
          ...(student ? [{ student_id: student.student_id }] : []),
        ];
      } else {
        // Parent Experience: strictly scoped to own tickets or authorized linked students
        const user = await prisma.users.findUnique({
          where: { user_id: userContext.userId },
          select: { email: true },
        });

        const linkedParents = await prisma.parents.findMany({
          where: {
            org_id: orgId,
            OR: [
              { user_id: userContext.userId },
              ...(user?.email
                ? [{ email: { equals: user.email.trim(), mode: 'insensitive' as const } }]
                : []),
            ],
          },
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

        const orClauses: any[] = [{ requester_user_id: userContext.userId }];
        if (studentIds.size > 0) {
          orClauses.push({ student_id: { in: Array.from(studentIds) } });
        }
        where.OR = orClauses;
      }
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
      // Authorized to view all organization tickets without category restrictions (fees, communication, academics, helpdesk)
      // Preserves optional query filters (query.status, query.category_id, query.priority)
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

    const [total, rawTickets] = await Promise.all([
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
          helpdesk_messages: {
            orderBy: { created_at: 'asc' },
            take: 1,
            select: { content: true, created_at: true },
          },
        },
      }),
    ]);

    const formattedTickets = rawTickets.map((t) => {
      const initialContent = t.helpdesk_messages?.[0]?.content || '';
      const title = initialContent.split('\n')[0]?.trim() || `Ticket ${t.ticket_id.slice(0, 8)}`;
      const ticketNumber = `TICK-${t.ticket_id.slice(0, 8).toUpperCase()}`;
      return {
        ...t,
        ticket_number: ticketNumber,
        ticketNumber,
        title,
        description: initialContent,
      };
    });

    return {
      tickets: formattedTickets,
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
      isParent?: boolean;
      isStudent?: boolean;
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
      const err: any = new Error('Ticket not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // Role-based authorization verification
    if (!userContext.isStaff) {
      const isRequester = ticket.requester_user_id === userContext.userId;
      let isAuthorizedGuardian = false;
      let isAuthorizedStudent = false;

      if (userContext.isStudent) {
        const student = await prisma.students.findFirst({
          where: { user_id: userContext.userId, org_id: orgId },
          select: { student_id: true },
        });
        if (student && ticket.student_id === student.student_id) {
          isAuthorizedStudent = true;
        }
      }

      if (ticket.student_id) {
        const user = await prisma.users.findUnique({
          where: { user_id: userContext.userId },
          select: { email: true },
        });

        const guardianLink = await prisma.student_parents.findFirst({
          where: {
            student_id: ticket.student_id,
            parents: {
              org_id: orgId,
              OR: [
                { user_id: userContext.userId },
                ...(user?.email
                  ? [{ email: { equals: user.email.trim(), mode: 'insensitive' as const } }]
                  : []),
              ],
            },
          },
        });
        if (guardianLink) isAuthorizedGuardian = true;
      }

      if (!isRequester && !isAuthorizedGuardian && !isAuthorizedStudent) {
        const err: any = new Error('Unauthorized to access this ticket');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
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
        // Finance staff is authorized for all organization helpdesk tickets without category restriction
        isRoleAuthorized = true;
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
        const err: any = new Error('Unauthorized to access this ticket');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
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

    // Convert file_size_bytes from BigInt to Number to guarantee JSON serialization safety
    const serializedMessages = messages.map((m) => ({
      ...m,
      helpdesk_attachments: m.helpdesk_attachments.map((att) => ({
        ...att,
        file_size_bytes: Number(att.file_size_bytes),
      })),
    }));

    // History: Available for staff or filtered status_changed history for parent/student
    const historyWhere: any = { ticket_id: ticketId, org_id: orgId };
    if (!userContext.isStaff) {
      historyWhere.action_type = 'status_changed';
    }

    const history = await prisma.helpdesk_ticket_history.findMany({
      where: historyWhere,
      orderBy: { action_at: 'desc' },
      select: {
        ticket_history_id: true,
        action_type: true,
        actor_type: true,
        action_at: true,
        new_value: true,
        old_value: true,
        ...(userContext.isStaff
          ? {
              action_by: true,
              recipient_user_id: true,
              triggering_message_id: true,
              escalation_rule_id: true,
              escalation_rule_snapshot: true,
            }
          : {}),
      },
    });

    const initialMsg =
      serializedMessages.find((m) => m.message_type === 'initial_description') ||
      serializedMessages[0];
    const derivedTitle =
      initialMsg?.content?.split('\n')[0]?.trim() || `Ticket ${ticket.ticket_id.slice(0, 8)}`;
    const ticketNumber = `TICK-${ticket.ticket_id.slice(0, 8).toUpperCase()}`;

    // Flatten attachments from messages for direct frontend consumption
    const allAttachments = serializedMessages.flatMap((m) => m.helpdesk_attachments || []);

    // Format history entries for the frontend
    const formattedHistory = history.map((h: any) => {
      const oldVal = h.old_value && typeof h.old_value === 'object' ? h.old_value : {};
      const newVal = h.new_value && typeof h.new_value === 'object' ? h.new_value : {};
      return {
        ...h,
        from_status: oldVal.status || null,
        to_status: newVal.status || (h.action_type === 'status_changed' ? newVal : 'open'),
        notes:
          newVal.note ||
          newVal.remarks ||
          (h.action_type === 'status_changed' ? '' : h.action_type),
        changed_at: h.action_at,
      };
    });

    return {
      ...ticket,
      ticket,
      ticket_number: ticketNumber,
      ticketNumber,
      title: derivedTitle,
      messages: serializedMessages,
      helpdesk_messages: serializedMessages,
      helpdesk_attachments: allAttachments,
      history: formattedHistory,
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

    const resolvedAt =
      newStatus === 'resolved' || newStatus === 'closed'
        ? existing.resolved_at || new Date()
        : existing.resolved_at;
    const closedAt = newStatus === 'closed' ? existing.closed_at || new Date() : existing.closed_at;

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
    userContext?: {
      isStaff?: boolean;
      isParent?: boolean;
      isStudent?: boolean;
    },
  ) {
    if (dto.message_type === 'internal_note' && !isStaff) {
      const err: any = new Error('Only staff members can post internal notes');
      err.status = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const ticket = await prisma.helpdesk_tickets.findFirst({
      where: { ticket_id: ticketId, org_id: orgId },
    });

    if (!ticket) {
      const err: any = new Error('Ticket not found');
      err.status = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (ticket.status === 'closed') {
      const err: any = new Error('Cannot add messages to a closed ticket');
      err.status = 400;
      err.code = 'TICKET_CLOSED';
      throw err;
    }

    // Role-based access check for non-staff
    if (!isStaff) {
      let isAuthorized = ticket.requester_user_id === authorUserId;
      if (!isAuthorized && userContext?.isStudent) {
        const student = await prisma.students.findFirst({
          where: { user_id: authorUserId, org_id: orgId },
          select: { student_id: true },
        });
        if (student && ticket.student_id === student.student_id) {
          isAuthorized = true;
        }
      }
      if (!isAuthorized && ticket.student_id) {
        const user = await prisma.users.findUnique({
          where: { user_id: authorUserId },
          select: { email: true },
        });

        const guardianLink = await prisma.student_parents.findFirst({
          where: {
            student_id: ticket.student_id,
            parents: {
              org_id: orgId,
              OR: [
                { user_id: authorUserId },
                ...(user?.email
                  ? [{ email: { equals: user.email.trim(), mode: 'insensitive' as const } }]
                  : []),
              ],
            },
          },
        });
        if (guardianLink) isAuthorized = true;
      }
      if (!isAuthorized) {
        const err: any = new Error('Unauthorized to post messages to this ticket');
        err.status = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
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
      let createdAttachments: any[] = [];
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
        createdAttachments = dto.attachments.map((att) => ({
          ...att,
          file_size_bytes: Number(att.file_size_bytes),
        }));
      }

      // If parent or student replies, move from waiting_for_parent to in_progress
      if (!isStaff && ticket.status === 'waiting_for_parent') {
        await tx.helpdesk_tickets.update({
          where: { ticket_id: ticketId },
          data: { status: 'in_progress', updated_at: new Date() },
        });
      }

      return {
        ...message,
        helpdesk_attachments: createdAttachments,
      };
    });
  }

  /**
   * Retrieve authorized linked children for a parent user.
   */
  public static async getParentChildren(orgId: string, userId: string) {
    const user = await prisma.users.findUnique({
      where: { user_id: userId },
      select: { email: true },
    });

    const parents = await prisma.parents.findMany({
      where: {
        org_id: orgId,
        OR: [
          { user_id: userId },
          ...(user?.email
            ? [{ email: { equals: user.email.trim(), mode: 'insensitive' as const } }]
            : []),
        ],
      },
      include: {
        student_parents: {
          include: {
            students: {
              select: {
                student_id: true,
                first_name: true,
                last_name: true,
                admission_no: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const studentsMap = new Map<string, any>();
    for (const p of parents) {
      for (const sp of p.student_parents) {
        if (sp.students && !studentsMap.has(sp.students.student_id)) {
          studentsMap.set(sp.students.student_id, {
            student_id: sp.students.student_id,
            id: sp.students.student_id,
            first_name: sp.students.first_name,
            last_name: sp.students.last_name,
            admission_no: sp.students.admission_no,
            status: sp.students.status,
          });
        }
      }
    }
    return Array.from(studentsMap.values());
  }
}
