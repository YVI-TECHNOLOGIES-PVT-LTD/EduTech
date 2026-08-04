"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintController = void 0;
const BlueprintService_1 = require("../services/BlueprintService");
const BlueprintRuleEngineService_1 = require("../services/BlueprintRuleEngineService");
class BlueprintController {
    static async listBlueprints(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const queryParams = {
                ...req.query,
                page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
                limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 10
            };
            const result = await BlueprintController.blueprintService.listBlueprints(schoolId, queryParams);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to list blueprints' });
        }
    }
    static async getBlueprintById(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const blueprint = await BlueprintController.blueprintService.getBlueprintById(id, schoolId);
            return res.status(200).json(blueprint);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch blueprint' });
        }
    }
    static async createBlueprint(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const blueprint = await BlueprintController.blueprintService.createBlueprint(schoolId, userId, req.body);
            return res.status(201).json(blueprint);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create blueprint' });
        }
    }
    static async updateBlueprint(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const blueprint = await BlueprintController.blueprintService.updateBlueprint(id, schoolId, userId, req.body);
            return res.status(200).json(blueprint);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update blueprint' });
        }
    }
    static async deleteBlueprint(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            await BlueprintController.blueprintService.deleteBlueprint(id, schoolId, userId);
            return res.status(200).json({ message: 'Blueprint successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete blueprint' });
        }
    }
    static async cloneBlueprint(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const cloned = await BlueprintController.blueprintService.cloneBlueprint(id, schoolId, userId, req.body);
            return res.status(201).json(cloned);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to clone blueprint' });
        }
    }
    static async validateBlueprint(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const report = await BlueprintController.ruleEngine.validateBlueprint(schoolId, req.body);
            return res.status(200).json(report);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Validation execution failed.' });
        }
    }
}
exports.BlueprintController = BlueprintController;
BlueprintController.blueprintService = new BlueprintService_1.BlueprintService();
BlueprintController.ruleEngine = new BlueprintRuleEngineService_1.BlueprintRuleEngineService();
exports.default = BlueprintController;
