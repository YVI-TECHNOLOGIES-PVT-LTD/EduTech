"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentConfigurationController = void 0;
const AssessmentConfigurationService_1 = require("../services/AssessmentConfigurationService");
class AssessmentConfigurationController {
    static async listConfigurations(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) {
                return res.status(400).json({ error: 'School context could not be resolved.' });
            }
            const configs = await AssessmentConfigurationController.configService.listAllConfigs(schoolId);
            return res.status(200).json(configs);
        }
        catch (error) {
            console.error('[CONFIG LIST ERROR]', error);
            return res.status(error.status || 500).json({ error: error.message || 'Failed to list configurations' });
        }
    }
    static async getConfiguration(req, res) {
        try {
            const { id } = req.params;
            const config = await AssessmentConfigurationController.configService.getConfigById(id);
            return res.status(200).json(config);
        }
        catch (error) {
            console.error('[CONFIG GET ERROR]', error);
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch configuration' });
        }
    }
    static async createConfiguration(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            }
            const config = await AssessmentConfigurationController.configService.createConfig(schoolId, userId, req.body);
            return res.status(201).json(config);
        }
        catch (error) {
            console.error('[CONFIG CREATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create configuration' });
        }
    }
    static async updateConfiguration(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            }
            const config = await AssessmentConfigurationController.configService.updateConfig(id, schoolId, userId, req.body);
            return res.status(200).json(config);
        }
        catch (error) {
            console.error('[CONFIG UPDATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update configuration' });
        }
    }
    static async deleteConfiguration(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            }
            await AssessmentConfigurationController.configService.deleteConfig(id, schoolId, userId);
            return res.status(200).json({ message: 'Configuration successfully deleted.' });
        }
        catch (error) {
            console.error('[CONFIG DELETE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete configuration' });
        }
    }
    static async cloneConfiguration(req, res) {
        try {
            const { id } = req.body; // target configuration ID to clone
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !id) {
                return res.status(400).json({ error: 'Target configuration ID and context credentials are required.' });
            }
            const cloned = await AssessmentConfigurationController.configService.cloneConfig(id, schoolId, userId);
            return res.status(201).json(cloned);
        }
        catch (error) {
            console.error('[CONFIG CLONE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to clone configuration' });
        }
    }
    static async resetConfiguration(req, res) {
        try {
            const { id } = req.body;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !id) {
                return res.status(400).json({ error: 'Target configuration ID and context credentials are required.' });
            }
            const reset = await AssessmentConfigurationController.configService.resetConfig(id, schoolId, userId);
            return res.status(200).json(reset);
        }
        catch (error) {
            console.error('[CONFIG RESET ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to reset configuration' });
        }
    }
    static async validateConfiguration(req, res) {
        try {
            const validated = AssessmentConfigurationController.configService.validateConfig(req.body);
            return res.status(200).json({ valid: true, data: validated });
        }
        catch (error) {
            return res.status(400).json({ valid: false, error: error.message });
        }
    }
}
exports.AssessmentConfigurationController = AssessmentConfigurationController;
AssessmentConfigurationController.configService = new AssessmentConfigurationService_1.AssessmentConfigurationService();
