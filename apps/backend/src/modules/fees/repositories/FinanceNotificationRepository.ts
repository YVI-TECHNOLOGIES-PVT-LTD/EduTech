import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from '../services/FeeStructureManagerService';

export interface FinanceNotificationFilter {
  type?: string;
  channel?: string;
  isRead?: boolean;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface FinanceNotificationRecord {
  notification_id: string;
  org_id: string;
  recipient_user_id: string;
  category: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: Date | null;
  metadata: any | null;
  created_at: Date;
  updated_at: Date;
  recipient_name?: string;
  recipient_email?: string;
}

export class FinanceNotificationRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  /**
   * Retrieves paginated, tenant-isolated finance notification activity records.
   */
  public static async getFinanceNotifications(
    orgId: string,
    filter: FinanceNotificationFilter = {},
    client?: any
  ): Promise<{
    items: FinanceNotificationRecord[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const offset = (page - 1) * limit;

    let baseSql = `
      FROM notifications n
      LEFT JOIN users u ON n.recipient_user_id = u.user_id
      WHERE n.org_id = $1::uuid
        AND (n.category = 'FEE'::notification_category OR n.type LIKE 'fee.%')
    `;

    const params: any[] = [safeOrgId];

    if (filter.type && filter.type !== 'all') {
      params.push(filter.type);
      baseSql += ` AND n.type = $${params.length} `;
    }

    if (filter.isRead !== undefined && filter.isRead !== null) {
      params.push(filter.isRead);
      baseSql += ` AND n.is_read = $${params.length}::boolean `;
    }

    if (filter.channel && filter.channel !== 'all') {
      params.push(filter.channel);
      baseSql += ` AND (n.metadata->>'channel' = $${params.length} OR ($${params.length} = 'in_app' AND n.metadata->>'channel' IS NULL)) `;
    }

    if (filter.fromDate) {
      params.push(filter.fromDate);
      baseSql += ` AND n.created_at >= $${params.length}::timestamptz `;
    }

    if (filter.toDate) {
      params.push(filter.toDate);
      baseSql += ` AND n.created_at <= $${params.length}::timestamptz `;
    }

    if (filter.search && filter.search.trim().length > 0) {
      const q = `%${filter.search.trim().toLowerCase()}%`;
      params.push(q);
      baseSql += ` AND (
        LOWER(n.title) LIKE $${params.length}
        OR LOWER(n.message) LIKE $${params.length}
        OR LOWER(n.type) LIKE $${params.length}
        OR LOWER(COALESCE(u.first_name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(u.email, '')) LIKE $${params.length}
      ) `;
    }

    // 1. Count query
    const countSql = `SELECT COUNT(*)::int as total ${baseSql};`;
    const countRows: any = await db.$queryRawUnsafe(countSql, ...params);
    const total = countRows[0]?.total || 0;

    // 2. Data query
    const dataParams = [...params, limit, offset];
    const dataSql = `
      SELECT
        n.notification_id,
        n.org_id,
        n.recipient_user_id,
        n.category,
        n.type,
        n.priority,
        n.title,
        n.message,
        n.entity_type,
        n.entity_id,
        n.action_url,
        n.is_read,
        n.read_at,
        n.metadata,
        n.created_at,
        n.updated_at,
        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) as recipient_name,
        u.email as recipient_email
      ${baseSql}
      ORDER BY n.created_at DESC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
    `;

    const rows: any = await db.$queryRawUnsafe(dataSql, ...dataParams);

    return {
      items: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves summary statistics for finance notification overview (Screen A).
   */
  public static async getNotificationSummary(
    orgId: string,
    client?: any
  ): Promise<{
    total: number;
    sentAccepted: number;
    delivered: number;
    failed: number;
    unread: number;
  }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const sql = `
      SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN metadata->>'delivery_status' IN ('accepted', 'delivered') OR metadata->>'delivery_status' IS NULL THEN 1 END)::int as sent_accepted,
        COUNT(CASE WHEN metadata->>'delivery_status' = 'delivered' OR (metadata->>'channel' = 'in_app' OR metadata->>'channel' IS NULL) THEN 1 END)::int as delivered,
        COUNT(CASE WHEN metadata->>'delivery_status' = 'failed' THEN 1 END)::int as failed,
        COUNT(CASE WHEN is_read = false THEN 1 END)::int as unread
      FROM notifications
      WHERE org_id = $1::uuid
        AND (category = 'FEE'::notification_category OR type LIKE 'fee.%');
    `;

    const rows: any = await db.$queryRawUnsafe(sql, safeOrgId);
    const r = rows[0] || {};

    return {
      total: r.total || 0,
      sentAccepted: r.sent_accepted || 0,
      delivered: r.delivered || 0,
      failed: r.failed || 0,
      unread: r.unread || 0,
    };
  }

  /**
   * Finds a single finance notification strictly scoped to tenant org.
   */
  public static async findById(
    orgId: string,
    notificationId: string,
    client?: any
  ): Promise<FinanceNotificationRecord | null> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeId = toSafeUuid(notificationId);

    if (!safeId) return null;

    const rows: any = await db.$queryRaw`
      SELECT
        n.notification_id,
        n.org_id,
        n.recipient_user_id,
        n.category,
        n.type,
        n.priority,
        n.title,
        n.message,
        n.entity_type,
        n.entity_id,
        n.action_url,
        n.is_read,
        n.read_at,
        n.metadata,
        n.created_at,
        n.updated_at,
        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) as recipient_name,
        u.email as recipient_email
      FROM notifications n
      LEFT JOIN users u ON n.recipient_user_id = u.user_id
      WHERE n.notification_id = ${safeId}::uuid
        AND n.org_id = ${safeOrgId}::uuid
      LIMIT 1;
    `;

    return rows[0] || null;
  }

  /**
   * Updates metadata to record a safe retry attempt.
   */
  public static async recordRetry(
    orgId: string,
    notificationId: string,
    channel: string,
    newStatus?: string,
    client?: any
  ): Promise<boolean> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeId = toSafeUuid(notificationId);

    if (!safeId) return false;

    if (newStatus) {
      await db.$queryRaw`
        UPDATE notifications
        SET metadata = jsonb_set(
          jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{retry_history}',
            COALESCE(metadata->'retry_history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'retried_at', NOW(),
              'channel', ${channel}::text,
              'status', ${newStatus}::text
            ))
          ),
          '{delivery_status}',
          to_jsonb(${newStatus}::text)
        ),
        updated_at = NOW()
        WHERE notification_id = ${safeId}::uuid
          AND org_id = ${safeOrgId}::uuid;
      `;
    } else {
      await db.$queryRaw`
        UPDATE notifications
        SET metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{retry_history}',
          COALESCE(metadata->'retry_history', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'retried_at', NOW(),
            'channel', ${channel}::text
          ))
        ),
        updated_at = NOW()
        WHERE notification_id = ${safeId}::uuid
          AND org_id = ${safeOrgId}::uuid;
      `;
    }

    return true;
  }
}
