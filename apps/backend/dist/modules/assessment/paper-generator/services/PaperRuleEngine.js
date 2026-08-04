"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperRuleEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
class PaperRuleEngine extends BaseService_1.BaseService {
    async selectQuestionsForRules(schoolId, subjectId, rules, targetCount) {
        let query = supabase_1.supabase
            .from('assessment_question_bank')
            .select('*')
            .eq('school_id', schoolId)
            .eq('subject_id', subjectId)
            .eq('status', 'APPROVED')
            .eq('is_deleted', false);
        // Apply rules
        for (const rule of rules) {
            if (rule.filter_field === 'difficulty') {
                query = query.eq('difficulty', rule.filter_value);
            }
            else if (rule.filter_field === 'bloom_level') {
                query = query.eq('bloom_level', rule.filter_value);
            }
            else if (rule.filter_field === 'course_outcome') {
                query = query.eq('course_outcome_code', rule.filter_value);
            }
        }
        const { data, error } = await query;
        if (error)
            throw error;
        // Shuffle matched questions pool and take targetCount
        const shuffled = (data || []).sort(() => 0.5 - Math.random());
        return shuffled.slice(0, targetCount);
    }
}
exports.PaperRuleEngine = PaperRuleEngine;
exports.default = PaperRuleEngine;
