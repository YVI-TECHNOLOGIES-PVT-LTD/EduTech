import prisma from '../../../lib/prismaClient';
import {
  lead_source,
  lead_stage,
  lead_priority,
  lead_activity_type,
  activity_status,
  academic_year_status,
} from '@prisma/client';
import { LeadRepository } from '../../lead-management/repositories/lead.repository';
import { LeadActivityRepository } from '../../lead-management/repositories/lead.activity.repository';
import { LeadScoringService } from '../../lead-management/services/lead.scoring.service';
import { ChatbotSessionRepository } from '../repositories/chatbot.session.repository';
import { RequestedLeadFields } from './chatbot.llm.service';
import { logger } from '../../../utils/logger';

export interface LeadCaptureResult {
  action: 'CREATED' | 'UPDATED' | 'LINKED_EXISTING' | 'INTERMEDIATE_STORED' | 'NOOP';
  leadId: string | null;
  leadNumber?: string | null;
  score?: number | null;
  details?: string;
}

export class ChatbotLeadCaptureService {
  /**
   * Resolves the most suitable academic_year_grade_id for an organization.
   * Matches by grade string (e.g. "Grade 6", "Class 11", "Nursery", "6") or falls back to active year grade.
   */
  private static async resolveAcademicYearGradeId(
    tenantOrgId: string,
    gradeInterest?: string | null,
  ): Promise<string> {
    // 1. Fetch available academic year grades for this organization
    const ayGrades = await prisma.academic_year_grades.findMany({
      where: {
        academic_years: {
          org_id: tenantOrgId,
          status: {
            in: [
              academic_year_status.admissions_open,
              academic_year_status.open,
              academic_year_status.teaching,
            ],
          },
        },
      },
      include: {
        grades: true,
      },
    });

    if (ayGrades.length === 0) {
      // Fallback to any grade for this tenant
      const fallback = await prisma.academic_year_grades.findFirst({
        where: {
          academic_years: {
            org_id: tenantOrgId,
          },
        },
        select: { academic_year_grade_id: true },
      });

      if (!fallback) {
        throw new Error(
          `[Lead Capture] No academic year grades found configured for organization ${tenantOrgId}.`,
        );
      }
      return fallback.academic_year_grade_id;
    }

    // 2. If a specific grade is mentioned, match against grade_code or grade_name
    if (gradeInterest && gradeInterest.trim().length > 0) {
      const cleanSearch = gradeInterest
        .replace(/grade|class/gi, '')
        .trim()
        .toLowerCase();

      const matchedGrade = ayGrades.find((ayg) => {
        const code = ayg.grades.grade_code.toLowerCase();
        const name = ayg.grades.grade_name?.toLowerCase() || '';
        return (
          code.includes(cleanSearch) || name.includes(cleanSearch) || cleanSearch.includes(code)
        );
      });

      if (matchedGrade) {
        return matchedGrade.academic_year_grade_id;
      }
    }

    // 3. Default to the first available grade in the active academic year
    return ayGrades[0].academic_year_grade_id;
  }

  /**
   * Processes extracted lead information from chatbot conversation.
   * Handles duplicate detection, lead creation/update, session linking, and lead activity logging.
   *
   * @param sessionId - Active chatbot session ID
   * @param tenantOrgId - Organization ID strictly resolved from tenant middleware
   * @param extractedFields - Structured entity fields extracted by LLM
   * @param conversationSummary - Summary of user queries / intent
   */
  static async processLeadCapture(
    sessionId: string,
    tenantOrgId: string,
    extractedFields: RequestedLeadFields | null,
    conversationSummary?: string,
  ): Promise<LeadCaptureResult> {
    if (!sessionId || !tenantOrgId) {
      throw new Error('[Lead Capture] sessionId and tenantOrgId are mandatory.');
    }

    if (!extractedFields) {
      return { action: 'NOOP', leadId: null, details: 'No lead fields extracted.' };
    }

    const rawPhone = extractedFields.contact_phone?.trim() || null;
    const rawEmail = extractedFields.contact_email?.trim() || null;
    const rawContactName = extractedFields.contact_name?.trim() || null;
    const rawStudentName = extractedFields.student_name?.trim() || null;

    // 1. If no phone or email is available yet, store intermediate contact info in session
    if (!rawPhone && !rawEmail) {
      if (rawContactName || rawStudentName) {
        const intermediate = [rawContactName, rawStudentName ? `(Student: ${rawStudentName})` : '']
          .filter(Boolean)
          .join(' ');
        await ChatbotSessionRepository.updateAnonymousContact(sessionId, intermediate, tenantOrgId);
        return {
          action: 'INTERMEDIATE_STORED',
          leadId: null,
          details: 'Stored visitor name in session anonymous_contact while awaiting phone/email.',
        };
      }
      return {
        action: 'NOOP',
        leadId: null,
        details: 'No actionable contact details provided yet.',
      };
    }

    // 2. Perform duplicate check using existing LeadRepository mechanism (tenant-scoped)
    const duplicates = await LeadRepository.findDuplicates(
      rawPhone || 'UNKNOWN_PHONE',
      rawEmail,
      rawContactName || undefined,
    );

    // Filter strictly by tenant org_id
    const existingTenantLead = duplicates.find((d: any) => d.org_id === tenantOrgId);

    if (existingTenantLead) {
      const leadId = existingTenantLead.lead_id;

      // A. Link session to existing lead
      await ChatbotSessionRepository.linkLead(sessionId, leadId, tenantOrgId);

      // B. Update lead with any new contact details or remarks if provided
      const updateData: any = {};
      if (rawEmail && !existingTenantLead.contact_email) {
        updateData.contact_email = rawEmail;
      }
      if (rawStudentName && existingTenantLead.student_first_name === 'Prospective Student') {
        updateData.student_first_name = rawStudentName;
      }
      if (extractedFields.preferred_board && !existingTenantLead.curriculum_preference) {
        updateData.curriculum_preference = extractedFields.preferred_board;
      }

      if (Object.keys(updateData).length > 0) {
        await LeadRepository.update(leadId, updateData);
      }

      // C. Record chatbot activity in existing lead_activities table
      await LeadActivityRepository.create(leadId, null, {
        activity_type: lead_activity_type.chatbot,
        activity_date: new Date().toISOString(),
        status: activity_status.completed,
        notes: conversationSummary
          ? `Chatbot interaction: ${conversationSummary}`
          : 'Follow-up interaction via AI Admission Chatbot.',
      });

      // D. Re-evaluate AI lead score
      let score: number | null = null;
      try {
        const scoringRes = await LeadScoringService.evaluateAndQualify(
          leadId,
          undefined,
          tenantOrgId,
        );
        score = scoringRes.score;
      } catch (scoreErr: any) {
        logger.warn(`[Lead Capture] Scoring update failed for lead ${leadId}`, {
          error: scoreErr?.message || String(scoreErr),
        });
      }

      return {
        action: Object.keys(updateData).length > 0 ? 'UPDATED' : 'LINKED_EXISTING',
        leadId,
        leadNumber: existingTenantLead.lead_number,
        score,
        details: `Linked session to existing lead ${existingTenantLead.lead_number}.`,
      };
    }

    // 3. No existing lead found -> Create a new lead through existing lead management repository
    const academicYearGradeId = await this.resolveAcademicYearGradeId(
      tenantOrgId,
      extractedFields.grade_interest,
    );

    const contactName = rawContactName || 'Prospective Parent';
    const studentFirstName = rawStudentName || 'Prospective Student';
    const phone = rawPhone || '0000000000';

    const newLead = await LeadRepository.create({
      org_id: tenantOrgId,
      academic_year_grade_id: academicYearGradeId,
      student_first_name: studentFirstName,
      student_last_name: undefined,
      contact_name: contactName,
      contact_phone: phone,
      contact_email: rawEmail || undefined,
      scholarship_interest: false,
      source: lead_source.chatbot,
      stage: lead_stage.enquiry_received,
      priority: lead_priority.medium,
      curriculum_preference: extractedFields.preferred_board || undefined,
      remarks: conversationSummary
        ? `Originated from AI Admission Chatbot: ${conversationSummary}`
        : 'Originated from AI Admission Chatbot enquiry.',
    });

    const leadId = newLead.lead_id;

    // A. Link session to new lead
    await ChatbotSessionRepository.linkLead(sessionId, leadId, tenantOrgId);

    // B. Record initial lead activity
    await LeadActivityRepository.create(leadId, null, {
      activity_type: lead_activity_type.chatbot,
      activity_date: new Date().toISOString(),
      status: activity_status.completed,
      notes: conversationSummary
        ? `Initial chatbot enquiry: ${conversationSummary}`
        : 'Initial enquiry generated through AI Admission Chatbot.',
    });

    // C. Evaluate and assign initial AI lead score
    let score: number | null = null;
    try {
      const scoringRes = await LeadScoringService.evaluateAndQualify(
        leadId,
        undefined,
        tenantOrgId,
      );
      score = scoringRes.score;
    } catch (scoreErr: any) {
      logger.warn(`[Lead Capture] Initial scoring failed for lead ${leadId}`, {
        error: scoreErr?.message || String(scoreErr),
      });
    }

    logger.info(
      `[Lead Capture] Created new lead ${newLead.lead_number} from chatbot session ${sessionId}`,
    );

    return {
      action: 'CREATED',
      leadId,
      leadNumber: newLead.lead_number,
      score,
      details: `Created new lead ${newLead.lead_number} and linked to session.`,
    };
  }
}
