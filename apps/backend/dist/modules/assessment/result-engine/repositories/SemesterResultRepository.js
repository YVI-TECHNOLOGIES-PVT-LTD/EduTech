"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemesterResultRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class SemesterResultRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_semester_results');
    }
    async saveSemesterSummary(studentId, semesterLabel, gpa, credits) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            student_id: studentId,
            semester_label: semesterLabel,
            gpa,
            earned_credits: credits
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.SemesterResultRepository = SemesterResultRepository;
exports.default = SemesterResultRepository;
