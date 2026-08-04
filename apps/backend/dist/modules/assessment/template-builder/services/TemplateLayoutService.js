"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateLayoutService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const TemplateLayoutRepository_1 = require("../repositories/TemplateLayoutRepository");
const TemplateHeaderRepository_1 = require("../repositories/TemplateHeaderRepository");
const TemplateFooterRepository_1 = require("../repositories/TemplateFooterRepository");
const TemplateInstructionRepository_1 = require("../repositories/TemplateInstructionRepository");
class TemplateLayoutService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.layoutRepo = new TemplateLayoutRepository_1.TemplateLayoutRepository();
        this.headerRepo = new TemplateHeaderRepository_1.TemplateHeaderRepository();
        this.footerRepo = new TemplateFooterRepository_1.TemplateFooterRepository();
        this.instRepo = new TemplateInstructionRepository_1.TemplateInstructionRepository();
    }
    async saveLayoutRules(templateId, rules) {
        return this.layoutRepo.saveLayoutRules(templateId, rules);
    }
    async saveHeader(templateId, header) {
        return this.headerRepo.saveHeader(templateId, header);
    }
    async saveFooter(templateId, footer) {
        return this.footerRepo.saveFooter(templateId, footer);
    }
    async saveInstructions(templateId, instructionsText) {
        return this.instRepo.saveInstructions(templateId, instructionsText);
    }
}
exports.TemplateLayoutService = TemplateLayoutService;
exports.default = TemplateLayoutService;
