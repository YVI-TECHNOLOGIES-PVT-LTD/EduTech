"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperExportController = void 0;
const PaperExportService_1 = require("../services/PaperExportService");
const PaperValidator_1 = require("../validators/PaperValidator");
class PaperExportController {
    static async exportPaper(req, res) {
        try {
            const { id } = req.params;
            const userId = req.context?.user?.id;
            if (!userId)
                return res.status(400).json({ error: 'User context could not be resolved.' });
            const validated = PaperValidator_1.PaperValidator.validateExport(req.body);
            const log = await PaperExportController.exportService.triggerExport(id, validated.format, validated.type, userId);
            return res.status(200).json(log);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to trigger paper export.' });
        }
    }
}
exports.PaperExportController = PaperExportController;
PaperExportController.exportService = new PaperExportService_1.PaperExportService();
exports.default = PaperExportController;
