"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationJobController = void 0;
const GenerationJobService_1 = require("../services/GenerationJobService");
const GenerationJobRepository_1 = require("../repositories/GenerationJobRepository");
const PaperValidator_1 = require("../validators/PaperValidator");
class GenerationJobController {
    static async listJobs(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const jobs = await GenerationJobController.jobRepo.listJobs(schoolId);
            return res.status(200).json(jobs);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to list generation jobs.' });
        }
    }
    static async createJob(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const validated = PaperValidator_1.PaperValidator.validateGenerationJob(req.body);
            // Additional details needed for paper generation
            const payload = {
                blueprint_id: validated.blueprint_id,
                template_id: validated.template_id,
                subject_id: req.body.subject_id,
                name: req.body.name,
                description: req.body.description
            };
            const job = await GenerationJobController.jobService.queueGenerationJob(schoolId, userId, payload);
            return res.status(202).json(job);
        }
        catch (error) {
            return res.status(400).json({ error: error.message || 'Failed to queue generation job.' });
        }
    }
}
exports.GenerationJobController = GenerationJobController;
GenerationJobController.jobService = new GenerationJobService_1.GenerationJobService();
GenerationJobController.jobRepo = new GenerationJobRepository_1.GenerationJobRepository();
exports.default = GenerationJobController;
