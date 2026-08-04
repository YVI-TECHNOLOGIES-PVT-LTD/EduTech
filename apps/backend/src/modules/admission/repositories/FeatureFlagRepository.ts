import { supabase } from '../../../config/supabase';
import { IFeatureFlagRepository } from './interfaces/IFeatureFlagRepository';
import { BaseRepository } from './BaseRepository';

export class FeatureFlagRepository extends BaseRepository<any> implements IFeatureFlagRepository {
    constructor() {
        super('feature_flags');
    }

    public async findByKey(
        module: string, 
        key: string, 
        environment: string, 
        tenantId: string | null
    ): Promise<{ enabled: boolean; description?: string } | null> {
        if (tenantId) {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('module', module)
                .eq('feature_key', key)
                .eq('environment', environment)
                .eq('tenant_id', tenantId)
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) return { enabled: data[0].enabled, description: data[0].description };
        }

        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('module', module)
            .eq('feature_key', key)
            .eq('environment', environment)
            .is('tenant_id', null)
            .limit(1);

        if (error) throw error;
        return data && data.length > 0 ? { enabled: data[0].enabled, description: data[0].description } : null;
    }

    public async save(
        module: string, 
        key: string, 
        enabled: boolean, 
        environment: string, 
        tenantId: string | null, 
        description?: string
    ): Promise<any> {
        const payload = {
            module,
            feature_key: key,
            enabled,
            environment,
            tenant_id: tenantId,
            description: description || null,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from(this.tableName)
            .upsert(payload, { onConflict: 'module,feature_key,environment,tenant_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    public async findAll(environment: string, tenantId: string | null): Promise<any[]> {
        let query = this.rawQuery.eq('environment', environment);

        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        } else {
            query = query.is('tenant_id', null);
        }

        const { data, error } = await query.order('module').order('feature_key');
        if (error) throw error;
        return data || [];
    }
}
