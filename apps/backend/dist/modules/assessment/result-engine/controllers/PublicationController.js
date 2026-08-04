"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationController = void 0;
const ResultPublicationService_1 = require("../services/ResultPublicationService");
const ResultValidator_1 = require("../validators/ResultValidator");
class PublicationController {
    static async publishResults(req, res) {
        try {
            const { id } = req.params; // Session ID
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials missing.' });
            const validated = ResultValidator_1.ResultValidator.validatePublish(req.body);
            const pub = await PublicationController.service.publishResults(id, schoolId, validated.target_portal, userId);
            return res.status(200).json(pub);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to publish results.' });
        }
    }
}
exports.PublicationController = PublicationController;
PublicationController.service = new ResultPublicationService_1.ResultPublicationService();
exports.default = PublicationController;
