"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraduationController = void 0;
const GraduationWorkflowService_1 = require("../services/GraduationWorkflowService");
const GraduationRepository_1 = require("../repositories/GraduationRepository");
const AcademicRecordsValidator_1 = require("../validators/AcademicRecordsValidator");
class GraduationController {
    static async transitionGraduation(req, res) {
        try {
            const validated = AcademicRecordsValidator_1.AcademicRecordsValidator.validateGraduationApproval(req.body);
            const data = await GraduationController.workflowService.transitionGraduation(validated.student_id, validated.status);
            return res.status(200).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to update graduation candidacy.' });
        }
    }
    static async approveClearance(req, res) {
        try {
            const { student_id, clearance_type } = req.body;
            const data = await GraduationController.repo.approveClearance(student_id, clearance_type);
            return res.status(201).json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to signoff clearance item.' });
        }
    }
}
exports.GraduationController = GraduationController;
GraduationController.workflowService = new GraduationWorkflowService_1.GraduationWorkflowService();
GraduationController.repo = new GraduationRepository_1.GraduationRepository();
exports.default = GraduationController;
