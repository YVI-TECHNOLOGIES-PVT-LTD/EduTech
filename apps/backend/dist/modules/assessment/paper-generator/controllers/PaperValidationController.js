"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperValidationController = void 0;
const PaperValidationEngine_1 = require("../services/PaperValidationEngine");
class PaperValidationController {
    static async validatePaper(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const report = await PaperValidationController.validationEngine.validatePaper(id, schoolId, userId);
            return res.status(200).json(report);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to execute validation pipeline.' });
        }
    }
}
exports.PaperValidationController = PaperValidationController;
PaperValidationController.validationEngine = new PaperValidationEngine_1.PaperValidationEngine();
exports.default = PaperValidationController;
