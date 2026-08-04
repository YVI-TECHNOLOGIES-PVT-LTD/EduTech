"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseService_1 = require("./BaseService");
class AuditService extends BaseService_1.BaseService {
    /**
     * Inserts an entry into the public.audit_logs table.
     */
    async logAudit(logData) {
        try {
            const { error } = await supabase_1.supabase
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
            if (error)
                throw error;
            this.logInfo(`Audit log written for action ${logData.action} on ${logData.entityName}:${logData.entityId}`, logData.correlationId);
        }
        catch (error) {
            this.logError('Failed to write audit log', error, logData.correlationId);
        }
    }
    /**
     * Inserts an entry into the public.status_history table.
     */
    async logStatusChange(statusData) {
        try {
            const { error } = await supabase_1.supabase
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
            if (error)
                throw error;
            this.logInfo(`Status history written: ${statusData.entityName} transitioned to ${statusData.newStatus}`, statusData.correlationId);
        }
        catch (error) {
            this.logError('Failed to write status history log', error, statusData.correlationId);
        }
    }
}
exports.AuditService = AuditService;
