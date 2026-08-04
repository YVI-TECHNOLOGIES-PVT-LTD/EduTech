"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintRuleRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class BlueprintRuleRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_blueprint_rules');
    }
    async findBySectionIds(sectionIds) {
        if (!sectionIds || sectionIds.length === 0)
            return [];
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .in('section_id', sectionIds);
        if (error)
            throw error;
        return data || [];
    }
    async insertBulk(rules) {
        if (!rules || rules.length === 0)
            return [];
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(rules)
            .select();
        if (error)
            throw error;
        return data || [];
    }
}
exports.BlueprintRuleRepository = BlueprintRuleRepository;
exports.default = BlueprintRuleRepository;
