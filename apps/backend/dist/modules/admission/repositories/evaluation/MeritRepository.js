"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeritRepository = void 0;
const MeritRule_1 = require("../../domain/evaluation/MeritRule");
const MeritResult_1 = require("../../domain/evaluation/MeritResult");
const supabase_1 = require("../../../../config/supabase");
class MeritRepository {
    async findRule(schoolId, academicYearId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_merit_rules')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new MeritRule_1.MeritRule(data.id, data.school_id, data.academic_year_id, data.tie_breaker_rules, new Date(data.created_at)) : null;
    }
    async saveRule(rule) {
        const { error } = await supabase_1.supabase
            .from('admission_merit_rules')
            .upsert({
            id: rule.id,
            school_id: rule.schoolId,
            academic_year_id: rule.academicYearId,
            tie_breaker_rules: rule.tieBreakerRules
        });
        if (error)
            throw error;
    }
    async findComponents(ruleId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_merit_components')
            .select('*')
            .eq('rule_id', ruleId)
            .eq('active', true);
        if (error)
            throw error;
        return (data || []).map(row => new MeritRule_1.MeritComponent(row.id, row.rule_id, row.component_name, row.weight, row.active));
    }
    async saveComponent(comp) {
        const { error } = await supabase_1.supabase
            .from('admission_merit_components')
            .upsert({
            id: comp.id,
            rule_id: comp.ruleId,
            component_name: comp.componentName,
            weight: comp.weight,
            active: comp.active
        });
        if (error)
            throw error;
    }
    async saveResult(res) {
        const { error } = await supabase_1.supabase
            .from('admission_merit_results')
            .upsert({
            id: res.id,
            application_id: res.applicationId,
            final_score: res.finalScore,
            rank: res.rank,
            selection_status: res.selectionStatus,
            waitlist_priority: res.waitlistPriority,
            waitlist_group: res.waitlistGroup,
            recommendation: res.recommendation,
            updated_at: res.updatedAt.toISOString()
        });
        if (error)
            throw error;
    }
    async findByApplicationId(appId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_merit_results')
            .select('*')
            .eq('application_id', appId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new MeritResult_1.MeritResult(data.id, data.application_id, Number(data.final_score), data.rank, data.selection_status, data.waitlist_priority, data.waitlist_group, data.recommendation, new Date(data.created_at), new Date(data.updated_at)) : null;
    }
    async findAllResults(schoolId, academicYearId) {
        const { data, error } = await supabase_1.supabase
            .from('admission_merit_results')
            .select('*, admission_applications!inner(*)')
            .eq('admission_applications.school_id', schoolId)
            .eq('admission_applications.academic_year_id', academicYearId);
        if (error)
            throw error;
        return (data || []).map(row => new MeritResult_1.MeritResult(row.id, row.application_id, Number(row.final_score), row.rank, row.selection_status, row.waitlist_priority, row.waitlist_group, row.recommendation, new Date(row.created_at), new Date(row.updated_at)));
    }
    async savePromotion(fromAppId, toAppId) {
        const { error } = await supabase_1.supabase
            .from('admission_waitlist_promotions')
            .insert({
            from_application_id: fromAppId,
            to_application_id: toAppId
        });
        if (error)
            throw error;
    }
}
exports.MeritRepository = MeritRepository;
