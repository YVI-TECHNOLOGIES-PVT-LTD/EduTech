import prisma from '../../../lib/prismaClient';
import { helpdesk_priority } from '@prisma/client';

export interface CreateEscalationRuleDto {
  priority?: helpdesk_priority;
  category_id?: string;
  auto_escalation_enabled?: boolean;
  no_response_after_minutes?: number;
  escalation_recipient_user_id: string;
  is_active?: boolean;
}

export class EscalationService {
  /**
   * List escalation rules for an organization.
   */
  public static async listRules(orgId: string) {
    return await prisma.helpdesk_escalation_rules.findMany({
      where: { org_id: orgId },
      include: {
        helpdesk_categories: {
          select: { category_id: true, category_name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Create an escalation rule.
   */
  public static async createRule(orgId: string, userId: string, dto: CreateEscalationRuleDto) {
    // Validate recipient user is active in org
    const staff = await prisma.users.findFirst({
      where: { user_id: dto.escalation_recipient_user_id, org_id: orgId, status: 'active' },
    });
    if (!staff) {
      throw new Error('Escalation recipient user not found in this organization');
    }

    if (dto.category_id) {
      const cat = await prisma.helpdesk_categories.findFirst({
        where: { category_id: dto.category_id, org_id: orgId },
      });
      if (!cat) {
        throw new Error('Helpdesk category not found');
      }
    }

    return await prisma.helpdesk_escalation_rules.create({
      data: {
        org_id: orgId,
        priority: dto.priority || null,
        category_id: dto.category_id || null,
        auto_escalation_enabled: dto.auto_escalation_enabled ?? true,
        no_response_after_minutes: dto.no_response_after_minutes ?? 1440,
        escalation_recipient_user_id: dto.escalation_recipient_user_id,
        is_active: dto.is_active ?? true,
        created_by: userId,
        updated_by: userId,
      },
    });
  }

  /**
   * Resolve applicable rule using 4-tier precedence:
   * 1. Priority + category
   * 2. Category only
   * 3. Priority only
   * 4. Organization default (both null)
   */
  public static resolveApplicableRule(
    rules: any[],
    ticketPriority: helpdesk_priority,
    ticketCategoryId: string,
  ) {
    // 1. Priority + Category
    const ruleTier1 = rules.find(
      (r) => r.priority === ticketPriority && r.category_id === ticketCategoryId,
    );
    if (ruleTier1) return ruleTier1.is_active ? ruleTier1 : null;

    // 2. Category only
    const ruleTier2 = rules.find((r) => !r.priority && r.category_id === ticketCategoryId);
    if (ruleTier2) return ruleTier2.is_active ? ruleTier2 : null;

    // 3. Priority only
    const ruleTier3 = rules.find((r) => r.priority === ticketPriority && !r.category_id);
    if (ruleTier3) return ruleTier3.is_active ? ruleTier3 : null;

    // 4. Org default
    const ruleTier4 = rules.find((r) => !r.priority && !r.category_id);
    if (ruleTier4) return ruleTier4.is_active ? ruleTier4 : null;
    return null;
  }

  /**
   * Run escalation evaluation on active tickets within an organization.
   * Atomically records history entry and notification on breach.
   */
  public static async evaluateEscalations(orgId: string) {
    // Fetch all rules for org
    const allRules = await prisma.helpdesk_escalation_rules.findMany({
      where: { org_id: orgId },
    });

    if (allRules.length === 0) {
      return { evaluatedCount: 0, escalatedCount: 0 };
    }

    // Fetch active non-closed tickets
    const activeTickets = await prisma.helpdesk_tickets.findMany({
      where: {
        org_id: orgId,
        status: { in: ['open', 'in_progress', 'waiting_for_parent'] },
      },
      include: {
        helpdesk_messages: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    let escalatedCount = 0;
    const now = new Date();

    for (const ticket of activeTickets) {
      const applicableRule = this.resolveApplicableRule(
        allRules,
        ticket.priority,
        ticket.category_id,
      );

      // If rule is absent, disabled, or auto-escalation is disabled, skip
      if (!applicableRule || !applicableRule.is_active || !applicableRule.auto_escalation_enabled) {
        continue;
      }

      // Find the latest public message from a non-staff user (requester)
      const lastRequesterMsg = ticket.helpdesk_messages.find(
        (m) =>
          m.author_user_id === ticket.requester_user_id &&
          (m.message_type === 'initial_description' || m.message_type === 'public_reply'),
      );

      if (!lastRequesterMsg) {
        continue;
      }

      // Check if there is any staff public reply after lastRequesterMsg
      const staffReplyAfter = ticket.helpdesk_messages.find(
        (m) =>
          m.author_user_id !== ticket.requester_user_id &&
          m.message_type === 'public_reply' &&
          m.created_at > lastRequesterMsg.created_at,
      );

      if (staffReplyAfter) {
        // Staff has already replied to the latest requester message
        continue;
      }

      // Calculate elapsed time in minutes
      const elapsedMinutes = Math.floor(
        (now.getTime() - lastRequesterMsg.created_at.getTime()) / (1000 * 60),
      );

      if (elapsedMinutes >= applicableRule.no_response_after_minutes) {
        // Check for existing escalation on this triggering message to prevent duplicates
        const existingEscalation = await prisma.helpdesk_ticket_history.findFirst({
          where: {
            ticket_id: ticket.ticket_id,
            triggering_message_id: lastRequesterMsg.message_id,
            action_type: 'automatic_escalated',
          },
        });

        if (existingEscalation) {
          continue;
        }

        // Execute escalation in a transaction (dual-write to history & notifications)
        await prisma.$transaction(async (tx) => {
          await tx.helpdesk_ticket_history.create({
            data: {
              org_id: orgId,
              ticket_id: ticket.ticket_id,
              action_type: 'automatic_escalated',
              actor_type: 'system',
              recipient_user_id: applicableRule.escalation_recipient_user_id,
              triggering_message_id: lastRequesterMsg.message_id,
              escalation_rule_id: applicableRule.escalation_rule_id,
              escalation_rule_snapshot: {
                priority: applicableRule.priority,
                no_response_after_minutes: applicableRule.no_response_after_minutes,
                category_id: applicableRule.category_id,
              },
              new_value: {
                reason: 'Response deadline breached',
                elapsed_minutes: elapsedMinutes,
                threshold_minutes: applicableRule.no_response_after_minutes,
              },
            },
          });

          await tx.notifications.create({
            data: {
              org_id: orgId,
              recipient_user_id: applicableRule.escalation_recipient_user_id,
              category: 'SYSTEM',
              type: 'HELPDESK_ESCALATION',
              priority: 'HIGH',
              title: `Helpdesk Escalation: Ticket #${ticket.ticket_id.slice(0, 8)}`,
              message: `Ticket has received no staff reply for ${elapsedMinutes} minutes (configured SLA: ${applicableRule.no_response_after_minutes} mins).`,
              entity_type: 'helpdesk_ticket',
              entity_id: ticket.ticket_id,
              action_url: `/app/finance/communication/helpdesk?ticket_id=${ticket.ticket_id}`,
              metadata: {
                ticket_id: ticket.ticket_id,
                priority: ticket.priority,
                triggering_message_id: lastRequesterMsg.message_id,
              },
            },
          });
        });

        escalatedCount++;
      }
    }

    return {
      evaluatedCount: activeTickets.length,
      escalatedCount,
    };
  }
}
