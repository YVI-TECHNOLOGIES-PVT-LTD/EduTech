"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperVersionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PaperVersionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_versions');
    }
    async saveSnapshot(paperId, version, schemaSnapshot) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            paper_id: paperId,
            version,
            schema_snapshot: schemaSnapshot
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PaperVersionRepository = PaperVersionRepository;
exports.default = PaperVersionRepository;
