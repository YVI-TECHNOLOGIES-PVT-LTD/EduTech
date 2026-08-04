"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const idempotency_middleware_1 = require("../../middleware/idempotency.middleware");
const index_1 = require("./index");
const supabase_1 = require("../../config/supabase");
exports.crmRouter = (0, express_1.Router)();
// ==========================================
// ONLINE ENQUIRIES
// ==========================================
exports.crmRouter.post('/enquiries', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_CREATE), index_1.enquiryController.create);
exports.crmRouter.get('/enquiries', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_VIEW), index_1.enquiryController.list);
exports.crmRouter.get('/enquiries/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_VIEW), index_1.enquiryController.getById);
exports.crmRouter.put('/enquiries/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_CREATE), index_1.enquiryController.update);
exports.crmRouter.delete('/enquiries/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_CREATE), index_1.enquiryController.softDelete);
exports.crmRouter.post('/enquiries/:id/convert', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), idempotency_middleware_1.checkIdempotency, index_1.enquiryController.convert);
// ==========================================
// LEAD MANAGEMENT
// ==========================================
exports.crmRouter.get('/leads', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), index_1.leadController.list);
exports.crmRouter.get('/leads/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), index_1.leadController.getById);
exports.crmRouter.put('/leads/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), index_1.leadController.update);
exports.crmRouter.put('/leads/:id/assign', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), idempotency_middleware_1.checkIdempotency, index_1.leadController.assign);
// ==========================================
// FOLLOW-UP MANAGEMENT
// ==========================================
exports.crmRouter.post('/followups', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), idempotency_middleware_1.checkIdempotency, index_1.followupController.create);
exports.crmRouter.get('/followups', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), index_1.followupController.list);
exports.crmRouter.put('/followups/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_LEADS_MANAGE), index_1.followupController.update);
// ==========================================
// VISITOR REGISTER
// ==========================================
exports.crmRouter.post('/visitors', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VISITORS_MANAGE), index_1.visitorController.create);
exports.crmRouter.get('/visitors', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VISITORS_MANAGE), index_1.visitorController.list);
exports.crmRouter.put('/visitors/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VISITORS_MANAGE), index_1.visitorController.update);
// ==========================================
// LOOKUPS FOR ADMISSION MODULE (Bypassing RLS/RBAC constraints for Admissions Desk)
// ==========================================
exports.crmRouter.get('/counselors', (req, res, next) => {
    if (!req.context?.user) {
        return res.status(401).json({ error: 'Unauthorized: No session context' });
    }
    const permissions = req.context.user.permissions || [];
    const roles = (0, rbac_middleware_1.getEffectiveRoles)(req.context.user.roles || []);
    if (roles.includes('ADMIN') ||
        roles.includes('ADMISSION_OFFICER') ||
        permissions.includes('admission.enquiry.view') ||
        permissions.includes('admission.enquiry.create') ||
        permissions.includes('admission.visitors.manage')) {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
}, async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        // 1. Resolve role IDs for COUNSELOR and ADMISSION_OFFICER
        const { data: dbRoles, error: rolesError } = await supabase_1.supabase
            .from('roles')
            .select('id, name')
            .in('name', ['COUNSELOR', 'ADMISSION_OFFICER']);
        if (rolesError)
            throw rolesError;
        const roleIds = dbRoles?.map(r => r.id) || [];
        if (roleIds.length === 0) {
            res.json([]);
            return;
        }
        // 2. Query user_roles matching these role IDs
        const { data: userRoles, error: urError } = await supabase_1.supabase
            .from('user_roles')
            .select('user_id')
            .in('role_id', roleIds);
        if (urError)
            throw urError;
        const userIds = userRoles?.map((ur) => ur.user_id) || [];
        if (userIds.length === 0) {
            res.json([]);
            return;
        }
        // 3. Query active users in this school matching userIds
        const { data: users, error: usersError } = await supabase_1.supabase
            .from('users')
            .select('id, full_name, email')
            .eq('school_id', schoolId)
            .eq('status', 'active')
            .in('id', userIds)
            .order('full_name');
        if (usersError)
            throw usersError;
        res.json(users || []);
    }
    catch (error) {
        console.error('[Counselors Error]', error);
        res.status(500).json({ error: error.message });
    }
});
exports.crmRouter.get('/offer-templates', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_VIEW), async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('admission_offer_templates')
            .select('id, name');
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.crmRouter.get('/transport-routes', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_ENQUIRY_VIEW), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const { data, error } = await supabase_1.supabase
            .from('transport_routes')
            .select('id, name')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.crmRouter.get('/fee-structures', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_FEES_INITIALIZE), async (req, res) => {
    try {
        const schoolId = req.context.user.school_id;
        const { data, error } = await supabase_1.supabase
            .from('fee_structures')
            .select('id, name, amount')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
