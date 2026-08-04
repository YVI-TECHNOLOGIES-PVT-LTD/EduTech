"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStepService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const WorkflowStepRepository_1 = require("../repositories/WorkflowStepRepository");
const workflow_dto_1 = require("../dto/workflow.dto");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
class WorkflowStepService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.stepRepo = new WorkflowStepRepository_1.WorkflowStepRepository();
    }
    async getStepsByWorkflow(workflowId, correlationId) {
        this.logInfo(`Fetching steps for workflow: ${workflowId}`, correlationId);
        return this.stepRepo.findByWorkflowId(workflowId);
    }
    async addStep(workflowId, payload, correlationId) {
        const validated = this.validate(workflow_dto_1.createWorkflowStepSchema, payload);
        this.logInfo(`Adding step to workflow: ${workflowId}`, correlationId);
        return this.stepRepo.create({
            ...validated,
            workflow_id: workflowId
        });
    }
    async updateStep(id, payload, correlationId) {
        this.logInfo(`Updating workflow step: ${id}`, correlationId);
        const existing = await this.stepRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Step not found with ID: ${id}`);
        }
        return this.stepRepo.update(id, payload);
    }
    async removeStep(id, correlationId) {
        this.logInfo(`Removing workflow step: ${id}`, correlationId);
        const existing = await this.stepRepo.findById(id);
        if (!existing) {
            throw new NotFoundError_1.NotFoundError(`Step not found with ID: ${id}`);
        }
        await this.stepRepo.delete(id);
    }
}
exports.WorkflowStepService = WorkflowStepService;
