import prisma from '../../../../lib/prismaClient';
import { NativePassword } from '../../../../auth/crypto.utils';
import { application_status, lead_stage, lead_source, Prisma } from '@prisma/client';
import { ValidationError } from '../../errors/ValidationError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';
import { resolveCountryAndPhone } from '../../../../utils/country-resolver';
import { LeadIdentityResolver } from '../../../lead-management/services/lead.identity-resolver.service';

export interface CanonicalPublicApplicationPayload {
  school_id?: string;
  org_id?: string;
  academic_year_id?: string;
  academic_year_grade_id?: string;
  grade_id?: string;
  student_first_name: string;
  student_last_name?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  parent_first_name: string;
  parent_last_name?: string;
  contact_phone: string;
  contact_email: string;
  contact_relationship?: 'father' | 'mother' | 'guardian' | 'other';
  parent_password?: string;
  curriculum_preference?: string;
  scholarship_interest?: boolean;
  remarks?: string;
  grade_applied_for?: string;
}

export class PublicApplicationService {
  constructor(
    private enquiryService?: any,
    private counselorAssignmentService?: any,
    private applicationService?: any,
    private applicationRepository?: any,
    private auditService?: any,
  ) {}

  public static normalizePublicApplicationPayload(
    rawPayload: any,
  ): CanonicalPublicApplicationPayload {
    const parentEmail = (
      rawPayload.contact_email ||
      rawPayload.parent_email ||
      rawPayload.email ||
      ''
    )
      .trim()
      .toLowerCase();
    const parentPhone = (
      rawPayload.contact_phone ||
      rawPayload.parent_phone ||
      rawPayload.parentPhone ||
      rawPayload.phone ||
      ''
    ).trim();

    let pFirst = rawPayload.parent_first_name || '';
    let pLast = rawPayload.parent_last_name || '';
    if (!pFirst) {
      const fullP = (rawPayload.parent_name || rawPayload.fullName || 'Parent User').trim();
      const parts = fullP.split(' ');
      pFirst = parts[0];
      pLast = parts.slice(1).join(' ');
    }

    let sFirst = rawPayload.student_first_name || '';
    let sLast = rawPayload.student_last_name || '';
    if (!sFirst) {
      const fullS = (rawPayload.student_name || rawPayload.studentName || 'Student').trim();
      const parts = fullS.split(' ');
      sFirst = parts[0];
      sLast = parts.slice(1).join(' ');
    }

    const rawGender = (rawPayload.gender || '').toString().toLowerCase();
    const normalizedGender = ['male', 'female', 'other'].includes(rawGender)
      ? (rawGender as 'male' | 'female' | 'other')
      : undefined;

    const rawRel = (rawPayload.contact_relationship || rawPayload.relationship || '')
      .toString()
      .toLowerCase();
    const normalizedRel = ['father', 'mother', 'guardian', 'other'].includes(rawRel)
      ? (rawRel as 'father' | 'mother' | 'guardian' | 'other')
      : undefined;

    return {
      school_id: rawPayload.school_id || rawPayload.schoolId || rawPayload.org_id,
      org_id: rawPayload.org_id || rawPayload.school_id || rawPayload.schoolId,
      academic_year_id: rawPayload.academic_year_id,
      academic_year_grade_id: rawPayload.academic_year_grade_id,
      grade_id: rawPayload.grade_id,
      student_first_name: sFirst,
      student_last_name: sLast,
      date_of_birth: rawPayload.date_of_birth || rawPayload.dob,
      gender: normalizedGender,
      parent_first_name: pFirst,
      parent_last_name: pLast,
      contact_phone: parentPhone,
      contact_email: parentEmail,
      contact_relationship: normalizedRel,
      parent_password: rawPayload.parent_password || rawPayload.password,
      curriculum_preference: rawPayload.curriculum_preference || rawPayload.board,
      scholarship_interest: Boolean(rawPayload.scholarship_interest),
      remarks: typeof rawPayload.remarks === 'string' ? rawPayload.remarks : undefined,
      grade_applied_for: rawPayload.grade_applied_for,
    };
  }

  async applyOnline(
    payload: any,
    correlationId?: string,
  ): Promise<{
    applicationId: string;
    enquiryId?: string;
    leadId?: string;
    userId: string;
    applicationNumber: string;
  }> {
    return PublicApplicationService.apply(payload);
  }

  async applyAsAuthenticatedParent(
    userId: string,
    email: string,
    payload: any,
    correlationId?: string,
  ): Promise<{
    applicationId: string;
    enquiryId?: string;
    leadId?: string;
    userId: string;
    applicationNumber: string;
  }> {
    return PublicApplicationService.apply({ ...payload, email, userId });
  }

  static async apply(payload: any): Promise<{
    applicationId: string;
    enquiryId?: string;
    leadId?: string;
    userId: string;
    applicationNumber: string;
  }> {
    const canonical = PublicApplicationService.normalizePublicApplicationPayload(payload);

    const targetEmail = canonical.contact_email;
    const targetPassword = canonical.parent_password || 'Welcome#123';
    const targetParentName =
      `${canonical.parent_first_name} ${canonical.parent_last_name || ''}`.trim();
    const rawStudentFirst = canonical.student_first_name;
    const rawStudentLast = canonical.student_last_name || '';
    const phone = canonical.contact_phone || '9999999999';

    if (!targetEmail) {
      throw new ValidationError('Email is required for application submission.');
    }

    // 1. Resolve Organization
    let targetOrgId = canonical.school_id || canonical.org_id;
    if (!targetOrgId || targetOrgId === '00000000-0000-0000-0000-000000000000') {
      const activeOrg = await prisma.organizations.findFirst({
        where: { status: 'active' },
      });
      if (!activeOrg) {
        throw new ValidationError('No active school organization found in the system.');
      }
      targetOrgId = activeOrg.org_id;
    }
    const finalOrgId: string = targetOrgId;

    // Verify organization exists in DB
    const existingOrg = await prisma.organizations.findUnique({
      where: { org_id: finalOrgId },
    });
    if (!existingOrg) {
      throw new ValidationError(`Organization ID '${finalOrgId}' does not exist.`);
    }
    console.log(`[PUBLIC-APPLY] organization resolved: ${finalOrgId} (${existingOrg.org_name})`);

    // 2. Resolve Academic Year
    let academicYear = null;
    if (canonical.academic_year_id) {
      academicYear = await prisma.academic_years.findFirst({
        where: {
          org_id: finalOrgId,
          academic_year_id: canonical.academic_year_id,
        },
      });
    }
    if (!academicYear) {
      academicYear = await prisma.academic_years.findFirst({
        where: { org_id: finalOrgId },
        orderBy: { created_at: 'desc' },
      });
    }
    if (!academicYear) {
      throw new BusinessRuleError('No academic year configured for this school organization.');
    }
    console.log(
      `[PUBLIC-APPLY] academic year resolved: ${academicYear.academic_year_id} (${academicYear.academic_year_name})`,
    );

    // 2b. Check Admission Configuration Rules
    const config = await prisma.admission_configurations.findFirst({
      where: {
        org_id: finalOrgId,
        academic_year_id: academicYear.academic_year_id,
      },
    });
    if (config) {
      if (config.allow_online_application === false) {
        throw new BusinessRuleError(
          'Online applications are currently disabled for this academic year.',
        );
      }
      const now = new Date();
      if (config.admission_start_date && now < config.admission_start_date) {
        throw new BusinessRuleError('Admissions have not opened yet for this academic year.');
      }
      if (config.admission_end_date && now > config.admission_end_date) {
        throw new BusinessRuleError('Admissions have closed for this academic year.');
      }
    }
    console.log('[PUBLIC-APPLY] admission configuration validated');

    // 3. Resolve Academic Year Grade
    let ayg = null;
    if (canonical.academic_year_grade_id) {
      ayg = await prisma.academic_year_grades.findFirst({
        where: {
          academic_year_grade_id: canonical.academic_year_grade_id,
        },
      });
    }
    if (!ayg && canonical.grade_id) {
      ayg = await prisma.academic_year_grades.findFirst({
        where: {
          academic_year_id: academicYear.academic_year_id,
          grade_id: canonical.grade_id,
        },
      });
    }
    if (!ayg && canonical.grade_applied_for) {
      const matchedGrade = await prisma.grades.findFirst({
        where: { org_id: finalOrgId, grade_name: canonical.grade_applied_for },
      });
      if (matchedGrade) {
        ayg = await prisma.academic_year_grades.findFirst({
          where: {
            academic_year_id: academicYear.academic_year_id,
            grade_id: matchedGrade.grade_id,
          },
        });
      }
    }
    if (!ayg) {
      ayg = await prisma.academic_year_grades.findFirst({
        where: { academic_year_id: academicYear.academic_year_id },
      });
    }
    if (!ayg) {
      ayg = await prisma.academic_year_grades.findFirst({
        where: {
          academic_years: { org_id: finalOrgId },
          is_active: true,
        },
      });
    }
    if (!ayg) {
      throw new BusinessRuleError('No grade structure configured for this academic year.');
    }
    const targetAyg = ayg;
    const finalAcademicYearId = targetAyg.academic_year_id || academicYear.academic_year_id;
    console.log(`[PUBLIC-APPLY] academic year grade resolved: ${targetAyg.academic_year_grade_id}`);

    // 4. Run Transaction for User, Role, Lead, and Application creation
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Find or create user
      let user = await tx.users.findFirst({
        where: { org_id: finalOrgId, email: targetEmail },
      });

      if (!user) {
        const resolved = await resolveCountryAndPhone(tx, { phone });
        const passwordHash = await NativePassword.hash(targetPassword);
        user = await tx.users.create({
          data: {
            org_id: finalOrgId,
            first_name: targetParentName || 'Parent User',
            email: targetEmail,
            phone: resolved.phone,
            country_id: resolved.country_id,
            password_hash: passwordHash,
            status: 'active',
          },
        });
      } else {
        const passwordHash = await NativePassword.hash(targetPassword);
        user = await tx.users.update({
          where: { user_id: user.user_id },
          data: {
            password_hash: passwordHash,
            status: 'active',
          },
        });
      }
      console.log(`[PUBLIC-APPLY] parent user resolved/created: ${user.user_id}`);

      // b. Ensure PARENT role is assigned
      const parentRole =
        (await tx.roles.findFirst({
          where: { org_id: finalOrgId, role_name: 'PARENT' },
        })) ||
        (await tx.roles.findFirst({
          where: { role_name: 'PARENT' },
        }));

      if (parentRole) {
        console.log(`[PUBLIC-APPLY] PARENT role resolved: ${parentRole.role_id}`);
        const existingRoleLink = await tx.user_roles.findUnique({
          where: {
            user_id_role_id: {
              user_id: user.user_id,
              role_id: parentRole.role_id,
            },
          },
        });

        if (!existingRoleLink) {
          await tx.user_roles.create({
            data: {
              user_id: user.user_id,
              role_id: parentRole.role_id,
            },
          });
        }
        console.log('[PUBLIC-APPLY] user role linked');
      }

      // Resolve or create Parent entity
      let parentRecord = await tx.parents.findFirst({
        where: { user_id: user.user_id },
      });
      if (!parentRecord) {
        parentRecord = await tx.parents.create({
          data: {
            org_id: finalOrgId,
            user_id: user.user_id,
            first_name: canonical.parent_first_name || targetParentName || 'Parent',
            last_name: canonical.parent_last_name || undefined,
            phone: phone,
            email: targetEmail,
          },
        });
      }

      // c. Resolve Lead deterministically using centralized LeadIdentityResolver
      const parsedDob = canonical.date_of_birth ? new Date(canonical.date_of_birth) : undefined;
      const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : undefined;

      const resolution = await LeadIdentityResolver.resolveLead(
        {
          parentId: parentRecord.parent_id,
          orgId: finalOrgId,
          userId: user.user_id,
          parentName: targetParentName || 'Parent User',
          parentPhone: phone,
          parentEmail: targetEmail,
          contactRelationship: canonical.contact_relationship || 'father',
        },
        {
          firstName: rawStudentFirst || 'Applicant',
          lastName: rawStudentLast || undefined,
          dateOfBirth: validDob,
          gender: canonical.gender,
          academicYearGradeId: targetAyg.academic_year_grade_id,
          curriculumPreference: canonical.curriculum_preference,
          scholarshipInterest: Boolean(canonical.scholarship_interest),
          remarks: canonical.remarks,
        },
        {
          performedBy: user.user_id,
          tx,
        },
      );

      if (resolution.resolutionType === 'AMBIGUOUS') {
        throw new ValidationError(
          resolution.reason ||
            'Multiple existing children match this name under your account. Please provide the Date of Birth or select the child directly.',
        );
      }

      const lead = resolution.lead;
      if (!lead) {
        throw new ValidationError('Failed to resolve or create a valid Lead record for this child');
      }

      console.log(
        `[PUBLIC-APPLY] lead resolved (${resolution.resolutionType}): ${lead.lead_id} (${lead.lead_number})`,
      );

      // d. Authoritative Lead -> Application 1:1 check
      // If an application already exists for this resolved Lead, return it idempotently
      let application = await tx.admissions_applications.findFirst({
        where: {
          org_id: finalOrgId,
          lead_id: lead.lead_id,
        },
      });

      if (!application) {
        // Create Admissions Application record with unique application_number check
        const year = new Date().getFullYear();
        const appCount = await tx.admissions_applications.count();
        let appSeq = appCount + 1;
        let applicationNumber = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
        while (
          await tx.admissions_applications.findUnique({
            where: { application_number: applicationNumber },
          })
        ) {
          appSeq++;
          applicationNumber = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
        }

        try {
          application = await tx.admissions_applications.create({
            data: {
              lead_id: lead.lead_id,
              org_id: finalOrgId,
              academic_year_id: finalAcademicYearId,
              application_number: applicationNumber,
              application_date: new Date(),
              status: application_status.submitted,
              created_by: user.user_id,
            },
          });
        } catch (createErr: any) {
          if (createErr.code === 'P2002') {
            application = await tx.admissions_applications.findFirst({
              where: {
                org_id: finalOrgId,
                lead_id: lead.lead_id,
              },
            });
            if (!application) throw createErr;
          } else {
            throw createErr;
          }
        }
      }

      console.log(
        `[PUBLIC-APPLY] application ready: ${application.application_id} (${application.application_number})`,
      );
      console.log('[PUBLIC-APPLY] transaction committed');

      return {
        applicationId: application.application_id,
        applicationNumber: application.application_number,
        enquiryId: lead.lead_id,
        leadId: lead.lead_id,
        userId: user.user_id,
      };
    });
  }
}
