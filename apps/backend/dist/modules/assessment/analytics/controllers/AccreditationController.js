"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccreditationController = void 0;
const AccreditationService_1 = require("../services/AccreditationService");
class AccreditationController {
    static async compileReport(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context details missing.' });
            const { report_type } = req.body;
            const data = await AccreditationController.service.compileAccreditationReport(schoolId, report_type, userId);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to compile accreditation report.' });
        }
    }
}
exports.AccreditationController = AccreditationController;
AccreditationController.service = new AccreditationService_1.AccreditationService();
exports.default = AccreditationController;
