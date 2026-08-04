"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateLayoutController = void 0;
const TemplateLayoutService_1 = require("../services/TemplateLayoutService");
const TemplatePreviewEngine_1 = require("../services/TemplatePreviewEngine");
class TemplateLayoutController {
    static async saveLayout(req, res) {
        try {
            const { id } = req.params; // Template ID
            const { layoutRules, header, footer, instructions } = req.body;
            if (layoutRules)
                await TemplateLayoutController.layoutService.saveLayoutRules(id, layoutRules);
            if (header)
                await TemplateLayoutController.layoutService.saveHeader(id, header);
            if (footer)
                await TemplateLayoutController.layoutService.saveFooter(id, footer);
            if (instructions !== undefined)
                await TemplateLayoutController.layoutService.saveInstructions(id, instructions);
            return res.status(200).json({ message: 'Template layout configurations updated.' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to update layout.' });
        }
    }
    static async getPreview(req, res) {
        try {
            const { id } = req.params; // Template ID
            const { format } = req.query; // 'html', 'pdf', 'mobile'
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const preview = await TemplateLayoutController.previewEngine.generatePreview(id, String(format || 'html'), schoolId);
            return res.status(200).json(preview);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to render template preview.' });
        }
    }
}
exports.TemplateLayoutController = TemplateLayoutController;
TemplateLayoutController.layoutService = new TemplateLayoutService_1.TemplateLayoutService();
TemplateLayoutController.previewEngine = new TemplatePreviewEngine_1.TemplatePreviewEngine();
exports.default = TemplateLayoutController;
