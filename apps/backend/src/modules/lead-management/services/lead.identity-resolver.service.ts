import prisma from '../../../lib/prismaClient';
import { lead_stage, lead_source, lead_activity_type } from '@prisma/client';
import { logger } from '../../../utils/logger';
import { LeadValidationError } from '../errors/lead.errors';

/**
 * Normalizes string name by trimming, collapsing whitespace, and converting to lowercase.
 */
export function normalizeName(value?: string | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Normalizes email address by trimming and converting to lowercase.
 */
export function normalizeEmail(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Normalizes phone number into clean standardized format.
 */
export function normalizePhone(value?: string | null): string {
  if (!value) return '';
  const digits = value.replace(/[^\d]/g, '').trim();
  if (digits.length === 10) return digits;
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1);
  return digits;
}

/**
 * Normalizes date of birth to standard YYYY-MM-DD string for comparison.
 */
export function normalizeDob(value?: Date | string | null): string | null {
  if (!value) return null;
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

export interface ChildIdentityInput {
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  academicYearGradeId?: string | null;
  curriculumPreference?: string | null;
  scholarshipInterest?: boolean | null;
  remarks?: string | null;
}

export interface ParentIdentityContext {
  parentId?: string | null;
  orgId: string;
  userId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  contactRelationship?: string | null;
}

export interface ResolveLeadOptions {
  targetLeadId?: string | null;
  isNewChild?: boolean;
  performedBy?: string | null;
  tx?: any;
}

export type LeadResolutionType =
  'EXACT_MATCH' | 'STRONG_MATCH' | 'PLACEHOLDER_MATCH' | 'AMBIGUOUS' | 'NEW_LEAD';

export interface LeadResolutionResult {
  lead: any | null;
  leadId: string | null;
  resolutionType: LeadResolutionType;
  confidence: number;
  matchedFields: string[];
  isNewLead: boolean;
  wasPlaceholderEnriched: boolean;
  ambiguousCandidates?: any[];
  reason?: string;
}

export class LeadIdentityResolver {
  /**
   * Deterministically resolves, updates, or creates the correct Lead for a child
   * under an authenticated Parent's application workflow.
   */
  static async resolveLead(
    context: ParentIdentityContext,
    child: ChildIdentityInput,
    options: ResolveLeadOptions = {},
  ): Promise<LeadResolutionResult> {
    const tx = options.tx || prisma;
    const { orgId, parentId, userId, parentName, parentPhone, parentEmail, contactRelationship } =
      context;
    const { targetLeadId, isNewChild, performedBy } = options;

    const normChildFirst = normalizeName(child.firstName);
    const normChildLast = normalizeName(child.lastName);
    const normChildDob = normalizeDob(child.dateOfBirth);

    // -------------------------------------------------------------------------
    // STEP 0: Explicit Target Lead ID supplied
    // -------------------------------------------------------------------------
    if (targetLeadId) {
      const existingLead = await tx.leads.findUnique({
        where: { lead_id: targetLeadId },
        include: {
          admissions_applications: { select: { application_id: true, status: true } },
        },
      });

      if (!existingLead) {
        throw new LeadValidationError(`Target lead ${targetLeadId} not found`);
      }

      if (existingLead.org_id !== orgId) {
        throw new LeadValidationError('Unauthorized: Lead belongs to a different organization');
      }

      // Ownership check if parentId or userId is provided
      if (parentId || userId) {
        const isOwner =
          (parentId && existingLead.parent_id === parentId) ||
          (userId && existingLead.created_by === userId);
        if (!isOwner) {
          throw new LeadValidationError('Unauthorized: You do not own this child lead record');
        }
      }

      // Preserve stage or advance to application_submitted
      if (
        existingLead.stage !== lead_stage.application_submitted &&
        existingLead.stage !== lead_stage.enrolled
      ) {
        await tx.leads.update({
          where: { lead_id: existingLead.lead_id },
          data: {
            stage: lead_stage.application_submitted,
            updated_at: new Date(),
            updated_by: performedBy || undefined,
          },
        });
      }

      await this.recordResolutionActivity(
        tx,
        existingLead.lead_id,
        'EXACT_MATCH',
        ['lead_id'],
        performedBy,
        'Resolved via explicit targetLeadId',
      );

      return {
        lead: existingLead,
        leadId: existingLead.lead_id,
        resolutionType: 'EXACT_MATCH',
        confidence: 1.0,
        matchedFields: ['lead_id'],
        isNewLead: false,
        wasPlaceholderEnriched: false,
      };
    }

    // -------------------------------------------------------------------------
    // STEP 1: Query Candidate Leads for Parent / User
    // -------------------------------------------------------------------------
    const candidateMap = new Map<string, any>();

    // Query 1.1: Leads already linked to this parentId
    if (parentId) {
      const parentLeads = await tx.leads.findMany({
        where: {
          org_id: orgId,
          parent_id: parentId,
        },
        include: {
          admissions_applications: { select: { application_id: true, status: true } },
        },
        orderBy: { created_at: 'asc' },
      });
      parentLeads.forEach((l: any) => candidateMap.set(l.lead_id, l));
    }

    // Query 1.2: Unclaimed enquiry leads matching contact phone / email
    const normPPhone = normalizePhone(parentPhone);
    const normPEmail = normalizeEmail(parentEmail);
    if (normPPhone || normPEmail) {
      const unclaimedLeads = await tx.leads.findMany({
        where: {
          org_id: orgId,
          parent_id: null,
          OR: [
            ...(normPPhone ? [{ contact_phone: { contains: normPPhone } }] : []),
            ...(normPEmail
              ? [{ contact_email: { equals: normPEmail, mode: 'insensitive' as const } }]
              : []),
          ],
        },
        include: {
          admissions_applications: { select: { application_id: true, status: true } },
        },
        orderBy: { created_at: 'asc' },
      });
      unclaimedLeads.forEach((l: any) => candidateMap.set(l.lead_id, l));
    }

    // Query 1.3: Leads created by this user_id if parentId not set
    if (!parentId && userId) {
      const userLeads = await tx.leads.findMany({
        where: {
          org_id: orgId,
          created_by: userId,
        },
        include: {
          admissions_applications: { select: { application_id: true, status: true } },
        },
        orderBy: { created_at: 'asc' },
      });
      userLeads.forEach((l: any) => candidateMap.set(l.lead_id, l));
    }

    const candidates = Array.from(candidateMap.values());

    // -------------------------------------------------------------------------
    // STEP 2: Level 1 — EXACT MATCH (Normalized Name + DOB)
    // -------------------------------------------------------------------------
    if (normChildFirst && normChildDob) {
      const exactMatches = candidates.filter((cand) => {
        const candFirst = normalizeName(cand.student_first_name);
        const candLast = normalizeName(cand.student_last_name);
        const candDob = normalizeDob(cand.dob);

        const firstEquals = candFirst === normChildFirst;
        const lastEquals = !normChildLast || !candLast || candLast === normChildLast;
        const dobEquals = candDob === normChildDob;

        return firstEquals && lastEquals && dobEquals;
      });

      if (exactMatches.length > 0) {
        const matched = exactMatches[0];
        let updatedLead = matched;

        // Claim parent_id if previously unclaimed
        if (!matched.parent_id && parentId) {
          updatedLead = await tx.leads.update({
            where: { lead_id: matched.lead_id },
            data: {
              parent_id: parentId,
              stage:
                matched.stage !== lead_stage.enrolled
                  ? lead_stage.application_submitted
                  : undefined,
              updated_at: new Date(),
              updated_by: performedBy || undefined,
            },
          });
        } else if (
          matched.stage !== lead_stage.application_submitted &&
          matched.stage !== lead_stage.enrolled
        ) {
          updatedLead = await tx.leads.update({
            where: { lead_id: matched.lead_id },
            data: {
              stage: lead_stage.application_submitted,
              updated_at: new Date(),
              updated_by: performedBy || undefined,
            },
          });
        }

        await this.recordResolutionActivity(
          tx,
          updatedLead.lead_id,
          'EXACT_MATCH',
          ['student_first_name', 'student_last_name', 'dob'],
          performedBy,
          `Matched child: ${child.firstName} ${child.lastName || ''} (DOB: ${normChildDob})`,
        );

        return {
          lead: updatedLead,
          leadId: updatedLead.lead_id,
          resolutionType: 'EXACT_MATCH',
          confidence: 1.0,
          matchedFields: ['first_name', 'last_name', 'dob'],
          isNewLead: false,
          wasPlaceholderEnriched: false,
        };
      }
    }

    // -------------------------------------------------------------------------
    // STEP 3: Level 2 — STRONG MATCH (Normalized Name when unique under Parent)
    // -------------------------------------------------------------------------
    if (normChildFirst) {
      const nameMatches = candidates.filter((cand) => {
        const candFirst = normalizeName(cand.student_first_name);
        const candLast = normalizeName(cand.student_last_name);
        const candDob = normalizeDob(cand.dob);

        // Discard placeholder leads from name match
        if (['applicant', 'student', ''].includes(candFirst) || candFirst.endsWith("'s ward")) {
          return false;
        }

        const firstEquals = candFirst === normChildFirst;
        const lastEquals = !normChildLast || !candLast || candLast === normChildLast;

        // If DOB is present in BOTH candidate and input and they differ, it's a different sibling
        if (candDob && normChildDob && candDob !== normChildDob) {
          return false;
        }

        return firstEquals && lastEquals;
      });

      if (nameMatches.length === 1) {
        const matched = nameMatches[0];
        let updatedLead = matched;

        const updateData: any = {};
        if (!matched.parent_id && parentId) updateData.parent_id = parentId;
        if (!matched.dob && child.dateOfBirth) {
          const parsed = new Date(child.dateOfBirth);
          if (!isNaN(parsed.getTime())) updateData.dob = parsed;
        }
        if (
          matched.stage !== lead_stage.application_submitted &&
          matched.stage !== lead_stage.enrolled
        ) {
          updateData.stage = lead_stage.application_submitted;
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date();
          updateData.updated_by = performedBy || undefined;
          updatedLead = await tx.leads.update({
            where: { lead_id: matched.lead_id },
            data: updateData,
          });
        }

        await this.recordResolutionActivity(
          tx,
          updatedLead.lead_id,
          'STRONG_MATCH',
          ['student_first_name', 'student_last_name'],
          performedBy,
          `Matched unique child by name under parent: ${child.firstName} ${child.lastName || ''}`,
        );

        return {
          lead: updatedLead,
          leadId: updatedLead.lead_id,
          resolutionType: 'STRONG_MATCH',
          confidence: 0.85,
          matchedFields: ['first_name', 'last_name'],
          isNewLead: false,
          wasPlaceholderEnriched: false,
        };
      } else if (nameMatches.length > 1) {
        // Multiple candidate children match this name without distinct DOBs
        return {
          lead: null,
          leadId: null,
          resolutionType: 'AMBIGUOUS',
          confidence: 0.5,
          matchedFields: ['first_name'],
          isNewLead: false,
          wasPlaceholderEnriched: false,
          ambiguousCandidates: nameMatches,
          reason:
            'Multiple existing children match this name under your account. Please provide the Date of Birth or select the child directly.',
        };
      }
    }

    // -------------------------------------------------------------------------
    // STEP 4: Level 3 — PLACEHOLDER MATCH (Enrich unassigned registration lead)
    // -------------------------------------------------------------------------
    if (!isNewChild && parentId) {
      const placeholderLead = candidates.find((cand) => {
        const candFirst = normalizeName(cand.student_first_name);
        const isPlaceholderName =
          ['applicant', 'student', ''].includes(candFirst) || candFirst.endsWith("'s ward");
        const hasNoActiveApps =
          !cand.admissions_applications ||
          cand.admissions_applications.length === 0 ||
          cand.admissions_applications.every(
            (a: any) => a.status === 'draft' || a.status === 'withdrawn',
          );

        return isPlaceholderName && hasNoActiveApps;
      });

      if (placeholderLead) {
        const parsedDob = child.dateOfBirth ? new Date(child.dateOfBirth) : undefined;
        const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : placeholderLead.dob;

        const enrichedLead = await tx.leads.update({
          where: { lead_id: placeholderLead.lead_id },
          data: {
            student_first_name: child.firstName,
            student_last_name: child.lastName || undefined,
            dob: validDob,
            gender: (child.gender?.toLowerCase() as any) || placeholderLead.gender,
            academic_year_grade_id:
              child.academicYearGradeId || placeholderLead.academic_year_grade_id,
            curriculum_preference:
              child.curriculumPreference || placeholderLead.curriculum_preference,
            scholarship_interest:
              child.scholarshipInterest !== undefined
                ? Boolean(child.scholarshipInterest)
                : placeholderLead.scholarship_interest,
            remarks: child.remarks || placeholderLead.remarks,
            stage: lead_stage.application_submitted,
            updated_at: new Date(),
            updated_by: performedBy || undefined,
          },
        });

        await this.recordResolutionActivity(
          tx,
          enrichedLead.lead_id,
          'PLACEHOLDER_MATCH',
          ['registration_placeholder'],
          performedBy,
          `Enriched registration placeholder lead with child identity: ${child.firstName} ${child.lastName || ''}`,
        );

        return {
          lead: enrichedLead,
          leadId: enrichedLead.lead_id,
          resolutionType: 'PLACEHOLDER_MATCH',
          confidence: 0.9,
          matchedFields: ['registration_placeholder'],
          isNewLead: false,
          wasPlaceholderEnriched: true,
        };
      }
    }

    // -------------------------------------------------------------------------
    // STEP 5: SIBLING PROTECTION & NEW LEAD CREATION
    // -------------------------------------------------------------------------
    // No matching existing child and no unassigned placeholder -> create brand new Lead.
    // Existing leads representing other siblings are NEVER mutated.
    const leadNumber = await this.generateLeadNumber(tx, orgId);

    // Resolve a valid academic_year_grade_id fallback if not supplied
    let targetAygId = child.academicYearGradeId;
    if (!targetAygId) {
      const fallbackAyg = await tx.academic_year_grades.findFirst({
        where: { academic_years: { org_id: orgId } },
      });
      targetAygId = fallbackAyg?.academic_year_grade_id;
    }

    if (!targetAygId) {
      throw new LeadValidationError(
        'Cannot create lead: Academic year grade configuration not found',
      );
    }

    const parsedDob = child.dateOfBirth ? new Date(child.dateOfBirth) : undefined;
    const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : undefined;

    const newLead = await tx.leads.create({
      data: {
        org_id: orgId,
        parent_id: parentId || undefined,
        lead_number: leadNumber,
        academic_year_grade_id: targetAygId,
        student_first_name: child.firstName,
        student_last_name: child.lastName || undefined,
        dob: validDob,
        gender: (child.gender?.toLowerCase() as any) || undefined,
        curriculum_preference: child.curriculumPreference || 'CBSE',
        scholarship_interest: Boolean(child.scholarshipInterest),
        contact_name: parentName || 'Parent User',
        contact_relationship: (contactRelationship?.toLowerCase() as any) || 'father',
        contact_phone: parentPhone || '9999999999',
        contact_email: parentEmail || undefined,
        source: lead_source.website,
        stage: lead_stage.application_submitted,
        remarks: child.remarks || undefined,
        created_by: performedBy || userId || undefined,
      },
    });

    await this.recordResolutionActivity(
      tx,
      newLead.lead_id,
      'NEW_LEAD',
      [],
      performedBy,
      `Created new lead for sibling / new child: ${child.firstName} ${child.lastName || ''}`,
    );

    return {
      lead: newLead,
      leadId: newLead.lead_id,
      resolutionType: 'NEW_LEAD',
      confidence: 1.0,
      matchedFields: [],
      isNewLead: true,
      wasPlaceholderEnriched: false,
    };
  }

  /**
   * Generates a collision-checked sequential lead number in format LEAD-YYYY-XXXXX.
   */
  private static async generateLeadNumber(tx: any, orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const lastLead = await tx.leads.findFirst({
      where: { lead_number: { startsWith: `LEAD-${year}-` } },
      orderBy: { lead_number: 'desc' },
      select: { lead_number: true },
    });

    let nextSeq = 1;
    if (lastLead?.lead_number) {
      const match = lastLead.lead_number.match(/(\d+)$/);
      if (match) {
        nextSeq = parseInt(match[1], 10) + 1;
      }
    }

    let leadNumber = `LEAD-${year}-${String(nextSeq).padStart(5, '0')}`;
    let attempts = 0;
    while (attempts < 10 && (await tx.leads.findUnique({ where: { lead_number: leadNumber } }))) {
      nextSeq++;
      leadNumber = `LEAD-${year}-${String(nextSeq).padStart(5, '0')}`;
      attempts++;
    }

    return leadNumber;
  }

  /**
   * Records resolution events inside lead_activities for auditability.
   */
  private static async recordResolutionActivity(
    tx: any,
    leadId: string,
    resolutionType: LeadResolutionType,
    matchedFields: string[],
    performedBy?: string | null,
    extraNotes?: string,
  ): Promise<void> {
    try {
      const notes =
        `[LeadIdentityResolver] ${resolutionType} | Fields: [${matchedFields.join(', ')}] | ${extraNotes || ''}`.trim();
      await tx.lead_activities.create({
        data: {
          lead_id: leadId,
          activity_type: lead_activity_type.note,
          activity_date: new Date(),
          status: 'completed',
          notes,
          created_by: performedBy || undefined,
        },
      });
    } catch (err: any) {
      logger.warn(
        `[LeadIdentityResolver] Could not record activity for lead ${leadId}: ${err.message}`,
      );
    }
  }
}
