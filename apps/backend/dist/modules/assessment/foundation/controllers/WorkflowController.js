"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const WorkflowDefinitionService_1 = require("../services/WorkflowDefinitionService");
const WorkflowStepService_1 = require("../services/WorkflowStepService");
const WorkflowTransitionService_1 = require("../services/WorkflowTransitionService");
class WorkflowController {
    // ==========================================
    // WORKFLOW DEFINITIONS
    // ==========================================
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
    static async getWorkflow(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
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
    static async createWorkflow(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            }
            const workflow = await WorkflowController.workflowService.createWorkflow(schoolId, userId, req.body);
            return res.status(201).json(workflow);
        }
        catch (error) {
            console.error('[WORKFLOW CREATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create workflow' });
        }
    }
    static async updateWorkflow(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            }
            const workflow = await WorkflowController.workflowService.updateWorkflow(id, schoolId, userId, req.body);
            return res.status(200).json(workflow);
        }
        catch (error) {
            console.error('[WORKFLOW UPDATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update workflow' });
        }
    }
    static async deleteWorkflow(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            }
            await WorkflowController.workflowService.deleteWorkflow(id, schoolId, userId);
            return res.status(200).json({ message: 'Workflow successfully deleted.' });
        }
        catch (error) {
            console.error('[WORKFLOW DELETE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete workflow' });
        }
    }
    // ==========================================
    // WORKFLOW STEPS
    // ==========================================
    static async getSteps(req, res) {
        try {
            const { id } = req.params; // workflow definition ID
            const steps = await WorkflowController.stepService.getStepsByWorkflow(id);
            return res.status(200).json(steps);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch steps' });
        }
    }
    static async addStep(req, res) {
        try {
            const { id } = req.params; // workflow definition ID
            const step = await WorkflowController.stepService.addStep(id, req.body);
            return res.status(201).json(step);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to add step' });
        }
    }
    static async updateStep(req, res) {
        try {
            const { id } = req.params; // step ID
            const updated = await WorkflowController.stepService.updateStep(id, req.body);
            return res.status(200).json(updated);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update step' });
        }
    }
    static async deleteStep(req, res) {
        try {
            const { id } = req.params; // step ID
            await WorkflowController.stepService.removeStep(id);
            return res.status(200).json({ message: 'Step successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete step' });
        }
    }
    // ==========================================
    // WORKFLOW TRANSITIONS
    // ==========================================
    static async getTransitions(req, res) {
        try {
            const { id } = req.params; // workflow definition ID
            const transitions = await WorkflowController.transitionService.getTransitionsByWorkflow(id);
            return res.status(200).json(transitions);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch transitions' });
        }
    }
    static async addTransition(req, res) {
        try {
            const { id } = req.params; // workflow definition ID
            const transition = await WorkflowController.transitionService.addTransition(id, req.body);
            return res.status(201).json(transition);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to add transition' });
        }
    }
    static async updateTransition(req, res) {
        try {
            const { id } = req.params; // transition ID
            const updated = await WorkflowController.transitionService.updateTransition(id, req.body);
            return res.status(200).json(updated);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update transition' });
        }
    }
    static async deleteTransition(req, res) {
        try {
            const { id } = req.params; // transition ID
            await WorkflowController.transitionService.removeTransition(id);
            return res.status(200).json({ message: 'Transition successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete transition' });
        }
    }
}
exports.WorkflowController = WorkflowController;
WorkflowController.workflowService = new WorkflowDefinitionService_1.WorkflowDefinitionService();
WorkflowController.stepService = new WorkflowStepService_1.WorkflowStepService();
WorkflowController.transitionService = new WorkflowTransitionService_1.WorkflowTransitionService();
