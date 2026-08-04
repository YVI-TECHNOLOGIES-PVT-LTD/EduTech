"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COController = void 0;
const COAttainmentService_1 = require("../services/COAttainmentService");
class COController {
    static async calculateAttainment(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context credentials missing.' });
            const { subject_id, co_code } = req.body;
            const data = await COController.service.calculateCoAttainment(schoolId, subject_id, co_code);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to calculate course outcome attainment.' });
        }
    }
}
exports.COController = COController;
COController.service = new COAttainmentService_1.COAttainmentService();
exports.default = COController;
