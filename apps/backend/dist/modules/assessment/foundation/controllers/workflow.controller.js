"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_engine_service_1 = require("../services/workflow-engine.service");
class WorkflowController {
    /**
     * Lists active workflows for the school.
     */
    static async listWorkflows(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) {
                return res.status(400).json({ error: 'School context could not be resolved.' });
            }
            const workflows = await WorkflowController.workflowService.listWorkflows(schoolId);
            return res.status(200).json(workflows);
        }
        catch (error) {
            console.error('[WORKFLOW LIST ERROR]', error);
            return res.status(error.status || 500).json({ error: error.message || 'Failed to list workflows' });
        }
    }
    /**
     * Retrieves a single workflow with nested details.
     */
    static async getWorkflowById(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const { id } = req.params;
            if (!schoolId) {
                return res.status(400).json({ error: 'School context could not be resolved.' });
            }
            const workflow = await WorkflowController.workflowService.getWorkflowById(id, schoolId);
            return res.status(200).json(workflow);
        }
        catch (error) {
            console.error('[WORKFLOW GET ERROR]', error);
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch workflow' });
        }
    }
    /**
     * Creates a workflow with associated steps and transitions.
     */
    static async createWorkflow(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'School or User context could not be resolved.' });
            }
            const workflow = await WorkflowController.workflowService.createWorkflow(schoolId, userId, req.body);
            return res.status(201).json(workflow);
        }
        catch (error) {
            console.error('[WORKFLOW CREATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create workflow' });
        }
    }
    /**
     * Updates workflow parameters and nested tables.
     */
    static async updateWorkflow(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            const { id } = req.params;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'School or User context could not be resolved.' });
            }
            const workflow = await WorkflowController.workflowService.updateWorkflow(id, schoolId, userId, req.body);
            return res.status(200).json(workflow);
        }
        catch (error) {
            console.error('[WORKFLOW UPDATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update workflow' });
        }
    }
    /**
     * Soft deletes a workflow.
     */
    static async deleteWorkflow(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            const { id } = req.params;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'School or User context could not be resolved.' });
            }
            await WorkflowController.workflowService.deleteWorkflow(id, schoolId, userId);
            return res.status(200).json({ message: 'Workflow successfully deleted.' });
        }
        catch (error) {
            console.error('[WORKFLOW DELETE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete workflow' });
        }
    }
}
exports.WorkflowController = WorkflowController;
WorkflowController.workflowService = new workflow_engine_service_1.WorkflowEngineService();
