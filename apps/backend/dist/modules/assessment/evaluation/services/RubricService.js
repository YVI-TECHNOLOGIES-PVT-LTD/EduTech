"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RubricService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const RubricRepository_1 = require("../repositories/RubricRepository");
class RubricService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new RubricRepository_1.RubricRepository();
    }
    async createRubric(schoolId, payload, correlationId) {
        this.logInfo(`Creating new Rubric scoring sheet for question: ${payload.question_snapshot_id}`, correlationId);
        return this.repo.createRubric(schoolId, payload);
    }
    async listRubrics(schoolId, correlationId) {
        this.logInfo(`Fetching rubrics list for school: ${schoolId}`, correlationId);
        return this.repo.listRubrics(schoolId);
    }
}
exports.RubricService = RubricService;
exports.default = RubricService;
