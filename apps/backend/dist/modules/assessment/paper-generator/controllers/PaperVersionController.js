"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperVersionController = void 0;
const PaperVersionService_1 = require("../services/PaperVersionService");
class PaperVersionController {
    static async getHistory(req, res) {
        try {
            const { id } = req.params;
            const history = await PaperVersionController.versionService.getHistory(id);
            return res.status(200).json(history);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch versions history.' });
        }
    }
}
exports.PaperVersionController = PaperVersionController;
PaperVersionController.versionService = new PaperVersionService_1.PaperVersionService();
exports.default = PaperVersionController;
