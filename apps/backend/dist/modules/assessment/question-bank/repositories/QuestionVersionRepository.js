"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionVersionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionVersionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_question_bank');
    }
    async findVersions(questionId, schoolId) {
        // Fetch the parent question to get parent_id
        const { data: q, error: qError } = await supabase_1.supabase
            .from(this.tableName)
            .select('parent_id, id')
            .eq('id', questionId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (qError)
            throw qError;
        if (!q)
            return [];
        const rootId = q.parent_id || q.id;
        // Query all rows where ID = rootId OR parent_id = rootId
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
            .order('version', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async restoreVersion(questionId, versionNumber, schoolId, userId) {
        // Find the past version row
        const { data: pastVer, error: vError } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .eq('version', versionNumber)
            .or(`id.eq.${questionId},parent_id.eq.${questionId}`)
            .maybeSingle();
        if (vError)
            throw vError;
        if (!pastVer)
            throw new Error(`Version ${versionNumber} not found.`);
        // Find the current live active row
        const { data: live, error: lError } = await supabase_1.supabase
            .from(this.tableName)
            .select('id, version')
            .eq('id', questionId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (lError)
            throw lError;
        if (!live)
            throw new Error(`Live question not found.`);
        // Update the active row with values from the past version, increment version
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            question_text: pastVer.question_text,
            question_type: pastVer.question_type,
            difficulty: pastVer.difficulty,
            bloom_level: pastVer.bloom_level,
            points: pastVer.points,
            negative_marks: pastVer.negative_marks,
            explanation: pastVer.explanation,
            course_outcome_code: pastVer.course_outcome_code,
            program_outcome_code: pastVer.program_outcome_code,
            lesson_id: pastVer.lesson_id,
            taxonomy_tags: pastVer.taxonomy_tags,
            version: live.version + 1,
            status: 'DRAFT', // restored version goes back to draft
            updated_at: new Date().toISOString()
        })
            .eq('id', questionId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.QuestionVersionRepository = QuestionVersionRepository;
exports.default = QuestionVersionRepository;
