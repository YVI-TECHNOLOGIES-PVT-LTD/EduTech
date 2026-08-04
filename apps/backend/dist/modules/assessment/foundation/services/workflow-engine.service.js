"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngineService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const foundation_repository_1 = require("../repositories/foundation.repository");
const workflow_dto_1 = require("../dto/workflow.dto");
const AuditService_1 = require("../../../admission/services/AuditService");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
class WorkflowEngineService extends BaseService_1.BaseService {
    constructor() {
        super();
        this.repo = new foundation_repository_1.FoundationRepository();
        this.auditService = new AuditService_1.AuditService();
    }
    /**
     * Lists active workflows for a school.
     */
    async listWorkflows(schoolId, correlationId) {
        this.logInfo(`Listing workflows for school: ${schoolId}`, correlationId);
        return this.repo.listWorkflows(schoolId);
    }
    /**
     * Resolves a single workflow by ID.
     */
    async getWorkflowById(workflowId, schoolId, correlationId) {
        this.logInfo(`Fetching workflow: ${workflowId}`, correlationId);
        const workflow = await this.repo.findWorkflowById(workflowId, schoolId);
        if (!workflow) {
            throw new NotFoundError_1.NotFoundError(`Workflow not found with ID: ${workflowId}`);
        }
        return workflow;
    }
    /**
     * Creates a new workflow, validating the input schemas.
     */
    async createWorkflow(schoolId, userId, payload, correlationId) {
        const validated = this.validate(workflow_dto_1.createWorkflowSchema, payload);
        this.logInfo(`Creating workflow "${validated.name}" for school: ${schoolId}`, correlationId);
        const newWorkflow = await this.repo.createWorkflow(schoolId, validated);
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_WORKFLOW_CREATE',
            entityName: 'assessment_workflow_definitions',
            entityId: newWorkflow.id,
            afterState: newWorkflow,
            correlationId
        });
        return newWorkflow;
    }
    /**
     * Updates an existing workflow, logging changes in the audit logs.
     */
    async updateWorkflow(workflowId, schoolId, userId, payload, correlationId) {
        const validated = this.validate(workflow_dto_1.updateWorkflowSchema, payload);
        this.logInfo(`Updating workflow: ${workflowId}`, correlationId);
        const beforeState = await this.getWorkflowById(workflowId, schoolId, correlationId);
        const updatedWorkflow = await this.repo.updateWorkflow(workflowId, schoolId, validated);
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_WORKFLOW_UPDATE',
            entityName: 'assessment_workflow_definitions',
            entityId: workflowId,
            beforeState,
            afterState: updatedWorkflow,
            correlationId
        });
        return updatedWorkflow;
    }
    /**
     * Soft deletes a workflow definition.
     */
    async deleteWorkflow(workflowId, schoolId, userId, correlationId) {
        this.logInfo(`Soft deleting workflow: ${workflowId}`, correlationId);
        const beforeState = await this.getWorkflowById(workflowId, schoolId, correlationId);
        await this.repo.deleteWorkflow(workflowId, schoolId, userId);
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_WORKFLOW_DELETE',
            entityName: 'assessment_workflow_definitions',
            entityId: workflowId,
            beforeState,
            afterState: { ...beforeState, is_deleted: true },
            correlationId
        });
    }
    /**
     * Dynamic verification checking if a transition is valid under registered transitions rules.
     */
    async validateTransition(workflowId, schoolId, fromStatus, toStatus, correlationId) {
        const workflow = await this.getWorkflowById(workflowId, schoolId, correlationId);
        const transition = workflow.transitions.find((t) => t.from_status === fromStatus && t.to_status === toStatus);
        if (!transition) {
            this.logInfo(`Transition from "${fromStatus}" to "${toStatus}" is invalid/unregistered`, correlationId);
            return false;
        }
        return true;
    }
}
exports.WorkflowEngineService = WorkflowEngineService;
