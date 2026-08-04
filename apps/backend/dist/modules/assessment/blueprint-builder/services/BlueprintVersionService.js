"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintVersionService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const BlueprintVersionRepository_1 = require("../repositories/BlueprintVersionRepository");
const BlueprintRepository_1 = require("../repositories/BlueprintRepository");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const supabase_1 = require("../../../../config/supabase");
class BlueprintVersionService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.versionRepo = new BlueprintVersionRepository_1.BlueprintVersionRepository();
        this.blueprintRepo = new BlueprintRepository_1.BlueprintRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async getHistory(blueprintId, schoolId, correlationId) {
        this.logInfo(`Resolving version snapshots for blueprint: ${blueprintId}`, correlationId);
        return this.versionRepo.findVersions(blueprintId);
    }
    async restoreVersion(blueprintId, versionNumber, schoolId, userId, correlationId) {
        this.logInfo(`Restoring blueprint: ${blueprintId} to version: ${versionNumber}`, correlationId);
        // Fetch version snapshot
        const { data: verSnapshot, error: vError } = await supabase_1.supabase
            .from('assessment_blueprint_versions')
            .select('*')
            .eq('blueprint_id', blueprintId)
            .eq('version', versionNumber)
            .maybeSingle();
        if (vError)
            throw vError;
        if (!verSnapshot)
            throw new Error(`Snapshot version ${versionNumber} not found.`);
        const live = await this.blueprintRepo.findBlueprintById(blueprintId, schoolId);
        if (!live)
            throw new Error('Live blueprint not found.');
        const snap = verSnapshot.schema_snapshot;
        // Transactional update on live blueprint
        const restored = await this.blueprintRepo.updateBlueprint(blueprintId, schoolId, {
            name: snap.name,
            description: snap.description,
            total_marks: snap.total_marks,
            difficulty_distribution: snap.difficulty_distribution,
            bloom_distribution: snap.bloom_distribution,
            outcome_mapping: snap.outcome_mapping,
            version: live.version + 1,
            status: 'DRAFT' // goes back to draft for modification/review
        });
        // Delete old sections/rules
        const { error: delSecErr } = await supabase_1.supabase
            .from('assessment_blueprint_sections')
            .delete()
            .eq('blueprint_id', blueprintId);
        if (delSecErr)
            throw delSecErr;
        // Re-insert historical sections & rules
        const sections = snap.sections || [];
        for (const sec of sections) {
            const { rules, id, ...sectionData } = sec;
            const { data: newSec, error: insSecErr } = await supabase_1.supabase
                .from('assessment_blueprint_sections')
                .insert({
                ...sectionData,
                blueprint_id: blueprintId
            })
                .select()
                .single();
            if (insSecErr)
                throw insSecErr;
            if (rules && rules.length > 0) {
                const rulesPayload = rules.map((r) => ({
                    section_id: newSec.id,
                    filter_field: r.filter_field,
                    filter_value: r.filter_value,
                    match_operator: r.match_operator || 'eq'
                }));
                const { error: insRulesErr } = await supabase_1.supabase
                    .from('assessment_blueprint_rules')
                    .insert(rulesPayload);
                if (insRulesErr)
                    throw insRulesErr;
            }
        }
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_BLUEPRINT_RESTORE',
            entityName: 'assessment_blueprints',
            entityId: blueprintId,
            afterState: restored,
            correlationId
        });
        await event_bus_service_1.EventBus.publish('BlueprintVersionCreated', { blueprintId, version: restored.version, schoolId, userId });
        return restored;
    }
}
exports.BlueprintVersionService = BlueprintVersionService;
exports.default = BlueprintVersionService;
