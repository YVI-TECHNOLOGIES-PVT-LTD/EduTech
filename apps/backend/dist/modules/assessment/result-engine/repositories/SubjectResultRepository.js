"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectResultRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class SubjectResultRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_subject_results');
    }
    async saveSubjectResult(studentResultId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            student_result_id: studentResultId,
            subject_id: payload.subject_id,
            awarded_marks: payload.awarded_marks,
            maximum_marks: payload.maximum_marks,
            grade_label: payload.grade_label,
            grade_point: payload.grade_point
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.SubjectResultRepository = SubjectResultRepository;
exports.default = SubjectResultRepository;
