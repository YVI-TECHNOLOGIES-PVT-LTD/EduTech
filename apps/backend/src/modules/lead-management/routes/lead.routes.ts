import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { LeadController } from '../controllers/lead.controller';
import { LeadActivityController } from '../controllers/lead-activity.controller';
import { LeadPolicy } from '../policies/lead.policy';

export const leadRouter = Router();

// Dashboard & Search & Duplicates
leadRouter.get('/dashboard', checkPermission(LeadPolicy.canView()), LeadController.getDashboard);
leadRouter.get('/search', checkPermission(LeadPolicy.canView()), LeadController.search);
leadRouter.get('/check-duplicates', checkPermission(LeadPolicy.canView()), LeadController.checkDuplicates);

// Bulk Ops
leadRouter.patch('/bulk-assign', checkPermission(LeadPolicy.canAssign()), checkIdempotency, LeadController.bulkAssign);

// Lead CRUD
leadRouter.post('/', checkPermission(LeadPolicy.canCreate()), checkIdempotency, LeadController.create);
leadRouter.get('/', checkPermission(LeadPolicy.canView()), LeadController.search);
leadRouter.get('/:id', checkPermission(LeadPolicy.canView()), LeadController.getById);
leadRouter.patch('/:id', checkPermission(LeadPolicy.canUpdate()), LeadController.update);
leadRouter.delete('/:id', checkPermission(LeadPolicy.canDelete()), LeadController.delete);

// Status & Assignment
leadRouter.patch('/:id/status', checkPermission(LeadPolicy.canUpdate()), checkIdempotency, LeadController.updateStatus);
leadRouter.patch('/:id/assign', checkPermission(LeadPolicy.canAssign()), checkIdempotency, LeadController.assign);

// Lead Activities & Timeline
leadRouter.post('/:id/activities', checkPermission(LeadPolicy.canUpdate()), checkIdempotency, LeadActivityController.create);
leadRouter.get('/:id/activities', checkPermission(LeadPolicy.canView()), LeadActivityController.getByLeadId);
leadRouter.get('/:id/timeline', checkPermission(LeadPolicy.canView()), LeadActivityController.getTimeline);
leadRouter.patch('/activities/:id', checkPermission(LeadPolicy.canUpdate()), LeadActivityController.update);
