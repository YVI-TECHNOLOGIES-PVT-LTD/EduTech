"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
const config_service_1 = require("../services/config.service");
class ConfigController {
    /**
     * Resolves and returns the configuration for the authenticated school tenant.
     */
    static async getConfig(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) {
                return res.status(400).json({ error: 'School context could not be resolved from session.' });
            }
            const config = await ConfigController.configService.getConfig(schoolId);
            return res.status(200).json(config);
        }
        catch (error) {
            console.error('[ASSESSMENT CONFIG GET ERROR]', error);
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch configuration' });
        }
    }
    /**
     * Validates and updates the configuration for the authenticated school tenant.
     */
    static async updateConfig(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId) {
                return res.status(400).json({ error: 'School or User context could not be resolved from session.' });
            }
            const config = await ConfigController.configService.updateConfig(schoolId, userId, req.body);
            return res.status(200).json(config);
        }
        catch (error) {
            console.error('[ASSESSMENT CONFIG UPDATE ERROR]', error);
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update configuration' });
        }
    }
}
exports.ConfigController = ConfigController;
ConfigController.configService = new config_service_1.ConfigService();
