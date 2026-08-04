"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const template_repository_1 = require("../repositories/template.repository");
const TemplateLayoutRepository_1 = require("../repositories/TemplateLayoutRepository");
const TemplateHeaderRepository_1 = require("../repositories/TemplateHeaderRepository");
const TemplateFooterRepository_1 = require("../repositories/TemplateFooterRepository");
const TemplateInstructionRepository_1 = require("../repositories/TemplateInstructionRepository");
const TemplatePreviewCacheRepository_1 = require("../repositories/TemplatePreviewCacheRepository");
const TemplateValidator_1 = require("../validators/TemplateValidator");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const NotFoundError_1 = require("../../../admission/errors/NotFoundError");
class TemplateService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new template_repository_1.TemplateRepository();
        this.layoutRepo = new TemplateLayoutRepository_1.TemplateLayoutRepository();
        this.headerRepo = new TemplateHeaderRepository_1.TemplateHeaderRepository();
        this.footerRepo = new TemplateFooterRepository_1.TemplateFooterRepository();
        this.instRepo = new TemplateInstructionRepository_1.TemplateInstructionRepository();
        this.cacheRepo = new TemplatePreviewCacheRepository_1.TemplatePreviewCacheRepository();
        this.auditService = new AuditService_1.AuditService();
    }
    async listTemplates(schoolId, filters, correlationId) {
        this.logInfo(`Listing templates for school: ${schoolId}`, correlationId);
        return this.repo.listTemplates(schoolId, filters);
    }
    async getTemplateById(templateId, schoolId, correlationId) {
        this.logInfo(`Fetching template detail: ${templateId}`, correlationId);
        const template = await this.repo.findTemplateById(templateId, schoolId);
        if (!template) {
            throw new NotFoundError_1.NotFoundError(`Assessment template not found: ${templateId}`);
        }
        return template;
    }
    async createTemplate(schoolId, userId, payload, correlationId) {
        const validated = TemplateValidator_1.TemplateValidator.validateCreate(payload);
        const { header, footer, layoutRules, sections, instructions, ...headerData } = validated;
        const template = await this.repo.createTemplate(schoolId, {
            ...headerData,
            created_by: userId
        });
        // Save layout configurations
        if (layoutRules)
            await this.layoutRepo.saveLayoutRules(template.id, layoutRules);
        if (header)
            await this.headerRepo.saveHeader(template.id, header);
        if (footer)
            await this.footerRepo.saveFooter(template.id, footer);
        if (instructions !== undefined)
            await this.instRepo.saveInstructions(template.id, instructions);
        // Sections
        if (sections && sections.length > 0) {
            await this.repo.updateTemplateSections(template.id, schoolId, sections);
        }
        const fullTemplate = await this.repo.findTemplateById(template.id, schoolId);
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_TEMPLATE_CREATE',
            entityName: 'assessment_templates',
            entityId: template.id,
            afterState: fullTemplate,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('TemplateCreated', { templateId: template.id, schoolId, userId });
        return fullTemplate;
    }
    async updateTemplate(templateId, schoolId, userId, payload, correlationId) {
        const validated = TemplateValidator_1.TemplateValidator.validateUpdate(payload);
        const current = await this.getTemplateById(templateId, schoolId, correlationId);
        if (current.status === 'APPROVED' || current.status === 'PUBLISHED') {
            // Fork version if approved/published
            this.logInfo(`Forking version draft for template: ${templateId}`, correlationId);
            const forkedPayload = {
                ...current,
                ...validated,
                version: current.version + 1,
                status: 'DRAFT',
                sections: validated.sections || current.sections,
                layoutRules: validated.layoutRules || current.layoutRules,
                header: validated.header || current.header,
                footer: validated.footer || current.footer,
                instructions: validated.instructions !== undefined ? validated.instructions : current.instructions
            };
            delete forkedPayload.id;
            delete forkedPayload.created_at;
            delete forkedPayload.updated_at;
            const cloned = await this.createTemplate(schoolId, userId, forkedPayload, correlationId);
            await event_bus_service_1.EventBus.publish('TemplateVersionCreated', { templateId: cloned.id, version: cloned.version, schoolId, userId });
            return cloned;
        }
        // Standard update
        const { header, footer, layoutRules, sections, instructions, ...headerData } = validated;
        if (Object.keys(headerData).length > 0) {
            await this.repo.updateTemplate(templateId, schoolId, headerData);
        }
        if (layoutRules)
            await this.layoutRepo.saveLayoutRules(templateId, layoutRules);
        if (header)
            await this.headerRepo.saveHeader(templateId, header);
        if (footer)
            await this.footerRepo.saveFooter(templateId, footer);
        if (instructions !== undefined)
            await this.instRepo.saveInstructions(templateId, instructions);
        if (sections) {
            await this.repo.updateTemplateSections(templateId, schoolId, sections);
        }
        // Invalidate cache on any modifications
        await this.cacheRepo.invalidateCache(templateId);
        const updated = await this.repo.findTemplateById(templateId, schoolId);
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_TEMPLATE_UPDATE',
            entityName: 'assessment_templates',
            entityId: templateId,
            beforeState: current,
            afterState: updated,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('TemplateUpdated', { templateId, schoolId, userId });
        return updated;
    }
    async deleteTemplate(templateId, schoolId, userId, correlationId) {
        const current = await this.getTemplateById(templateId, schoolId, correlationId);
        await this.repo.deleteTemplate(templateId, schoolId);
        await this.auditService.logAudit({
            userId,
            action: 'ASSESSMENT_TEMPLATE_DELETE',
            entityName: 'assessment_templates',
            entityId: templateId,
            beforeState: current,
            afterState: { ...current, is_deleted: true },
            correlationId
        });
        await event_bus_service_1.EventBus.publish('TemplateArchived', { templateId, schoolId, userId });
    }
    async cloneTemplate(templateId, schoolId, userId, correlationId) {
        const source = await this.getTemplateById(templateId, schoolId, correlationId);
        const clonePayload = {
            subject_id: source.subject_id,
            blueprint_id: source.blueprint_id,
            name: `Copy of ${source.name}`,
            description: source.description,
            status: 'DRAFT',
            version: 1,
            instructions: source.instructions,
            header: source.header,
            footer: source.footer,
            layoutRules: source.layoutRules,
            sections: source.sections
        };
        return this.createTemplate(schoolId, userId, clonePayload, correlationId);
    }
}
exports.TemplateService = TemplateService;
exports.default = TemplateService;
