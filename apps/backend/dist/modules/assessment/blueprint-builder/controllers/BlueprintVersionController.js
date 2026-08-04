"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintVersionController = void 0;
const BlueprintVersionService_1 = require("../services/BlueprintVersionService");
class BlueprintVersionController {
    static async getHistory(req, res) {
        try {
            const { id } = req.params; // Blueprint ID
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const history = await BlueprintVersionController.versionService.getHistory(id, schoolId);
            return res.status(200).json(history);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch history timeline.' });
        }
    }
    static async restoreVersion(req, res) {
        try {
            const { id } = req.params; // Blueprint ID
            const { versionNumber } = req.body;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !versionNumber) {
                return res.status(400).json({ error: 'Context credentials and versionNumber are required.' });
            }
            const restored = await BlueprintVersionController.versionService.restoreVersion(id, versionNumber, schoolId, userId);
            return res.status(200).json(restored);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to rollback blueprint.' });
        }
    }
}
exports.BlueprintVersionController = BlueprintVersionController;
BlueprintVersionController.versionService = new BlueprintVersionService_1.BlueprintVersionService();
exports.default = BlueprintVersionController;
