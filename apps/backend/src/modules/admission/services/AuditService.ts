import { supabase } from '../../../config/supabase';
import { BaseService } from './BaseService';

export class AuditService extends BaseService {
    /**
     * Inserts an entry into the public.audit_logs table.
     */
    public async logAudit(logData: {
        userId: string | null;
        action: string;
        entityName: string;
        entityId: string;
        beforeState?: any;
        afterState?: any;
        ipAddress?: string;
        userAgent?: string;
        correlationId?: string;
    }): Promise<void> {
        try {
            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: logData.userId || null,
                    action: logData.action,
                    entity_name: logData.entityName,
                    entity_id: logData.entityId,
                    before_state: logData.beforeState || null,
                    after_state: logData.afterState || null,
                    ip_address: logData.ipAddress || null,
                    user_agent: logData.userAgent || null,
                    correlation_id: this.sanitizeCorrelationId(logData.correlationId)
                });

            if (error) throw error;
            this.logInfo(`Audit log written for action ${logData.action} on ${logData.entityName}:${logData.entityId}`, logData.correlationId);
        } catch (error) {
            this.logError('Failed to write audit log', error, logData.correlationId);
        }
    }

    /**
     * Inserts an entry into the public.status_history table.
     */
    public async logStatusChange(statusData: {
        entityName: string;
        entityId: string;
        oldStatus: string | null;
        newStatus: string;
        changedBy: string | null;
        reason?: string;
        metadata?: any;
        correlationId?: string;
        eventName?: string;
    }): Promise<void> {
        try {
            const { error } = await supabase
                .from('status_history')
                .insert({
                    entity_name: statusData.entityName,
                    entity_id: statusData.entityId,
                    old_status: statusData.oldStatus || null,
                    new_status: statusData.newStatus,
                    changed_by: statusData.changedBy || null,
                    reason: statusData.reason || null,
                    metadata: statusData.metadata || null,
                    correlation_id: this.sanitizeCorrelationId(statusData.correlationId),
                    event_name: statusData.eventName || null
                });

            if (error) throw error;
            this.logInfo(`Status history written: ${statusData.entityName} transitioned to ${statusData.newStatus}`, statusData.correlationId);
        } catch (error) {
            this.logError('Failed to write status history log', error, statusData.correlationId);
        }
    }
}
