"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POController = void 0;
const POAttainmentService_1 = require("../services/POAttainmentService");
class POController {
    static async calculateAttainment(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context credentials missing.' });
            const { po_code } = req.body;
            const data = await POController.service.calculatePoAttainment(schoolId, po_code);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to calculate program outcome attainment.' });
        }
    }
}
exports.POController = POController;
POController.service = new POAttainmentService_1.POAttainmentService();
exports.default = POController;
