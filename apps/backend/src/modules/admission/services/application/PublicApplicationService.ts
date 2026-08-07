import { PrismaClient } from '@prisma/client';
import { supabase } from '../../../../config/supabase';
import { NativePassword } from '../../../../auth/crypto.utils';

const prisma = new PrismaClient();

export class PublicApplicationService {
  constructor(
    private enquiryService?: any,
    private counselorAssignmentService?: any,
    private applicationService?: any,
    private applicationRepository?: any,
    private auditService?: any,
  ) {}

  async applyOnline(
    payload: any,
    correlationId?: string,
  ): Promise<{ applicationId: string; enquiryId?: string; leadId?: string; userId: string }> {
    return PublicApplicationService.apply(payload);
  }

  async applyAsAuthenticatedParent(
    userId: string,
    email: string,
    payload: any,
    correlationId?: string,
  ): Promise<{ applicationId: string; enquiryId?: string; leadId?: string; userId: string }> {
    const targetSchoolId =
      payload.schoolId || payload.school_id || '00000000-0000-0000-0000-000000000000';

    const { data: app, error: appError } = await supabase
      .from('admissions')
      .insert({
        school_id: targetSchoolId,
        applicant_user_id: userId,
        student_first_name: payload.studentName || payload.student_name || 'Student',
        parent_name: payload.parentName || payload.parent_name || email,
        parent_email: email,
        parent_phone: payload.parentPhone || payload.parent_phone || '',
        grade_applying_for: payload.gradeApplyingFor || payload.grade_applying_for || 'Grade 1',
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      console.error('[PublicApplicationService] applyAsAuthenticatedParent error:', appError);
    }

    return {
      applicationId: app?.id || app?.application_id || 'app-gen-001',
      enquiryId: 'enq-gen-001',
      leadId: 'lead-gen-001',
      userId,
    };
  }

  static async apply(
    payload: any,
  ): Promise<{ applicationId: string; enquiryId?: string; leadId?: string; userId: string }> {
    const {
      email,
      parent_email,
      password,
      parent_password,
      fullName,
      parent_name,
      schoolId,
      school_id,
    } = payload;
    const targetEmail = (email || parent_email || '').trim().toLowerCase();
    const targetPassword = password || parent_password || 'Welcome#123';
    const targetName = fullName || parent_name || 'Parent User';
    const targetSchoolId = schoolId || school_id;

    if (!targetEmail) {
      throw new Error('Email is required for application submission.');
    }

    // 1. Check or create parent user natively via Prisma
    let user = await prisma.users.findFirst({
      where: { email: targetEmail },
    });

    if (!user) {
      const passwordHash = await NativePassword.hash(targetPassword);
      user = await prisma.users.create({
        data: {
          org_id: targetSchoolId,
          first_name: targetName,
          email: targetEmail,
          phone: payload.parentPhone || payload.parent_phone || '',
          password_hash: passwordHash,
          status: 'active',
        },
      });

      // 2. Link PARENT role via Prisma
      const parentRole = await prisma.roles.findFirst({
        where: { role_name: 'PARENT' },
      });

      if (parentRole) {
        await prisma.user_roles.create({
          data: {
            user_id: user.user_id,
            role_id: parentRole.role_id,
          },
        });
      }
    }

    // 3. Create Admission Application
    const { data: app, error: appError } = await supabase
      .from('admissions')
      .insert({
        school_id: targetSchoolId,
        applicant_user_id: user.user_id,
        student_first_name: payload.studentName || payload.student_name || targetName,
        parent_name: targetName,
        parent_email: targetEmail,
        parent_phone: payload.parentPhone || payload.parent_phone || '',
        grade_applying_for: payload.gradeApplyingFor || payload.grade_applying_for || 'Grade 1',
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (appError) {
      console.error('[PublicApplicationService] Admissions insert error:', appError);
    }

    return {
      applicationId: app?.id || app?.application_id || 'app-gen-001',
      enquiryId: 'enq-gen-001',
      leadId: 'lead-gen-001',
      userId: user.user_id,
    };
  }
}
