"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintSectionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class BlueprintSectionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_blueprint_sections');
    }
    async findByBlueprintId(blueprintId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('blueprint_id', blueprintId)
            .order('sort_order', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    async deleteByBlueprintId(blueprintId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('blueprint_id', blueprintId);
        if (error)
            throw error;
    }
}
exports.BlueprintSectionRepository = BlueprintSectionRepository;
exports.default = BlueprintSectionRepository;
