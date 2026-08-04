import { supabase } from '../../../../config/supabase';
import { BaseService } from '../BaseService';
import { EnquiryService } from '../crm/EnquiryService';
import { CounselorAssignmentService } from '../crm/CounselorAssignmentService';
import { ApplicationService } from './ApplicationService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { AuditService } from '../AuditService';
import { AdmissionService } from '../../admission.service';

export class PublicApplicationService extends BaseService {
    constructor(
        private readonly enquiryService: EnquiryService,
        private readonly counselorAssignmentService: CounselorAssignmentService,
        private readonly applicationService: ApplicationService,
        private readonly appRepo: ApplicationRepository,
        private readonly auditService: AuditService
    ) {
        super();
    }

    /**
     * Authenticated parent apply — reuses CRM pipeline without password registration.
     */
    public async applyAsAuthenticatedParent(
        userId: string,
        userEmail: string,
        data: Record<string, any>,
        correlationId?: string
    ): Promise<{ userId: string; enquiryId: string; leadId: string; applicationId: string }> {
        const parentEmail = data.mother_email || data.father_email || data.parent_email || userEmail;
        const parentName = data.mother_name || data.father_name || data.parent_name;
        return this.executeCrmApply(userId, { ...data, parent_email: parentEmail, parent_name: parentName }, correlationId);
    }

    /**
     * Online public apply: enquiry → lead (round-robin) → CRM application → submit.
     */
    public async applyOnline(data: Record<string, any>, correlationId?: string): Promise<{
        userId: string;
        enquiryId: string;
        leadId: string;
        applicationId: string;
    }> {
        if (!data.parent_password || !data.parent_email) {
            throw new Error('Email and Password are required for application submission.');
        }

        const parentEmail = data.mother_email || data.father_email || data.parent_email;
        const parentName = data.mother_name || data.father_name || data.parent_name;

        const { school_id } = await AdmissionService.resolveContext();
        const schoolId = data.school_id || school_id;
        if (!schoolId) {
            throw new Error('School context could not be resolved.');
        }

        const userId = await this.ensureParentAuthUser(
            parentEmail,
            data.parent_password,
            parentName,
            schoolId
        );

        return this.executeCrmApply(userId, data, correlationId);
    }

    private async executeCrmApply(
        userId: string,
        data: Record<string, any>,
        correlationId?: string
    ): Promise<{ userId: string; enquiryId: string; leadId: string; applicationId: string }> {
        const { school_id, academic_year_id } = await AdmissionService.resolveContext();
        const schoolId = data.school_id || school_id;
        const academicYearId = data.academic_year_id || academic_year_id;
        if (!schoolId || !academicYearId) {
            throw new Error('School and academic year context could not be resolved.');
        }

        const parentEmail = data.mother_email || data.father_email || data.parent_email;
        const parentName = data.mother_name || data.father_name || data.parent_name;
        const parentPhone = data.mother_phone || data.father_phone || data.parent_phone;

        if (!data.student_name || !data.grade_applied_for || !data.date_of_birth) {
            throw new Error('Student name, grade, and date of birth are required.');
        }

        const extraFields = {
            board: data.board || 'CBSE',
            country: data.country || 'India',
            state: data.state || 'Telangana',
            city: data.city || 'Hyderabad',
            relationship: data.relationship || 'Father',
            occupation: data.occupation || 'Salaried',
            religion: data.religion || 'Hindu',
            category: data.category || 'General',
            blood_group: data.blood_group || 'A+',
            transport_route_id: data.transport_route_id || null,
            hostel_room_type: data.hostel_room_type || 'Single (Non-AC)',
            fee_structure_id: data.fee_structure_id || null,
            quota: data.quota || 'Regular'
        };

        const enquiry = await this.enquiryService.createEnquiry(
            schoolId,
            academicYearId,
            {
                student_name: data.student_name,
                grade_applied_for: data.grade_applied_for,
                parent_name: parentName,
                parent_email: parentEmail,
                parent_phone: parentPhone,
                source: 'Website',
                date_of_birth: data.date_of_birth,
                gender: data.gender,
                current_school: data.previous_school,
                address: data.address,
                ignore_duplicate: data.ignore_duplicate,
                remarks: JSON.stringify(extraFields),
            },
            correlationId
        );

        await this.counselorAssignmentService.assignCounselor(
            enquiry.id,
            'round_robin',
            {},
            correlationId,
            userId
        );

        const leadId = enquiry.id;
        const existingApp = await this.appRepo.findCurrentByLeadId(leadId);
        let applicationId: string;

        if (existingApp) {
            applicationId = existingApp.id;
            if (!existingApp.createdBy) {
                await supabase
                    .from('admission_applications')
                    .update({ created_by: userId, updated_at: new Date().toISOString() })
                    .eq('id', applicationId);
            }
        } else {
            const application = await this.applicationService.createApplication(
                schoolId,
                academicYearId,
                userId,
                {
                    lead_id: leadId,
                    grade: data.grade_applied_for,
                    student_name: data.student_name,
                    date_of_birth: data.date_of_birth,
                    gender: data.gender || 'Other',
                    blood_group: data.blood_group || 'A+',
                    religion: data.religion || 'Hindu',
                    category: data.category || 'General',
                    nationality: data.country || 'India',
                },
                correlationId
            );
            applicationId = application.id;
        }

        await this.appRepo.saveParents(applicationId, {
            father_name: data.father_name || (data.relationship === 'Father' ? parentName : null),
            father_email: data.father_email || (data.relationship === 'Father' ? parentEmail : null),
            father_phone: data.father_phone || (data.relationship === 'Father' ? parentPhone : null),
            mother_name: data.mother_name || (data.relationship === 'Mother' ? parentName : null),
            mother_email: data.mother_email || (data.relationship === 'Mother' ? parentEmail : null),
            mother_phone: data.mother_phone || (data.relationship === 'Mother' ? parentPhone : null),
            guardian_name: data.guardian_name || (data.relationship === 'Guardian' ? parentName : null),
            guardian_email: data.guardian_email || (data.relationship === 'Guardian' ? parentEmail : null),
            guardian_phone: data.guardian_phone || (data.relationship === 'Guardian' ? parentPhone : null),
        });

        if (data.previous_school || data.last_grade_completed) {
            await this.appRepo.savePreviousEducation(applicationId, {
                school_name: data.previous_school || 'Unknown',
                board: data.board || null,
                last_class: data.last_grade_completed || null,
            });
        }

        const application = await this.appRepo.findById(applicationId);
        if (application && application.status !== 'SUBMITTED') {
            await this.applicationService.submitApplication(
                applicationId,
                {
                    profile: {
                        date_of_birth: data.date_of_birth,
                        gender: data.gender,
                        blood_group: data.blood_group || 'A+',
                        religion: data.religion || 'Hindu',
                        category: data.category || 'General',
                        nationality: data.country || 'India',
                    },
                    parents: {
                        father_name: data.father_name || (data.relationship === 'Father' ? parentName : null),
                        father_email: data.father_email || (data.relationship === 'Father' ? parentEmail : null),
                        father_phone: data.father_phone || (data.relationship === 'Father' ? parentPhone : null),
                        mother_name: data.mother_name || (data.relationship === 'Mother' ? parentName : null),
                        mother_email: data.mother_email || (data.relationship === 'Mother' ? parentEmail : null),
                        mother_phone: data.mother_phone || (data.relationship === 'Mother' ? parentPhone : null),
                    },
                    preferences: {
                        need_transport: !!data.transport_route_id,
                        route_preference: data.transport_route_id || null,
                        need_hostel: !!data.hostel_room_type && data.hostel_room_type !== 'None',
                        room_preference: data.hostel_room_type || null,
                    },
                    declaration: {
                        agreed_to_terms: true,
                        parent_signature: parentName,
                        date_signed: new Date().toISOString().slice(0, 10),
                    },
                    change_reason: 'Online public application submitted',
                },
                'PARENT',
                userId,
                correlationId
            );
        }

        await this.auditService.logAudit({
            action: 'PUBLIC_APPLICATION_CREATED',
            entityName: 'admission_applications',
            entityId: applicationId,
            afterState: { enquiryId: enquiry.id, leadId, userId },
            userId,
            correlationId,
        });

        return { userId, enquiryId: enquiry.id, leadId, applicationId };
    }

    private async ensureParentAuthUser(
        email: string,
        password: string,
        fullName: string,
        schoolId: string
    ): Promise<string> {
        const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingProfile?.id) {
            await this.linkParentRole(existingProfile.id);
            return existingProfile.id;
        }

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, school_id: schoolId },
        });

        if (authError) {
            if (authError.message.includes('already exists')) {
                throw new Error('A user with this email already exists. Please login to apply.');
            }
            throw authError;
        }

        const userId = authData.user.id;

        await supabase.from('users').upsert({
            id: userId,
            school_id: schoolId,
            full_name: fullName,
            email,
            status: 'active',
            login_status: 'APPROVED',
        }, { onConflict: 'id' });

        await this.linkParentRole(userId);
        return userId;
    }

    private async linkParentRole(userId: string): Promise<void> {
        const { data: role } = await supabase.from('roles').select('id').eq('name', 'PARENT').maybeSingle();
        if (!role) return;
        await supabase.from('user_roles').upsert(
            { user_id: userId, role_id: role.id },
            { onConflict: 'user_id,role_id' }
        );
    }
}
