"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatePreviewEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const template_repository_1 = require("../repositories/template.repository");
const TemplatePreviewCacheRepository_1 = require("../repositories/TemplatePreviewCacheRepository");
const crypto_1 = require("crypto");
class TemplatePreviewEngine extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new template_repository_1.TemplateRepository();
        this.cacheRepo = new TemplatePreviewCacheRepository_1.TemplatePreviewCacheRepository();
    }
    async generatePreview(templateId, format, schoolId, correlationId) {
        this.logInfo(`Generating template preview for template: ${templateId} in format: ${format}`, correlationId);
        const template = await this.repo.findTemplateById(templateId, schoolId);
        if (!template)
            throw new Error('Template context not found.');
        // Build simple layout configuration hash to check cache
        const configStr = JSON.stringify({
            header: template.header,
            footer: template.footer,
            layoutRules: template.layoutRules,
            sections: template.sections,
            instructions: template.instructions
        });
        const hash = (0, crypto_1.createHash)('sha256').update(configStr).digest('hex');
        // Check cache
        const cached = await this.cacheRepo.findCache(templateId, format);
        if (cached && cached.hash === hash) {
            return {
                html: cached.html_path,
                pdf: cached.pdf_path,
                thumbnail: cached.thumbnail_path,
                generatedAt: cached.generated_at
            };
        }
        // Render mock html content contract
        const font = template.layoutRules?.find((r) => r.property === 'font')?.value || 'Arial';
        const orientation = template.layoutRules?.find((r) => r.property === 'orientation')?.value || 'Portrait';
        const columns = template.layoutRules?.find((r) => r.property === 'columns')?.value || '1';
        const mockHtml = `
            <div style="font-family: ${font}; padding: 20px; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-radius: 12px; background: white;">
                <!-- HEADER BUILDER -->
                ${template.header?.school_name ? `<h1 style="text-align: center; font-size: 20px; margin-bottom: 2px;">EDU-TRACK ERP MODEL SCHOOL</h1>` : ''}
                ${template.header?.exam_name ? `<h2 style="text-align: center; font-size: 14px; margin-top: 0; color: #4b5563;">MID-TERM EXAMINATION</h2>` : ''}
                
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                    <div>
                        ${template.header?.subject ? `<div><strong>Subject:</strong> Course Subject</div>` : ''}
                        ${template.header?.class ? `<div><strong>Class:</strong> Year Class</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        ${template.header?.duration ? `<div><strong>Duration:</strong> 3 Hours</div>` : ''}
                        ${template.header?.max_marks ? `<div><strong>Max Marks:</strong> ${template.total_marks || 100} Marks</div>` : ''}
                    </div>
                </div>

                <!-- CANDIDATE INSTRUCTIONS -->
                ${template.instructions ? `
                    <div style="margin-top: 15px; background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #f3f4f6; font-size: 11px; line-height: 1.5;">
                        <strong style="display: block; margin-bottom: 4px; color: #374151;">General Instructions:</strong>
                        ${template.instructions}
                    </div>
                ` : ''}

                <!-- SECTIONS & LAYOUT RULE -->
                <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 15px;">
                    ${template.sections?.map((sec) => `
                        <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 12px; background: #ffffff;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; margin-bottom: 10px;">
                                <h3 style="font-size: 12px; margin: 0; font-weight: bold; text-transform: uppercase; color: #111827;">${sec.section_name}</h3>
                                <span style="font-size: 10px; color: #9ca3af; font-weight: bold;">[${sec.total_questions} questions × ${sec.points_per_question} marks]</span>
                            </div>
                            <p style="font-size: 11px; color: #6b7280; font-style: italic; margin-bottom: 12px;">${sec.description || 'Answer all questions from this section.'}</p>
                            
                            <!-- Mock Question lines -->
                            <div style="space-y: 8px; font-size: 11px;">
                                ${Array.from({ length: Math.min(sec.total_questions, 2) }).map((_, i) => `
                                    <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                                        <span>Q${i + 1}. This is a sample question parsed from the Question Bank rule rules.</span>
                                        <span style="font-weight: bold; color: #9ca3af;">(${sec.points_per_question} Marks)</span>
                                    </div>
                                `).join('')}
                                ${sec.total_questions > 2 ? `<div style="text-align: center; font-size: 10px; color: #d1d5db; font-style: italic;">[${sec.total_questions - 2} additional questions hidden in thumbnail preview]</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- FOOTER BUILDER -->
                <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; color: #9ca3af;">
                    ${template.footer?.invigilator_signature ? `<div>Invigilator Signature: __________________</div>` : '<div></div>'}
                    ${template.footer?.page_number ? `<div>Page 1 of 1</div>` : '<div></div>'}
                </div>
            </div>
        `;
        await this.cacheRepo.saveCache(templateId, format, {
            hash,
            html_path: mockHtml
        });
        return {
            html: mockHtml,
            generatedAt: new Date().toISOString()
        };
    }
}
exports.TemplatePreviewEngine = TemplatePreviewEngine;
exports.default = TemplatePreviewEngine;
