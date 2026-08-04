"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationJobRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class GenerationJobRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generation_jobs');
    }
    async listJobs(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async createJob(schoolId, blueprintId, templateId, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            blueprint_id: blueprintId,
            template_id: templateId,
            status: 'PENDING',
            created_by: userId || null
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateJobStatus(jobId, status, logs, errorMessage) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            status,
            logs,
            error_message: errorMessage || null,
            updated_at: new Date().toISOString()
        })
            .eq('id', jobId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.GenerationJobRepository = GenerationJobRepository;
exports.default = GenerationJobRepository;
