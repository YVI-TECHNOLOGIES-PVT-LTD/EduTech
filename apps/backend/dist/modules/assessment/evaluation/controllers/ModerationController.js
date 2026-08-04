"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationController = void 0;
const ModerationRepository_1 = require("../repositories/ModerationRepository");
const ModerationService_1 = require("../services/ModerationService");
const EvaluationValidator_1 = require("../validators/EvaluationValidator");
class ModerationController {
    static async listQueue(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const data = await ModerationController.repo.getQueue(schoolId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list moderation queue.' });
        }
    }
    static async resolveModeration(req, res) {
        try {
            const { id } = req.params; // Queue ID
            const moderatorId = req.context?.user?.id;
            if (!moderatorId)
                return res.status(400).json({ error: 'Moderator session credentials missing.' });
            const validated = EvaluationValidator_1.EvaluationValidator.validateModeration(req.body);
            if (validated.status === 'PENDING') {
                return res.status(400).json({ error: 'Cannot resolve a moderation queue item to PENDING.' });
            }
            const result = await ModerationController.service.resolveModeration(id, moderatorId, validated.moderator_marks, validated.status);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to resolve moderation item.' });
        }
    }
}
exports.ModerationController = ModerationController;
ModerationController.repo = new ModerationRepository_1.ModerationRepository();
ModerationController.service = new ModerationService_1.ModerationService();
exports.default = ModerationController;
