"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateVersionController = void 0;
const template_repository_1 = require("../repositories/template.repository");
const template_service_1 = require("../services/template.service");
const supabase_1 = require("../../../../config/supabase");
class TemplateVersionController {
    static async getHistory(req, res) {
        try {
            const { id } = req.params; // Template ID
            const { data, error } = await supabase_1.supabase
                .from('assessment_template_versions')
                .select('*')
                .eq('template_id', id)
                .order('version', { ascending: false });
            if (error)
                throw error;
            return res.status(200).json(data || []);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to fetch version history.' });
        }
    }
    static async restoreVersion(req, res) {
        try {
            const { id } = req.params; // Template ID
            const { versionNumber } = req.body;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId || !versionNumber) {
                return res.status(400).json({ error: 'Missing restorable details or target versionNumber.' });
            }
            // Find version snapshot
            const { data: verSnapshot, error: vError } = await supabase_1.supabase
                .from('assessment_template_versions')
                .select('*')
                .eq('template_id', id)
                .eq('version', versionNumber)
                .maybeSingle();
            if (vError)
                throw vError;
            if (!verSnapshot)
                return res.status(404).json({ error: `Snapshot version ${versionNumber} not found.` });
            const restored = await TemplateVersionController.templateService.updateTemplate(id, schoolId, userId, {
                ...verSnapshot.schema_snapshot,
                version: verSnapshot.version
            });
            return res.status(200).json(restored);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to rollback version.' });
        }
    }
}
exports.TemplateVersionController = TemplateVersionController;
TemplateVersionController.repo = new template_repository_1.TemplateRepository();
TemplateVersionController.templateService = new template_service_1.TemplateService();
exports.default = TemplateVersionController;
