"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentConfigurationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class AssessmentConfigurationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_configurations');
    }
    async findAll(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        return data || [];
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async findConfigBySchool(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        if (data)
            return data;
        // Auto-seed defaults if not found (on demand)
        const { data: newConfig, error: insertError } = await supabase_1.supabase
            .from(this.tableName)
            .insert({ school_id: schoolId })
            .select()
            .single();
        if (insertError)
            throw insertError;
        return newConfig;
    }
    async create(config) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(config)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, config) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            ...config,
            updated_at: new Date().toISOString()
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);
        if (error)
            throw error;
    }
}
exports.AssessmentConfigurationRepository = AssessmentConfigurationRepository;
