"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionController = void 0;
const QuestionVersionService_1 = require("../services/QuestionVersionService");
class VersionController {
    static async getVersionsHistory(req, res) {
        try {
            const { id } = req.params; // Question ID
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const versions = await VersionController.versionService.getVersionsHistory(id, schoolId);
            return res.status(200).json(versions);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to get version history.' });
        }
    }
    static async restoreVersion(req, res) {
        try {
            const { id } = req.params; // Question ID
            const { versionNumber } = req.body;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !versionNumber) {
                return res.status(400).json({ error: 'Context credentials and versionNumber are required.' });
            }
            const restored = await VersionController.versionService.restoreVersion(id, versionNumber, schoolId, userId);
            return res.status(200).json(restored);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to restore past version.' });
        }
    }
}
exports.VersionController = VersionController;
VersionController.versionService = new QuestionVersionService_1.QuestionVersionService();
exports.default = VersionController;
