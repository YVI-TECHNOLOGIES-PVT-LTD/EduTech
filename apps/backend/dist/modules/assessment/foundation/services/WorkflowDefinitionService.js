"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowDefinitionService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const WorkflowDefinitionRepository_1 = require("../repositories/WorkflowDefinitionRepository");
const WorkflowStepRepository_1 = require("../repositories/WorkflowStepRepository");
const WorkflowTransitionRepository_1 = require("../repositories/WorkflowTransitionRepository");
const workflow_dto_1 = require("../dto/workflow.dto");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
class WorkflowDefinitionService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.definitionRepo = new WorkflowDefinitionRepository_1.WorkflowDefinitionRepository();
        this.stepRepo = new WorkflowStepRepository_1.WorkflowStepRepository();
        this.transitionRepo = new WorkflowTransitionRepository_1.WorkflowTransitionRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async listWorkflows(schoolId, correlationId) {
        this.logInfo(`Listing workflows for school: ${schoolId}`, correlationId);
        return this.definitionRepo.listAll(schoolId);
    }
    async getWorkflowById(id, schoolId, correlationId) {
        this.logInfo(`Fetching workflow details for: ${id}`, correlationId);
        const definition = await this.definitionRepo.findById(id, schoolId);
        if (!definition) {
            throw new NotFoundError_1.NotFoundError(`Workflow definition not found with ID: ${id}`);
        }
        const steps = await this.stepRepo.findByWorkflowId(id);
        const transitions = await this.transitionRepo.findByWorkflowId(id);
        return {
            ...definition,
            steps,
            transitions
        };
    }
    async createWorkflow(schoolId, userId, payload, correlationId) {
        const validated = this.validate(workflow_dto_1.createWorkflowSchema, payload);
        this.logInfo(`Creating workflow "${validated.name}" for school: ${schoolId}`, correlationId);
        const { steps, transitions, ...definitionData } = validated;
        // 1. Create definition
        const definition = await this.definitionRepo.create({
            ...definitionData,
            school_id: schoolId,
            version: 1,
            is_active: true
        });
        // 2. Create steps
        let createdSteps = [];
        if (steps && steps.length > 0) {
            const stepsPayload = steps.map(s => ({
                ...s,
                workflow_id: definition.id
            }));
            createdSteps = await this.stepRepo.createBulk(stepsPayload);
        }
        // 3. Create transitions
        let createdTransitions = [];
        if (transitions && transitions.length > 0) {
            const transitionsPayload = transitions.map(t => ({
                ...t,
                workflow_id: definition.id
            }));
            createdTransitions = await this.transitionRepo.createBulk(transitionsPayload);
        }
        const result = {
            ...definition,
            steps: createdSteps,
            transitions: createdTransitions
        };
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_WORKFLOW_CREATE',
            entityName: 'assessment_workflow_definitions',
            entityId: definition.id,
            afterState: result,
            correlationId
        });
        // Publish Event
        await event_bus_service_1.EventBus.publish('AssessmentWorkflowCreated', { workflowId: definition.id, schoolId, userId });
        return result;
    }
    async updateWorkflow(id, schoolId, userId, payload, correlationId) {
        const validated = this.validate(workflow_dto_1.updateWorkflowSchema, payload);
        this.logInfo(`Updating workflow definition: ${id}`, correlationId);
        const beforeState = await this.getWorkflowById(id, schoolId, correlationId);
        const { steps, transitions, ...definitionData } = validated;
        // 1. Update main definition
        const updatedDefinition = await this.definitionRepo.update(id, schoolId, definitionData);
        // 2. Update steps if provided
        if (steps) {
            await this.stepRepo.deleteByWorkflowId(id);
            if (steps.length > 0) {
                const stepsPayload = steps.map(s => ({
                    ...s,
                    workflow_id: id
                }));
                await this.stepRepo.createBulk(stepsPayload);
            }
        }
        // 3. Update transitions if provided
        if (transitions) {
            await this.transitionRepo.deleteByWorkflowId(id);
            if (transitions.length > 0) {
                const transitionsPayload = transitions.map(t => ({
                    ...t,
                    workflow_id: id
                }));
                await this.transitionRepo.createBulk(transitionsPayload);
            }
        }
        const result = await this.getWorkflowById(id, schoolId, correlationId);
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_WORKFLOW_UPDATE',
            entityName: 'assessment_workflow_definitions',
            entityId: id,
            beforeState,
            afterState: result,
            correlationId
        });
        // Detect publish or archive events to emit custom signals
        if (validated.is_active === true && beforeState.is_active === false) {
            await event_bus_service_1.EventBus.publish('AssessmentWorkflowPublished', { workflowId: id, schoolId, userId });
        }
        else if (validated.is_active === false && beforeState.is_active === true) {
            await event_bus_service_1.EventBus.publish('AssessmentWorkflowArchived', { workflowId: id, schoolId, userId });
        }
        return result;
    }
    async deleteWorkflow(id, schoolId, userId, correlationId) {
        this.logInfo(`Soft deleting workflow: ${id}`, correlationId);
        const beforeState = await this.getWorkflowById(id, schoolId, correlationId);
        await this.definitionRepo.softDelete(id, schoolId, userId);
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_WORKFLOW_DELETE',
            entityName: 'assessment_workflow_definitions',
            entityId: id,
            beforeState,
            afterState: { ...beforeState, is_deleted: true },
            correlationId
        });
    }
}
exports.WorkflowDefinitionService = WorkflowDefinitionService;
