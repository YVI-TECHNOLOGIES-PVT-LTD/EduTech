import { Router } from 'express';
import { checkPermission, getEffectiveRoles } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { 
    enquiryController, 
    leadController, 
    followupController, 
    visitorController 
} from './index';
import { supabase } from '../../config/supabase';

export const crmRouter = Router();

// ==========================================
// ONLINE ENQUIRIES
// ==========================================
crmRouter.post('/enquiries',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_CREATE),
    enquiryController.create
);

crmRouter.get('/enquiries',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_VIEW),
    enquiryController.list
);

crmRouter.get('/enquiries/:id',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_VIEW),
    enquiryController.getById
);

crmRouter.put('/enquiries/:id',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_CREATE),
    enquiryController.update
);

crmRouter.delete('/enquiries/:id',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_CREATE),
    enquiryController.softDelete
);

crmRouter.post('/enquiries/:id/convert',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    checkIdempotency,
    enquiryController.convert
);

// ==========================================
// LEAD MANAGEMENT
// ==========================================
crmRouter.get('/leads',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    leadController.list
);

crmRouter.get('/leads/:id',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    leadController.getById
);

crmRouter.put('/leads/:id',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    leadController.update
);

crmRouter.put('/leads/:id/assign',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    checkIdempotency,
    leadController.assign
);

// ==========================================
// FOLLOW-UP MANAGEMENT
// ==========================================
crmRouter.post('/followups',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    checkIdempotency,
    followupController.create
);

crmRouter.get('/followups',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    followupController.list
);

crmRouter.put('/followups/:id',
    checkPermission(PERMISSIONS.ADMISSION_LEADS_MANAGE),
    followupController.update
);

// ==========================================
// VISITOR REGISTER
// ==========================================
crmRouter.post('/visitors',
    checkPermission(PERMISSIONS.ADMISSION_VISITORS_MANAGE),
    visitorController.create
);

crmRouter.get('/visitors',
    checkPermission(PERMISSIONS.ADMISSION_VISITORS_MANAGE),
    visitorController.list
);

crmRouter.put('/visitors/:id',
    checkPermission(PERMISSIONS.ADMISSION_VISITORS_MANAGE),
    visitorController.update
);

// ==========================================
// LOOKUPS FOR ADMISSION MODULE (Bypassing RLS/RBAC constraints for Admissions Desk)
// ==========================================
crmRouter.get('/counselors',
    (req, res, next) => {
        if (!req.context?.user) {
            return res.status(401).json({ error: 'Unauthorized: No session context' });
        }
        const permissions = req.context.user.permissions || [];
        const roles = getEffectiveRoles(req.context.user.roles || []);
        if (
            roles.includes('ADMIN') ||
            roles.includes('ADMISSION_OFFICER') ||
            permissions.includes('admission.enquiry.view') ||
            permissions.includes('admission.enquiry.create') ||
            permissions.includes('admission.visitors.manage')
        ) {
            return next();
        }
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    },
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            
            // 1. Resolve role IDs for COUNSELOR and ADMISSION_OFFICER
            const { data: dbRoles, error: rolesError } = await supabase
                .from('roles')
                .select('id, name')
                .in('name', ['COUNSELOR', 'ADMISSION_OFFICER']);
            
            if (rolesError) throw rolesError;
            const roleIds = dbRoles?.map(r => r.id) || [];

            if (roleIds.length === 0) {
                res.json([]);
                return;
            }

            // 2. Query user_roles matching these role IDs
            const { data: userRoles, error: urError } = await supabase
                .from('user_roles')
                .select('user_id')
                .in('role_id', roleIds);

            if (urError) throw urError;
            const userIds = userRoles?.map((ur: any) => ur.user_id) || [];

            if (userIds.length === 0) {
                res.json([]);
                return;
            }

            // 3. Query active users in this school matching userIds
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('school_id', schoolId)
                .eq('status', 'active')
                .in('id', userIds)
                .order('full_name');

            if (usersError) throw usersError;

            res.json(users || []);
        } catch (error: any) {
            console.error('[Counselors Error]', error);
            res.status(500).json({ error: error.message });
        }
    }
);

crmRouter.get('/offer-templates',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_VIEW),
    async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('admission_offer_templates')
                .select('id, name');
            
            if (error) throw error;
            res.json(data || []);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

crmRouter.get('/transport-routes',
    checkPermission(PERMISSIONS.ADMISSION_ENQUIRY_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const { data, error } = await supabase
                .from('transport_routes')
                .select('id, name')
                .eq('school_id', schoolId);
            
            if (error) throw error;
            res.json(data || []);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

crmRouter.get('/fee-structures',
    checkPermission(PERMISSIONS.ADMISSION_FEES_INITIALIZE),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const { data, error } = await supabase
                .from('fee_structures')
                .select('id, name, amount')
                .eq('school_id', schoolId);
            
            if (error) throw error;
            res.json(data || []);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);
