"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class BlueprintRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_blueprints');
    }
    async listBlueprints(schoolId, filters) {
        let query = supabase_1.supabase
            .from(this.tableName)
            .select('*', { count: 'exact' })
            .eq('school_id', schoolId);
        if (filters.subjectId)
            query = query.eq('subject_id', filters.subjectId);
        if (filters.status)
            query = query.eq('status', filters.status);
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
    async findBlueprintById(blueprintId, schoolId) {
        const { data: blueprint, error: bError } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', blueprintId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (bError)
            throw bError;
        if (!blueprint)
            return null;
        const { data: sections, error: sError } = await supabase_1.supabase
            .from('assessment_blueprint_sections')
            .select('*')
            .eq('blueprint_id', blueprintId)
            .order('sort_order', { ascending: true });
        if (sError)
            throw sError;
        const sectionIds = (sections || []).map(s => s.id);
        let rules = [];
        if (sectionIds.length > 0) {
            const { data: rulesData, error: rError } = await supabase_1.supabase
                .from('assessment_blueprint_rules')
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
        return {
            ...blueprint,
            sections: enrichedSections
        };
    }
    async createBlueprint(schoolId, payload) {
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
    async updateBlueprint(blueprintId, schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
            .eq('id', blueprintId)
            .eq('school_id', schoolId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async deleteBlueprint(blueprintId, schoolId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', blueprintId)
            .eq('school_id', schoolId);
        if (error)
            throw error;
    }
}
exports.BlueprintRepository = BlueprintRepository;
exports.default = BlueprintRepository;
