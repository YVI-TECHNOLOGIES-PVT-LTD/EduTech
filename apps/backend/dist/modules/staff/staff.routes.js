"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const staff_controller_1 = require("./staff.controller");
const supabase_1 = require("../../config/supabase");
exports.staffRouter = (0, express_1.Router)();
// GET /admin/staff-profiles
// We mount this router at /admin (if possible) or include path here
// Assuming mounted at /admin for this example, but standard app layout might be different
// If mounted at /staff in main routes:
// router.get('/profiles', ...)
/*
   NOTE: Since we need to mount this at a top level location,
   and we are defining it as a module.
   We will assume the main router mounts this at `/staff` or `/admin`.
   Given the requirement "GET /admin/staff-profiles", we will structure paths here
   assuming the mount point is generic or we define full path.
   
   However, usually modules are mounted at `/api/module`.
   If I mount this at `/api/admin`, then paths below are `/staff-profiles`.
*/
// ADMIN ONLY
exports.staffRouter.get('/staff-profiles', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STAFF_PROFILE_MANAGE), staff_controller_1.StaffController.getAllProfiles);
exports.staffRouter.post('/staff-profiles', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STAFF_PROFILE_MANAGE), staff_controller_1.StaffController.createProfile);
exports.staffRouter.put('/staff-profiles/:id', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STAFF_PROFILE_MANAGE), staff_controller_1.StaffController.updateProfile);
// ======================================
// USER LOOKUP (Generic, used for Dropdowns)
// ======================================
exports.staffRouter.get('/users', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STAFF_PROFILE_MANAGE), // Reusing generic staff view perm
async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { role } = req.query; // e.g. 'FACULTY'
    // Supabase Auth/Users join is tricky via API (users table is profile).
    let query = supabase_1.supabase
        .from('users')
        .select('id, full_name, email')
        .eq('school_id', schoolId);
    // Filter by Role requires joining user_roles -> roles
    // Helper function in DB? Or simpler Application-side join?
    // Since we don't have deeply nested filtering easily on 'users' without foreign key set up perfectly:
    // Use 'user_roles' as base if role is present.
    if (role) {
        // Find Role ID
        const { data: roleData } = await supabase_1.supabase.from('roles').select('id').eq('name', role).single();
        if (!roleData)
            return res.json([]);
        const { data: userRoles } = await supabase_1.supabase
            .from('user_roles')
            .select('user_id')
            .eq('role_id', roleData.id);
        if (!userRoles || userRoles.length === 0)
            return res.json([]);
        const userIds = userRoles.map((ur) => ur.user_id);
        query = query.in('id', userIds);
    }
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.staffRouter.patch('/staff-profiles/:id/status', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.STAFF_PROFILE_MANAGE), staff_controller_1.StaffController.updateStatus);
