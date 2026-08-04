"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TemplateRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_templates');
    }
    async listTemplates(schoolId, filters) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId)
            .eq('is_deleted', false);
        if (filters.subjectId)
            query = query.eq('subject_id', filters.subjectId);
        if (filters.blueprintId)
            query = query.eq('blueprint_id', filters.blueprintId);
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to).order('created_at', { ascending: false });
        const { data, error, count } = await query;
        if (error)
            throw error;
        return {
            data: data || [],
            totalCount: count || 0
        };
    }
    async findTemplateById(templateId, schoolId) {
        const { data: template, error: tError } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', templateId)
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .maybeSingle();
        if (tError)
            throw tError;
        if (!template)
            return null;
        // Sections
        const { data: sections, error: sError } = await supabase_1.supabase
            .from('assessment_template_sections')
            .select('*')
            .eq('template_id', templateId)
            .order('sort_order', { ascending: true });
        if (sError)
            throw sError;
        const sectionIds = (sections || []).map(s => s.id);
        let rules = [];
        if (sectionIds.length > 0) {
            const { data: rulesData, error: rError } = await supabase_1.supabase
                .from('assessment_template_rules')
                .select('*')
                .in('section_id', sectionIds);
            if (rError)
                throw rError;
            rules = rulesData || [];
        }
        const enrichedSections = (sections || []).map(sec => ({
            ...sec,
            rules: rules.filter(r => r.section_id === sec.id)
        }));
        // Layout rules
        const { data: layouts, error: layError } = await supabase_1.supabase
            .from('assessment_template_layout_rules')
            .select('property, value')
            .eq('template_id', templateId);
        if (layError)
            throw layError;
        // Header
        const { data: header, error: headError } = await supabase_1.supabase
            .from('assessment_template_headers')
            .select('*')
            .eq('template_id', templateId)
            .maybeSingle();
        if (headError)
            throw headError;
        // Footer
        const { data: footer, error: footError } = await supabase_1.supabase
            .from('assessment_template_footers')
            .select('*')
            .eq('template_id', templateId)
            .maybeSingle();
        if (footError)
            throw footError;
        // Instructions
        const { data: instructions, error: instError } = await supabase_1.supabase
            .from('assessment_template_instructions')
            .select('instructions_text')
            .eq('template_id', templateId)
            .maybeSingle();
        if (instError)
            throw instError;
        return {
            ...template,
            sections: enrichedSections,
            layoutRules: layouts || [],
            header: header || null,
            footer: footer || null,
            instructions: instructions?.instructions_text || ''
        };
    }
    async createTemplate(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...payload,
            school_id: schoolId,
            status: 'DRAFT',
            version: 1
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateTemplate(templateId, schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
            .eq('id', templateId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteTemplate(templateId, schoolId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            is_deleted: true,
            updated_at: new Date().toISOString()
        })
            .eq('id', templateId)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
    async updateTemplateSections(templateId, schoolId, sections) {
        const { data: template, error: checkError } = await supabase_1.supabase
            .from(this.tableName)
            .select('id')
            .eq('id', templateId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (checkError)
            throw checkError;
        if (!template)
            throw new Error('Template not found or unauthorized.');
        // Delete existing rules
        const { data: existingSecs, error: getSecsErr } = await supabase_1.supabase
            .from('assessment_template_sections')
            .select('id')
            .eq('template_id', templateId);
        if (getSecsErr)
            throw getSecsErr;
        const existingSecIds = (existingSecs || []).map(s => s.id);
        if (existingSecIds.length > 0) {
            const { error: delRulesErr } = await supabase_1.supabase
                .from('assessment_template_rules')
                .delete()
                .in('section_id', existingSecIds);
            if (delRulesErr)
                throw delRulesErr;
        }
        // Delete existing sections
        const { error: delSecsErr } = await supabase_1.supabase
            .from('assessment_template_sections')
            .delete()
            .eq('template_id', templateId);
        if (delSecsErr)
            throw delSecsErr;
        // Insert new sections
        for (const sec of sections) {
            const { rules, ...sectionData } = sec;
            const { data: newSec, error: insSecErr } = await supabase_1.supabase
                .from('assessment_template_sections')
                .insert({
                ...sectionData,
                template_id: templateId
            })
                .select()
                .single();
            if (insSecErr)
                throw insSecErr;
            if (rules && rules.length > 0) {
                const rulesPayload = rules.map((r) => ({
                    section_id: newSec.id,
                    filter_field: r.filter_field,
                    filter_value: r.filter_value,
                    match_operator: r.match_operator || 'eq'
                }));
                const { error: insRulesErr } = await supabase_1.supabase
                    .from('assessment_template_rules')
                    .insert(rulesPayload);
                if (insRulesErr)
                    throw insRulesErr;
            }
        }
        return this.findTemplateById(templateId, schoolId);
    }
    async publishTemplate(templateId, schoolId, version, schemaSnapshot) {
        const { error: snapError } = await supabase_1.supabase
            .from('assessment_template_versions')
            .insert({
            template_id: templateId,
            version,
            schema_snapshot: schemaSnapshot
        });
        if (snapError)
            throw snapError;
        const { data, error: updateError } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            status: 'PUBLISHED',
            updated_at: new Date().toISOString()
        })
            .eq('id', templateId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (updateError)
            throw updateError;
        return data;
    }
}
exports.TemplateRepository = TemplateRepository;
exports.default = TemplateRepository;
