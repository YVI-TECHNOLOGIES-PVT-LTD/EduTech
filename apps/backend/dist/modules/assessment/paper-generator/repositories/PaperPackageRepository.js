"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperPackageRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PaperPackageRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_paper_packages');
    }
    async savePackage(publishedPaperId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            published_paper_id: publishedPaperId,
            candidate_pdf: payload.candidate_pdf || null,
            moderator_pdf: payload.moderator_pdf || null,
            answer_key_pdf: payload.answer_key_pdf || null,
            encrypted_package: payload.encrypted_package || null,
            checksum: payload.checksum || 'N/A',
            metadata: payload.metadata || {}
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async findByPublishedId(publishedPaperId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('published_paper_id', publishedPaperId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
}
exports.PaperPackageRepository = PaperPackageRepository;
exports.default = PaperPackageRepository;
