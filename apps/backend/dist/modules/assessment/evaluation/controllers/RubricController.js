"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RubricController = void 0;
const RubricService_1 = require("../services/RubricService");
const EvaluationValidator_1 = require("../validators/EvaluationValidator");
class RubricController {
    static async listRubrics(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await RubricController.service.listRubrics(schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list rubrics.' });
        }
    }
    static async createRubric(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const validated = EvaluationValidator_1.EvaluationValidator.validateRubric(req.body);
            const data = await RubricController.service.createRubric(schoolId, validated);
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to create rubric.' });
        }
    }
}
exports.RubricController = RubricController;
RubricController.service = new RubricService_1.RubricService();
exports.default = RubricController;
