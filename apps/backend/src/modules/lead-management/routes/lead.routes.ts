import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { LeadController } from '../controllers/lead.controller';
import { LeadActivityController } from '../controllers/lead-activity.controller';
import { LeadPolicy } from '../policies/lead.policy';

import { LeadVisitController } from '../controllers/lead-visit.controller';
import { StaffController } from '../../staff-management/controllers/staff.controller';

export const leadRouter = Router();

// Dashboard, Search, Duplicates, Visits Queue, Counselling Metrics & Counsellors
leadRouter.get(
  '/counsellors',
  checkPermission(LeadPolicy.canView()),
  StaffController.getCounsellors,
);
leadRouter.get('/dashboard', checkPermission(LeadPolicy.canView()), LeadController.getDashboard);
leadRouter.get(
  '/counselling/metrics',
  checkPermission(LeadPolicy.canView()),
  LeadController.getCounsellingMetrics,
);
leadRouter.get('/search', checkPermission(LeadPolicy.canView()), LeadController.search);
leadRouter.get(
  '/check-duplicates',
  checkPermission(LeadPolicy.canView()),
  LeadController.checkDuplicates,
);
leadRouter.get('/visits', checkPermission(LeadPolicy.canView()), LeadVisitController.getQueue);
leadRouter.patch(
  '/visits/:id',
  checkPermission(LeadPolicy.canUpdate()),
  LeadVisitController.updateStatus,
);

// Bulk Ops
leadRouter.patch(
  '/bulk-assign',
  checkPermission(LeadPolicy.canAssign()),
  checkIdempotency,
  LeadController.bulkAssign,
);

// Lead CRUD
leadRouter.post(
  '/',
  checkPermission(LeadPolicy.canCreate()),
  checkIdempotency,
  LeadController.create,
);
leadRouter.get('/', checkPermission(LeadPolicy.canView()), LeadController.search);
leadRouter.get('/:id', checkPermission(LeadPolicy.canView()), LeadController.getById);
leadRouter.patch('/:id', checkPermission(LeadPolicy.canUpdate()), LeadController.update);
leadRouter.delete('/:id', checkPermission(LeadPolicy.canDelete()), LeadController.delete);

// Status, Assignment, Qualification & Handoff
leadRouter.patch(
  '/:id/status',
  checkPermission(LeadPolicy.canUpdate()),
  checkIdempotency,
  LeadController.updateStatus,
);
leadRouter.patch(
  '/:id/assign',
  checkPermission(LeadPolicy.canAssign()),
  checkIdempotency,
  LeadController.assign,
);
leadRouter.post('/:id/qualify', checkPermission(LeadPolicy.canUpdate()), LeadController.qualify);
leadRouter.post(
  '/:id/convert',
  checkPermission(LeadPolicy.canCreate()),
  checkIdempotency,
  LeadController.convert,
);

// Lead Activities & Timeline & Follow-ups Due
leadRouter.get(
  '/followups/due',
  checkPermission(LeadPolicy.canView()),
  LeadActivityController.getDueFollowUps,
);
leadRouter.post(
  '/:id/activities',
  checkPermission(LeadPolicy.canUpdate()),
  checkIdempotency,
  LeadActivityController.create,
);
leadRouter.get(
  '/:id/activities',
  checkPermission(LeadPolicy.canView()),
  LeadActivityController.getByLeadId,
);
leadRouter.get(
  '/:id/timeline',
  checkPermission(LeadPolicy.canView()),
  LeadActivityController.getTimeline,
);
leadRouter.patch(
  '/activities/:id',
  checkPermission(LeadPolicy.canUpdate()),
  LeadActivityController.update,
);
leadRouter.delete(
  '/activities/:id',
  checkPermission(LeadPolicy.canDelete()),
  LeadActivityController.delete,
);

// Lead Visits & Counselling
leadRouter.post(
  '/:id/visits',
  checkPermission(LeadPolicy.canUpdate()),
  checkIdempotency,
  LeadVisitController.schedule,
);
leadRouter.get(
  '/:id/visits',
  checkPermission(LeadPolicy.canView()),
  LeadVisitController.getByLeadId,
);
leadRouter.delete(
  '/visits/:id',
  checkPermission(LeadPolicy.canDelete()),
  LeadVisitController.delete,
);
