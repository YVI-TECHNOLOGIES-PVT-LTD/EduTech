"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApplicationService = void 0;
const prismaClient_1 = __importDefault(require("../../../../lib/prismaClient"));
const crypto_utils_1 = require("../../../../auth/crypto.utils");
const client_1 = require("@prisma/client");
const ValidationError_1 = require("../../errors/ValidationError");
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
class PublicApplicationService {
    constructor(enquiryService, counselorAssignmentService, applicationService, applicationRepository, auditService) {
        this.enquiryService = enquiryService;
        this.counselorAssignmentService = counselorAssignmentService;
        this.applicationService = applicationService;
        this.applicationRepository = applicationRepository;
        this.auditService = auditService;
    }
    static normalizePublicApplicationPayload(rawPayload) {
        const parentEmail = (rawPayload.contact_email || rawPayload.parent_email || rawPayload.email || '').trim().toLowerCase();
        const parentPhone = (rawPayload.contact_phone || rawPayload.parent_phone || rawPayload.parentPhone || rawPayload.phone || '').trim();
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
            ? rawGender
            : undefined;
        const rawRel = (rawPayload.contact_relationship || rawPayload.relationship || '').toString().toLowerCase();
        const normalizedRel = ['father', 'mother', 'guardian', 'other'].includes(rawRel)
            ? rawRel
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
    async applyOnline(payload, correlationId) {
        return PublicApplicationService.apply(payload);
    }
    async applyAsAuthenticatedParent(userId, email, payload, correlationId) {
        return PublicApplicationService.apply({ ...payload, email, userId });
    }
    static async apply(payload) {
        const canonical = PublicApplicationService.normalizePublicApplicationPayload(payload);
        const targetEmail = canonical.contact_email;
        const targetPassword = canonical.parent_password || 'Welcome#123';
        const targetParentName = `${canonical.parent_first_name} ${canonical.parent_last_name || ''}`.trim();
        const rawStudentFirst = canonical.student_first_name;
        const rawStudentLast = canonical.student_last_name || '';
        const phone = canonical.contact_phone || '9999999999';
        if (!targetEmail) {
            throw new ValidationError_1.ValidationError('Email is required for application submission.');
        }
        // 1. Resolve Organization
        let targetOrgId = canonical.school_id || canonical.org_id;
        if (!targetOrgId || targetOrgId === '00000000-0000-0000-0000-000000000000') {
            const activeOrg = await prismaClient_1.default.organizations.findFirst({
                where: { status: 'active' },
            });
            if (!activeOrg) {
                throw new ValidationError_1.ValidationError('No active school organization found in the system.');
            }
            targetOrgId = activeOrg.org_id;
        }
        const finalOrgId = targetOrgId;
        // Verify organization exists in DB
        const existingOrg = await prismaClient_1.default.organizations.findUnique({
            where: { org_id: finalOrgId },
        });
        if (!existingOrg) {
            throw new ValidationError_1.ValidationError(`Organization ID '${finalOrgId}' does not exist.`);
        }
        console.log(`[PUBLIC-APPLY] organization resolved: ${finalOrgId} (${existingOrg.org_name})`);
        // 2. Resolve Academic Year
        let academicYear = null;
        if (canonical.academic_year_id) {
            academicYear = await prismaClient_1.default.academic_years.findFirst({
                where: {
                    org_id: finalOrgId,
                    academic_year_id: canonical.academic_year_id,
                },
            });
        }
        if (!academicYear) {
            academicYear = await prismaClient_1.default.academic_years.findFirst({
                where: { org_id: finalOrgId },
                orderBy: { created_at: 'desc' },
            });
        }
        if (!academicYear) {
            throw new BusinessRuleError_1.BusinessRuleError('No academic year configured for this school organization.');
        }
        console.log(`[PUBLIC-APPLY] academic year resolved: ${academicYear.academic_year_id} (${academicYear.academic_year_name})`);
        // 2b. Check Admission Configuration Rules
        const config = await prismaClient_1.default.admission_configurations.findFirst({
            where: {
                org_id: finalOrgId,
                academic_year_id: academicYear.academic_year_id,
            },
        });
        if (config) {
            if (config.allow_online_application === false) {
                throw new BusinessRuleError_1.BusinessRuleError('Online applications are currently disabled for this academic year.');
            }
            const now = new Date();
            if (config.admission_start_date && now < config.admission_start_date) {
                throw new BusinessRuleError_1.BusinessRuleError('Admissions have not opened yet for this academic year.');
            }
            if (config.admission_end_date && now > config.admission_end_date) {
                throw new BusinessRuleError_1.BusinessRuleError('Admissions have closed for this academic year.');
            }
        }
        console.log('[PUBLIC-APPLY] admission configuration validated');
        // 3. Resolve Academic Year Grade
        let ayg = null;
        if (canonical.academic_year_grade_id) {
            ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                where: {
                    academic_year_grade_id: canonical.academic_year_grade_id,
                },
            });
        }
        if (!ayg && canonical.grade_id) {
            ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                where: {
                    academic_year_id: academicYear.academic_year_id,
                    grade_id: canonical.grade_id,
                },
            });
        }
        if (!ayg && canonical.grade_applied_for) {
            const matchedGrade = await prismaClient_1.default.grades.findFirst({
                where: { org_id: finalOrgId, grade_name: canonical.grade_applied_for },
            });
            if (matchedGrade) {
                ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                    where: {
                        academic_year_id: academicYear.academic_year_id,
                        grade_id: matchedGrade.grade_id,
                    },
                });
            }
        }
        if (!ayg) {
            ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                where: { academic_year_id: academicYear.academic_year_id },
            });
        }
        if (!ayg) {
            ayg = await prismaClient_1.default.academic_year_grades.findFirst({
                where: { is_active: true },
            });
        }
        if (!ayg) {
            throw new BusinessRuleError_1.BusinessRuleError('No grade structure configured for this academic year.');
        }
        const targetAyg = ayg;
        const finalAcademicYearId = targetAyg.academic_year_id || academicYear.academic_year_id;
        console.log(`[PUBLIC-APPLY] academic year grade resolved: ${targetAyg.academic_year_grade_id}`);
        // 4. Run Transaction for User, Role, Lead, and Application creation
        return prismaClient_1.default.$transaction(async (tx) => {
            // a. Find or create user
            let user = await tx.users.findFirst({
                where: { org_id: finalOrgId, email: targetEmail },
            });
            if (!user) {
                const passwordHash = await crypto_utils_1.NativePassword.hash(targetPassword);
                user = await tx.users.create({
                    data: {
                        org_id: finalOrgId,
                        first_name: targetParentName || 'Parent User',
                        email: targetEmail,
                        phone,
                        password_hash: passwordHash,
                        status: 'active',
                    },
                });
            }
            console.log(`[PUBLIC-APPLY] parent user resolved/created: ${user.user_id}`);
            // b. Ensure PARENT role is assigned
            const parentRole = await tx.roles.findFirst({
                where: { org_id: finalOrgId, role_name: 'PARENT' },
            }) || await tx.roles.findFirst({
                where: { role_name: 'PARENT' },
            });
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
            // c. Create Lead record with unique lead_number check
            const year = new Date().getFullYear();
            const leadCount = await tx.leads.count();
            let leadSeq = leadCount + 1;
            let leadNumber = `LEAD-${year}-${String(leadSeq).padStart(5, '0')}`;
            while (await tx.leads.findUnique({ where: { lead_number: leadNumber } })) {
                leadSeq++;
                leadNumber = `LEAD-${year}-${String(leadSeq).padStart(5, '0')}`;
            }
            const parsedDob = canonical.date_of_birth ? new Date(canonical.date_of_birth) : undefined;
            const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : undefined;
            const lead = await tx.leads.create({
                data: {
                    org_id: finalOrgId,
                    lead_number: leadNumber,
                    academic_year_grade_id: targetAyg.academic_year_grade_id,
                    student_first_name: rawStudentFirst || 'Student',
                    student_last_name: rawStudentLast || undefined,
                    dob: validDob,
                    gender: canonical.gender,
                    curriculum_preference: canonical.curriculum_preference,
                    scholarship_interest: Boolean(canonical.scholarship_interest),
                    contact_name: targetParentName || 'Parent User',
                    contact_relationship: canonical.contact_relationship || 'father',
                    contact_phone: phone,
                    contact_email: targetEmail,
                    source: client_1.lead_source.website,
                    stage: client_1.lead_stage.application_submitted,
                    remarks: canonical.remarks,
                    created_by: user.user_id,
                },
            });
            console.log(`[PUBLIC-APPLY] lead created: ${lead.lead_id} (${lead.lead_number})`);
            // d. Create Admissions Application record with unique application_number check
            const appCount = await tx.admissions_applications.count();
            let appSeq = appCount + 1;
            let applicationNumber = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
            while (await tx.admissions_applications.findUnique({ where: { application_number: applicationNumber } })) {
                appSeq++;
                applicationNumber = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
            }
            const application = await tx.admissions_applications.create({
                data: {
                    lead_id: lead.lead_id,
                    org_id: finalOrgId,
                    academic_year_id: finalAcademicYearId,
                    application_number: applicationNumber,
                    application_date: new Date(),
                    status: client_1.application_status.submitted,
                    created_by: user.user_id,
                },
            });
            console.log(`[PUBLIC-APPLY] application created: ${application.application_id} (${application.application_number})`);
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
exports.PublicApplicationService = PublicApplicationService;
