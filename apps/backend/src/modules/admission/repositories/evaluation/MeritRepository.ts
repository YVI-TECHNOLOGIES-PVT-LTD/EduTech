import { MeritRule, MeritComponent } from '../../domain/evaluation/MeritRule';
import { MeritResult, SelectionStatus } from '../../domain/evaluation/MeritResult';
import { supabase } from '../../../../config/supabase';

export class MeritRepository {
    public async findRule(schoolId: string, academicYearId: string): Promise<MeritRule | null> {
        const { data, error } = await supabase
            .from('admission_merit_rules')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .maybeSingle();

        if (error) throw error;
        return data ? new MeritRule(
            data.id,
            data.school_id,
            data.academic_year_id,
            data.tie_breaker_rules,
            new Date(data.created_at)
        ) : null;
    }

    public async saveRule(rule: MeritRule): Promise<void> {
        const { error } = await supabase
            .from('admission_merit_rules')
            .upsert({
                id: rule.id,
                school_id: rule.schoolId,
                academic_year_id: rule.academicYearId,
                tie_breaker_rules: rule.tieBreakerRules
            });

        if (error) throw error;
    }

    public async findComponents(ruleId: string): Promise<MeritComponent[]> {
        const { data, error } = await supabase
            .from('admission_merit_components')
            .select('*')
            .eq('rule_id', ruleId)
            .eq('active', true);

        if (error) throw error;
        return (data || []).map(row => new MeritComponent(
            row.id,
            row.rule_id,
            row.component_name,
            row.weight,
            row.active
        ));
    }

    public async saveComponent(comp: MeritComponent): Promise<void> {
        const { error } = await supabase
            .from('admission_merit_components')
            .upsert({
                id: comp.id,
                rule_id: comp.ruleId,
                component_name: comp.componentName,
                weight: comp.weight,
                active: comp.active
            });

        if (error) throw error;
    }

    public async saveResult(res: MeritResult): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async findByApplicationId(appId: string): Promise<MeritResult | null> {
        const { data, error } = await supabase
            .from('admission_merit_results')
            .select('*')
            .eq('application_id', appId)
            .maybeSingle();

        if (error) throw error;
        return data ? new MeritResult(
            data.id,
            data.application_id,
            Number(data.final_score),
            data.rank,
            data.selection_status as SelectionStatus,
            data.waitlist_priority,
            data.waitlist_group,
            data.recommendation,
            new Date(data.created_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async findAllResults(schoolId: string, academicYearId: string): Promise<MeritResult[]> {
        const { data, error } = await supabase
            .from('admission_merit_results')
            .select('*, admission_applications!inner(*)')
            .eq('admission_applications.school_id', schoolId)
            .eq('admission_applications.academic_year_id', academicYearId);

        if (error) throw error;
        return (data || []).map(row => new MeritResult(
            row.id,
            row.application_id,
            Number(row.final_score),
            row.rank,
            row.selection_status as SelectionStatus,
            row.waitlist_priority,
            row.waitlist_group,
            row.recommendation,
            new Date(row.created_at),
            new Date(row.updated_at)
        ));
    }

    public async savePromotion(fromAppId: string, toAppId: string): Promise<void> {
        const { error } = await supabase
            .from('admission_waitlist_promotions')
            .insert({
                from_application_id: fromAppId,
                to_application_id: toAppId
            });

        if (error) throw error;
    }
}
