"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowTransitionService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const WorkflowTransitionRepository_1 = require("../repositories/WorkflowTransitionRepository");
const workflow_dto_1 = require("../dto/workflow.dto");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
class WorkflowTransitionService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.transitionRepo = new WorkflowTransitionRepository_1.WorkflowTransitionRepository();
    }
    async getTransitionsByWorkflow(workflowId, correlationId) {
        this.logInfo(`Fetching transitions for workflow: ${workflowId}`, correlationId);
        return this.transitionRepo.findByWorkflowId(workflowId);
    }
    async addTransition(workflowId, payload, correlationId) {
        const validated = this.validate(workflow_dto_1.createWorkflowTransitionSchema, payload);
        this.logInfo(`Adding transition to workflow: ${workflowId}`, correlationId);
        return this.transitionRepo.create({
            ...validated,
            workflow_id: workflowId
        });
    }
    async updateTransition(id, payload, correlationId) {
        this.logInfo(`Updating workflow transition: ${id}`, correlationId);
        const existing = await this.transitionRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Transition not found with ID: ${id}`);
        }
        return this.transitionRepo.update(id, payload);
    }
    async removeTransition(id, correlationId) {
        this.logInfo(`Removing workflow transition: ${id}`, correlationId);
        const existing = await this.transitionRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Transition not found with ID: ${id}`);
        }
        await this.transitionRepo.delete(id);
    }
}
exports.WorkflowTransitionService = WorkflowTransitionService;
