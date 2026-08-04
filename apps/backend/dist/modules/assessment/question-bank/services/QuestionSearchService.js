"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionSearchService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const QuestionSearchRepository_1 = require("../repositories/QuestionSearchRepository");
const QuestionValidator_1 = require("../validators/QuestionValidator");
class QuestionSearchService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.searchRepo = new QuestionSearchRepository_1.QuestionSearchRepository();
    }
    async search(schoolId, queryParams, correlationId) {
        this.logInfo(`Searching questions with filters for school: ${schoolId}`, correlationId);
        const filters = QuestionValidator_1.QuestionValidator.validateSearch(queryParams);
        return this.searchRepo.searchQuestions(schoolId, filters);
    }
}
exports.QuestionSearchService = QuestionSearchService;
exports.default = QuestionSearchService;
