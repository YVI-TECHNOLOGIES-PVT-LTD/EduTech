"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRecordsController = void 0;
const AcademicRecordRepository_1 = require("../repositories/AcademicRecordRepository");
const AcademicRecordService_1 = require("../services/AcademicRecordService");
const AcademicStandingEngine_1 = require("../services/AcademicStandingEngine");
const AcademicRecordsValidator_1 = require("../validators/AcademicRecordsValidator");
class AcademicRecordsController {
    static async saveRecord(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context credentials missing.' });
            const validated = AcademicRecordsValidator_1.AcademicRecordsValidator.validateAcademicRecord(req.body);
            const data = await AcademicRecordsController.service.registerPublishedResult(schoolId, validated.student_id, validated.cgpa, validated.total_credits);
            // Re-evaluate standing check on new result registration
            await AcademicRecordsController.standingEngine.evaluateStanding(schoolId, validated.student_id, validated.cgpa, 0 // 0 mock backlogs for evaluation
            );
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to save academic record.' });
        }
    }
}
exports.AcademicRecordsController = AcademicRecordsController;
AcademicRecordsController.repo = new AcademicRecordRepository_1.AcademicRecordRepository();
AcademicRecordsController.service = new AcademicRecordService_1.AcademicRecordService();
AcademicRecordsController.standingEngine = new AcademicStandingEngine_1.AcademicStandingEngine();
exports.default = AcademicRecordsController;
