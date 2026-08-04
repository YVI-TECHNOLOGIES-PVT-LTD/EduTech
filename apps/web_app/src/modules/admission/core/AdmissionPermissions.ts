/**
 * Centralized permission and visibility resolver for Admissions module.
 * Consolidates permission checks previously duplicated across pages.
 */

export interface PermissionContext {
    roles?: string[]; // Kept temporarily in interface to avoid compile breakage but unused in checks
    hasPermission: (permission: string) => boolean;
    hasRole?: (role: string) => boolean;
}

export const AdmissionPermissions = {
    isParent(ctx: PermissionContext): boolean {
        return ctx.hasPermission('parent.dashboard.view');
    },

    isStudent(ctx: PermissionContext): boolean {
        return ctx.hasPermission('student.dashboard.view');
    },

    isReceptionist(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.enquiry.create');
    },

    isCounselor(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.leads.manage') && !ctx.hasPermission('admission.review');
    },

    isAdmissionOfficer(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.review') && ctx.hasPermission('admission.approve');
    },

    isExamCell(ctx: PermissionContext): boolean {
        return ctx.hasPermission('exam.dashboard.view');
    },

    isPrincipal(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admin.dashboard.view');
    },

    isFinance(ctx: PermissionContext): boolean {
        return ctx.hasPermission('fees.payment.collect') || ctx.hasPermission('fees.view');
    },

    isStaff(ctx: PermissionContext): boolean {
        return (
            ctx.hasPermission('admission.review') ||
            ctx.hasPermission('admission.enquiry.create') ||
            ctx.hasPermission('admission.leads.manage')
        );
    },

    canViewApplication(ctx: PermissionContext): boolean {
        if (AdmissionPermissions.isReceptionist(ctx) && !AdmissionPermissions.isAdmissionOfficer(ctx)) {
            return false;
        }
        return (
            AdmissionPermissions.canReviewApplications(ctx) ||
            AdmissionPermissions.canViewOwnApplications(ctx) ||
            AdmissionPermissions.isCounselor(ctx) ||
            ctx.hasPermission('admission.application.view')
        );
    },

    canReviewApplications(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.review');
    },

    canCreateApplication(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.create') || ctx.hasPermission('admission.leads.manage');
    },

    canViewOwnApplications(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.view_own');
    },

    canVerifyDocuments(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.review');
    },

    canManageExams(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.exam.manage');
    },

    canManageInterviews(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.interview.manage');
    },

    canEvaluateInterviews(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.interview.evaluate');
    },

    canGenerateMerit(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.merit.generate');
    },

    canManageMeritSelection(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.merit.generate');
    },

    canApproveOffers(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.approve');
    },

    canManageOffers(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.offer.manage');
    },

    canSendOffers(ctx: PermissionContext): boolean {
        return AdmissionPermissions.canManageOffers(ctx);
    },

    canAcceptOffer(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.view_own');
    },

    canVerifyPayments(ctx: PermissionContext): boolean {
        return ctx.hasPermission('fees.payment.collect');
    },

    canCollectPayments(ctx: PermissionContext): boolean {
        return ctx.hasPermission('fees.payment.collect');
    },

    canManageWaivers(ctx: PermissionContext): boolean {
        return ctx.hasPermission('fees.waiver.approve');
    },

    canViewFinance(ctx: PermissionContext): boolean {
        return (
            ctx.hasPermission('fees.view') ||
            ctx.hasPermission('admission.view_own')
        );
    },

    canEnroll(ctx: PermissionContext): boolean {
        return ctx.hasPermission('admission.review');
    },

    canViewEnrollment(ctx: PermissionContext): boolean {
        return (
            ctx.hasPermission('admission.review') ||
            ctx.hasPermission('admission.view_own')
        );
    },

    canManageInquiries(ctx: PermissionContext): boolean {
        return (
            ctx.hasPermission('admission.enquiry.create') ||
            ctx.hasPermission('admission.leads.manage')
        );
    },

    canAccessInquiryWorkspace(ctx: PermissionContext): boolean {
        return (
            ctx.hasPermission('admission.review') ||
            ctx.hasPermission('admission.enquiry.create') ||
            ctx.hasPermission('admission.enquiry.view') ||
            ctx.hasPermission('admission.leads.manage') ||
            ctx.hasPermission('admission.visitors.manage')
        );
    },

    canDecideLogin(ctx: PermissionContext): boolean {
        return ctx.hasPermission('manage_users') || ctx.hasPermission('admin.dashboard.view');
    },

    resolveWorkspaceDashboard(ctx: PermissionContext): string {
        if (AdmissionPermissions.isParent(ctx)) return 'parent';
        if (AdmissionPermissions.isReceptionist(ctx)) return 'receptionist';
        if (AdmissionPermissions.isCounselor(ctx)) return 'counselor';
        if (AdmissionPermissions.isAdmissionOfficer(ctx)) return 'admission_officer';
        if (AdmissionPermissions.isExamCell(ctx)) return 'exam_cell';
        if (AdmissionPermissions.isPrincipal(ctx)) return 'principal';
        if (AdmissionPermissions.isFinance(ctx)) return 'finance';
        return 'generic';
    },
};
