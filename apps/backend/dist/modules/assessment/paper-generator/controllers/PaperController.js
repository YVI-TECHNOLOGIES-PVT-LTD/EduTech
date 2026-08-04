"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperController = void 0;
const PaperRepository_1 = require("../repositories/PaperRepository");
const PaperGeneratorService_1 = require("../services/PaperGeneratorService");
const PaperValidator_1 = require("../validators/PaperValidator");
class PaperController {
    static async listPapers(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const { subjectId, status, page, limit } = req.query;
            const result = await PaperController.repo.listPapers(schoolId, {
                subjectId: subjectId ? String(subjectId) : undefined,
                status: status ? String(status) : undefined,
                page: page ? parseInt(String(page), 10) : 1,
                limit: limit ? parseInt(String(limit), 10) : 10
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list papers.' });
        }
    }
    static async getPaperById(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const paper = await PaperController.repo.findPaperById(id, schoolId);
            return res.status(200).json(paper);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch paper.' });
        }
    }
    static async createPaper(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const validated = PaperValidator_1.PaperValidator.validateCreate(req.body);
            const paper = await PaperController.generator.generatePaper(schoolId, userId, {
                ...validated,
                description: validated.description || undefined
            });
            return res.status(201).json(paper);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to generate paper.' });
        }
    }
    static async deletePaper(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            await PaperController.repo.deletePaper(id, schoolId);
            return res.status(200).json({ message: 'Paper deleted successfully.' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to delete paper.' });
        }
    }
}
exports.PaperController = PaperController;
PaperController.repo = new PaperRepository_1.PaperRepository();
PaperController.generator = new PaperGeneratorService_1.PaperGeneratorService();
exports.default = PaperController;
