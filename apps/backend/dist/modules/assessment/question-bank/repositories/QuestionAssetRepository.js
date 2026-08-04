"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionAssetRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionAssetRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_assets');
    }
    async registerAsset(schoolId, asset) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...asset,
            school_id: schoolId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async linkAssetToQuestion(questionId, assetId) {
        const { error } = await supabase_1.supabase
            .from('assessment_question_assets')
            .insert({
            question_id: questionId,
            asset_id: assetId
        });
        if (error)
            throw error;
    }
    async unlinkAssetFromQuestion(questionId, assetId) {
        const { error } = await supabase_1.supabase
            .from('assessment_question_assets')
            .delete()
            .eq('question_id', questionId)
            .eq('asset_id', assetId);
        if (error)
            throw error;
    }
    async findAssetsByQuestion(questionId) {
        const { data, error } = await supabase_1.supabase
            .from('assessment_question_assets')
            .select('asset_id')
            .eq('question_id', questionId);
        if (error)
            throw error;
        if (!data || data.length === 0)
            return [];
        const assetIds = data.map(item => item.asset_id);
        const { data: assets, error: assetsError } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .in('id', assetIds);
        if (assetsError)
            throw assetsError;
        return assets || [];
    }
    async deleteAsset(assetId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('id', assetId);
        if (error)
            throw error;
    }
}
exports.QuestionAssetRepository = QuestionAssetRepository;
exports.default = QuestionAssetRepository;
