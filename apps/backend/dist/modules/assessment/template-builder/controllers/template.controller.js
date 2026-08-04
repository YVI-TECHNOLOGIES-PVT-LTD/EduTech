"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const template_service_1 = require("../services/template.service");
const TemplateValidationService_1 = require("../services/TemplateValidationService");
class TemplateController {
    static async listTemplates(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const { subjectId, blueprintId, page, limit } = req.query;
            const result = await TemplateController.templateService.listTemplates(schoolId, {
                subjectId: subjectId ? String(subjectId) : undefined,
                blueprintId: blueprintId ? String(blueprintId) : undefined,
                page: page ? parseInt(String(page), 10) : 1,
                limit: limit ? parseInt(String(limit), 10) : 10
            });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to list templates' });
        }
    }
    static async getTemplateById(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const template = await TemplateController.templateService.getTemplateById(id, schoolId);
            return res.status(200).json(template);
        }
        catch (error) {
            return res.status(error.status || 500).json({ error: error.message || 'Failed to fetch template' });
        }
    }
    static async createTemplate(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const template = await TemplateController.templateService.createTemplate(schoolId, userId, req.body);
            return res.status(201).json(template);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to create template' });
        }
    }
    static async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const template = await TemplateController.templateService.updateTemplate(id, schoolId, userId, req.body);
            return res.status(200).json(template);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update template' });
        }
    }
    static async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            await TemplateController.templateService.deleteTemplate(id, schoolId, userId);
            return res.status(200).json({ message: 'Template successfully deleted.' });
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to delete template' });
        }
    }
    static async updateTemplateSections(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const updated = await TemplateController.templateService.updateTemplate(id, schoolId, userId, req.body);
            return res.status(200).json(updated);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to update template sections' });
        }
    }
    static async publishTemplate(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            // Run validation check before publish
            const report = await TemplateController.validationService.validateTemplate(id, schoolId);
            if (!report.success) {
                return res.status(400).json({ error: 'Template validation failed.', details: report.errors });
            }
            const result = await TemplateController.templateService.updateTemplate(id, schoolId, userId, { status: 'PUBLISHED' });
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to publish template' });
        }
    }
    static async cloneTemplate(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            const userId = req.context?.user?.id;
            if (!schoolId || !userId)
                return res.status(400).json({ error: 'Context credentials could not be resolved.' });
            const cloned = await TemplateController.templateService.cloneTemplate(id, schoolId, userId);
            return res.status(201).json(cloned);
        }
        catch (error) {
            return res.status(error.status || 400).json({ error: error.message || 'Failed to clone template' });
        }
    }
    static async validateTemplateRules(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ error: 'School context could not be resolved.' });
            const report = await TemplateController.validationService.validateTemplate(id, schoolId);
            return res.status(200).json(report);
        }
        catch (error) {
            return res.status(500).json({ error: error.message || 'Failed to validate template rules.' });
        }
    }
}
exports.TemplateController = TemplateController;
TemplateController.templateService = new template_service_1.TemplateService();
TemplateController.validationService = new TemplateValidationService_1.TemplateValidationService();
exports.default = TemplateController;
