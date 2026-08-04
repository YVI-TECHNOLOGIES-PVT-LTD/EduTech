"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionController = void 0;
const PromotionEngine_1 = require("../services/PromotionEngine");
const ResultValidator_1 = require("../validators/ResultValidator");
class PromotionController {
    static async processPromotion(req, res) {
        try {
            const userId = req.context?.user?.id;
            if (!userId)
                return res.status(400).json({ error: 'Context credentials missing.' });
            const validated = ResultValidator_1.ResultValidator.validatePromotion(req.body);
            const decision = await PromotionController.service.processStudentPromotion(validated.student_id, validated.academic_year_id, req.body.gpa || 0.00, req.body.backlogs_count || 0, userId);
            return res.status(201).json(decision);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to process student promotion.' });
        }
    }
}
exports.PromotionController = PromotionController;
PromotionController.service = new PromotionEngine_1.PromotionEngine();
exports.default = PromotionController;
