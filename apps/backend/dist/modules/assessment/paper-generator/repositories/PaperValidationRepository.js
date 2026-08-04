"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperValidationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PaperValidationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_validation_logs');
    }
    async logValidation(paperId, status, errors, warnings, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            paper_id: paperId,
            validation_status: status,
            errors,
            warnings,
            validated_by: userId || null
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PaperValidationRepository = PaperValidationRepository;
exports.default = PaperValidationRepository;
