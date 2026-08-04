"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperExportRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PaperExportRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_exports');
    }
    async saveExportLog(paperId, format, type, filePath, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            paper_id: paperId,
            format,
            type,
            file_path: filePath,
            generated_by: userId || null
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PaperExportRepository = PaperExportRepository;
exports.default = PaperExportRepository;
