import { Router } from 'express';
import { WorkflowController } from './workflow.controller';

export const workflowRouter = Router();

workflowRouter.get('/', WorkflowController.listWorkflows);
workflowRouter.post('/', WorkflowController.createWorkflow);
workflowRouter.post('/:id/clone', WorkflowController.cloneWorkflow);

workflowRouter.get('/runs', WorkflowController.getRuns);
workflowRouter.get('/runs/:runId/logs', WorkflowController.getLogs);
workflowRouter.post('/runs/:runId/nodes/:nodeId/decide', WorkflowController.submitDecision);

workflowRouter.get('/analytics', WorkflowController.getAnalytics);
