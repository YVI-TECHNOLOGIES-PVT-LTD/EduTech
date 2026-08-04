"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PublicationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_result_publications');
    }
    async publishResultPortal(sessionId, targetPortal, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            session_id: sessionId,
            target_portal: targetPortal,
            published_by: userId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PublicationRepository = PublicationRepository;
exports.default = PublicationRepository;
