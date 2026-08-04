"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("./BaseRepository");
class FeatureFlagRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('feature_flags');
    }
    async findByKey(module, key, environment, tenantId) {
        if (tenantId) {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .select('*')
                .eq('module', module)
                .eq('feature_key', key)
                .eq('environment', environment)
                .eq('tenant_id', tenantId)
                .limit(1);
            if (error)
                throw error;
            if (data && data.length > 0)
                return { enabled: data[0].enabled, description: data[0].description };
        }
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('module', module)
            .eq('feature_key', key)
            .eq('environment', environment)
            .is('tenant_id', null)
            .limit(1);
        if (error)
            throw error;
        return data && data.length > 0 ? { enabled: data[0].enabled, description: data[0].description } : null;
    }
    async save(module, key, enabled, environment, tenantId, description) {
        const payload = {
            module,
            feature_key: key,
            enabled,
            environment,
            tenant_id: tenantId,
            description: description || null,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .upsert(payload, { onConflict: 'module,feature_key,environment,tenant_id' })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async findAll(environment, tenantId) {
        let query = this.rawQuery.eq('environment', environment);
        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }
        else {
            query = query.is('tenant_id', null);
        }
        const { data, error } = await query.order('module').order('feature_key');
        if (error)
            throw error;
        return data || [];
    }
}
exports.FeatureFlagRepository = FeatureFlagRepository;
