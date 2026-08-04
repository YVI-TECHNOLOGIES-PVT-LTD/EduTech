"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintVersionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class BlueprintVersionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_blueprint_versions');
    }
    async findVersions(blueprintId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('blueprint_id', blueprintId)
            .order('version', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async createVersion(blueprintId, version, snapshot) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            blueprint_id: blueprintId,
            version,
            schema_snapshot: snapshot
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.BlueprintVersionRepository = BlueprintVersionRepository;
exports.default = BlueprintVersionRepository;
