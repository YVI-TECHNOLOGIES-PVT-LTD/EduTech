import prisma from '../../../lib/prismaClient';
import { supabase } from '../../../config/supabase';
import { logger } from '../../../utils/logger';
import axios from 'axios';

export interface EditableConfigDto {
  board_affiliation?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  receipt_footer?: string | null;
  default_payment_window_days?: number | null;
}

export interface SanitizedRazorpayStatus {
  name: 'Razorpay';
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'PARTIALLY_CONFIGURED';
  environment_mode: 'test' | 'live' | 'unknown';
  key_id_configured: boolean;
  key_secret_configured: boolean;
  webhook_secret_configured: boolean;
  last_validated_at: string | null;
  last_validation_status: 'SUCCESS' | 'FAILED' | 'PENDING' | null;
  setup_instructions: string;
}

export interface FinanceConfigurationResponse {
  organization: {
    org_id: string;
    org_name: string;
    org_code: string;
    board_affiliation: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string;
    phone: string;
    email: string;
    website: string | null;
    subscription_tier: string;
    status: string;
  };
  academic_year: {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  currency: {
    code: 'INR';
    symbol: '₹';
    is_editable: false;
    note: string;
  };
  receipts: {
    prefix: 'RCPT';
    format: 'RCPT-YYYY-000001';
    strategy: 'sequential';
    footer_note: string | null;
    is_sequence_editable: false;
    note: string;
  };
  demands: {
    prefix: 'DEM';
    format: 'DEM-YYYY-000001';
    strategy: 'sequential';
    default_payment_window_days: number;
    is_sequence_editable: false;
  };
  payment_methods: Array<{
    code: string;
    label: string;
    type: 'online_gateway' | 'offline_cash' | 'bank_transfer' | 'other';
    status: 'configured' | 'available' | 'requires_gateway';
    description: string;
  }>;
  gateway: SanitizedRazorpayStatus;
  operational_defaults: {
    default_payment_window_days: number;
    late_fee_supported: false;
    late_fee_note: string;
  };
  schema_limitations: string[];
  updated_at: string | null;
}

// In-memory gateway validation cache (server-side only, non-persistent)
let lastGatewayValidationResult: {
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
} | null = null;

// Tenant operational configuration cache for settings not persisted in finalized Prisma schema (per Rule 1.1)
const tenantOperationalCache = new Map<
  string,
  { receipt_footer: string | null; default_payment_window_days: number }
>();

export class SettingsService {
  /**
   * Evaluates Razorpay configuration from server environment variables.
   * NEVER returns secret values or exposes credentials.
   */
  public static getRazorpayStatus(): SanitizedRazorpayStatus {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const keyIdConfigured = Boolean(keyId && keyId.trim().length > 0);
    const keySecretConfigured = Boolean(keySecret && keySecret.trim().length > 0);
    const webhookSecretConfigured = Boolean(webhookSecret && webhookSecret.trim().length > 0);

    let status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'PARTIALLY_CONFIGURED' = 'NOT_CONFIGURED';
    if (keyIdConfigured && keySecretConfigured) {
      status = 'CONFIGURED';
    } else if (keyIdConfigured || keySecretConfigured) {
      status = 'PARTIALLY_CONFIGURED';
    }

    let environment_mode: 'test' | 'live' | 'unknown' = 'unknown';
    if (keyId) {
      if (keyId.startsWith('rzp_test_')) {
        environment_mode = 'test';
      } else if (keyId.startsWith('rzp_live_')) {
        environment_mode = 'live';
      }
    }

    const setup_instructions =
      status === 'CONFIGURED'
        ? 'Razorpay credentials detected. Use the Test Connection action to verify gateway connectivity.'
        : 'To activate online fee collections, configure RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET in your server environment (.env). Never commit secret keys to source code.';

    return {
      name: 'Razorpay',
      status,
      environment_mode,
      key_id_configured: keyIdConfigured,
      key_secret_configured: keySecretConfigured,
      webhook_secret_configured: webhookSecretConfigured,
      last_validated_at: lastGatewayValidationResult?.timestamp || null,
      last_validation_status: lastGatewayValidationResult?.status || null,
      setup_instructions,
    };
  }

  /**
   * Performs a safe, non-transactional credential test against Razorpay API.
   * Does NOT charge any card, does NOT create any transaction record, and does NOT leak secrets.
   */
  public static async testRazorpayConnection(): Promise<{
    success: boolean;
    status: 'SUCCESS' | 'FAILED' | 'NOT_CONFIGURED';
    message: string;
    timestamp: string;
  }> {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    const timestamp = new Date().toISOString();

    if (!keyId || !keySecret) {
      const result = {
        success: false,
        status: 'NOT_CONFIGURED' as const,
        message: 'Razorpay Key ID or Secret is not configured in server environment.',
        timestamp,
      };
      lastGatewayValidationResult = {
        timestamp,
        status: 'FAILED',
        message: result.message,
      };
      return result;
    }

    try {
      // Safe read-only probe: GET /v1/payments?count=1
      // Tests Basic Auth credentials without creating any orders or charging any card
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await axios.get('https://api.razorpay.com/v1/payments?count=1', {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
        timeout: 7000,
      });

      if (response.status >= 200 && response.status < 300) {
        lastGatewayValidationResult = {
          timestamp,
          status: 'SUCCESS',
          message: 'Razorpay credentials verified successfully.',
        };
        return {
          success: true,
          status: 'SUCCESS',
          message: 'Gateway credentials verified successfully with Razorpay API.',
          timestamp,
        };
      }

      throw new Error(`Unexpected gateway response code: ${response.status}`);
    } catch (err: any) {
      const sanitizedErrorMessage =
        err.response?.status === 401
          ? 'Authentication failed: Invalid Key ID or Key Secret.'
          : err.code === 'ECONNABORTED'
            ? 'Gateway connection timed out.'
            : 'Gateway probe failed. Verify network connectivity and API keys.';

      logger.warn('[SettingsService] Razorpay probe failure', {
        statusCode: err.response?.status,
        code: err.code,
      });

      lastGatewayValidationResult = {
        timestamp,
        status: 'FAILED',
        message: sanitizedErrorMessage,
      };

      return {
        success: false,
        status: 'FAILED',
        message: sanitizedErrorMessage,
        timestamp,
      };
    }
  }

  /**
   * Retrieves complete finance configuration for the authenticated tenant.
   */
  public static async getConfiguration(orgId: string): Promise<FinanceConfigurationResponse> {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }

    // 1. Resolve canonical organization record
    const org = await prisma.organizations.findFirst({
      where: {
        OR: [{ org_id: orgId }, { org_code: orgId }],
      },
    });

    if (!org) {
      throw new Error(`Organization record not found for tenant: ${orgId}`);
    }

    // 2. Resolve active academic year context
    const currentAcademicYear = await prisma.academic_years.findFirst({
      where: {
        org_id: org.org_id,
        status: { in: ['open', 'admissions_open', 'planning'] },
      },
      orderBy: { created_at: 'desc' },
      select: {
        academic_year_id: true,
        academic_year_name: true,
        status: true,
        start_date: true,
        end_date: true,
      },
    });

    // 3. Check legacy settings table with graceful fallback
    let legacySettings: any = null;
    try {
      const { data, error } = await supabase
        .from('finance_settings')
        .select('*')
        .eq('school_id', org.org_id)
        .single();

      if (!error && data) {
        legacySettings = data;
      }
    } catch {
      // Table does not exist in schema cache — expected per finalized schema
    }

    const gatewayStatus = this.getRazorpayStatus();
    const cachedOperational = tenantOperationalCache.get(org.org_id);
    const resolvedFooter = cachedOperational?.receipt_footer !== undefined
      ? cachedOperational.receipt_footer
      : (legacySettings?.receipt_footer || null);
    const resolvedPaymentWindow = cachedOperational?.default_payment_window_days !== undefined
      ? cachedOperational.default_payment_window_days
      : (legacySettings?.default_payment_window_days || 30);

    // 4. Return full capability matrix response
    return {
      organization: {
        org_id: org.org_id,
        org_name: org.org_name,
        org_code: org.org_code,
        board_affiliation: org.board_affiliation,
        address: org.address,
        city: org.city,
        state: org.state,
        postal_code: org.postal_code,
        country: org.country || 'India',
        phone: org.phone,
        email: org.email,
        website: org.website,
        subscription_tier: org.subscription_tier,
        status: org.status,
      },
      academic_year: currentAcademicYear
        ? {
            id: currentAcademicYear.academic_year_id,
            name: currentAcademicYear.academic_year_name,
            status: currentAcademicYear.status,
            start_date: currentAcademicYear.start_date.toISOString().split('T')[0],
            end_date: currentAcademicYear.end_date.toISOString().split('T')[0],
          }
        : null,
      currency: {
        code: 'INR',
        symbol: '₹',
        is_editable: false,
        note: 'Indian Rupee (INR) is the finalized base currency. Multi-currency accounting is not supported by the database schema.',
      },
      receipts: {
        prefix: 'RCPT',
        format: 'RCPT-YYYY-000001',
        strategy: 'sequential',
        footer_note: resolvedFooter,
        is_sequence_editable: false,
        note: 'Sequential receipt numbering (RCPT-YYYY-XXXXXX) is enforced by DocumentNumberService.',
      },
      demands: {
        prefix: 'DEM',
        format: 'DEM-YYYY-000001',
        strategy: 'sequential',
        default_payment_window_days: resolvedPaymentWindow,
        is_sequence_editable: false,
      },
      payment_methods: [
        {
          code: 'upi',
          label: 'Unified Payments Interface (UPI)',
          type: 'online_gateway',
          status: gatewayStatus.status === 'CONFIGURED' ? 'configured' : 'requires_gateway',
          description: 'Instant online mobile payments via UPI QR and apps.',
        },
        {
          code: 'card',
          label: 'Credit / Debit Cards',
          type: 'online_gateway',
          status: gatewayStatus.status === 'CONFIGURED' ? 'configured' : 'requires_gateway',
          description: 'Visa, MasterCard, RuPay cards processed via payment gateway.',
        },
        {
          code: 'net_banking',
          label: 'Internet Banking',
          type: 'online_gateway',
          status: gatewayStatus.status === 'CONFIGURED' ? 'configured' : 'requires_gateway',
          description: 'Direct bank debit via all major Indian retail and corporate banks.',
        },
        {
          code: 'cash',
          label: 'Cash Desk Collection',
          type: 'offline_cash',
          status: 'configured',
          description: 'Cash payments collected at school counter with instant receipt generation.',
        },
        {
          code: 'bank_transfer',
          label: 'Direct Bank Transfer / NEFT / RTGS',
          type: 'bank_transfer',
          status: 'configured',
          description: 'Direct institutional account transfers subject to manual reconciliation.',
        },
        {
          code: 'wallet',
          label: 'Digital Wallets',
          type: 'online_gateway',
          status: gatewayStatus.status === 'CONFIGURED' ? 'configured' : 'requires_gateway',
          description: 'Digital wallet providers supported via Razorpay checkout.',
        },
        {
          code: 'other',
          label: 'Other / Cheque / DD',
          type: 'other',
          status: 'available',
          description: 'Demand drafts and cheques verified prior to ledger clearance.',
        },
      ],
      gateway: gatewayStatus,
      operational_defaults: {
        default_payment_window_days: legacySettings?.default_payment_window_days || 30,
        late_fee_supported: false,
        late_fee_note:
          'Late fee automated penalty tables are absent from the finalized schema. Penalty rules require business module authorization.',
      },
      schema_limitations: [
        'Custom receipt prefixes and multi-sequence counters are immutable per database design.',
        'Multi-currency accounting is not permitted; currency is standardized to INR.',
        'Gateway secret credentials must reside in server-side environment variables and cannot be persisted in database tables.',
        'Tenancy is strictly scoped to organizations (org_id).',
      ],
      updated_at: org.updated_at ? org.updated_at.toISOString() : null,
    };
  }

  /**
   * Updates allowlisted configuration fields for the authenticated tenant.
   * Enforces strict allowlisting, rejects forbidden and mass-assignment fields,
   * writes audit records, and isolates updates by tenant.
   */
  public static async updateConfiguration(
    orgId: string,
    userId: string,
    payload: Record<string, any>,
  ): Promise<FinanceConfigurationResponse> {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }

    // 1. Resolve canonical tenant organization
    const org = await prisma.organizations.findFirst({
      where: {
        OR: [{ org_id: orgId }, { org_code: orgId }],
      },
    });

    if (!org) {
      throw new Error(`Organization record not found for tenant: ${orgId}`);
    }

    // 2. Reject immutable / dangerous / mass-assignment fields
    const FORBIDDEN_FIELDS = [
      'org_id',
      'org_code',
      'org_name',
      'status',
      'subscription_tier',
      'currency',
      'currency_code',
      'key_secret',
      'webhook_secret',
      'access_token',
      'created_at',
      'created_by',
      'id',
    ];

    for (const field of FORBIDDEN_FIELDS) {
      if (field in payload) {
        throw new Error(`Field '${field}' is immutable and cannot be updated.`);
      }
    }

    // 3. Allowlist valid editable fields
    const orgUpdates: Record<string, any> = {};
    const operationalUpdates: Record<string, any> = {};

    if (payload.board_affiliation !== undefined) {
      orgUpdates.board_affiliation = payload.board_affiliation ? String(payload.board_affiliation).trim() : null;
    }
    if (payload.address !== undefined) {
      orgUpdates.address = payload.address ? String(payload.address).trim() : null;
    }
    if (payload.city !== undefined) {
      orgUpdates.city = payload.city ? String(payload.city).trim() : null;
    }
    if (payload.state !== undefined) {
      orgUpdates.state = payload.state ? String(payload.state).trim() : null;
    }
    if (payload.postal_code !== undefined) {
      orgUpdates.postal_code = payload.postal_code ? String(payload.postal_code).trim() : null;
    }
    if (payload.phone !== undefined) {
      const phoneStr = String(payload.phone).trim();
      if (phoneStr.length < 5 || phoneStr.length > 20) {
        throw new Error('Phone number must be between 5 and 20 characters.');
      }
      orgUpdates.phone = phoneStr;
    }
    if (payload.email !== undefined) {
      const emailStr = String(payload.email).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
        throw new Error('A valid email address is required.');
      }
      orgUpdates.email = emailStr;
    }
    if (payload.website !== undefined) {
      orgUpdates.website = payload.website ? String(payload.website).trim() : null;
    }

    if (payload.receipt_footer !== undefined) {
      operationalUpdates.receipt_footer = payload.receipt_footer ? String(payload.receipt_footer).trim() : null;
    }
    if (payload.default_payment_window_days !== undefined) {
      const days = parseInt(payload.default_payment_window_days, 10);
      if (isNaN(days) || days < 1 || days > 365) {
        throw new Error('Default payment window must be between 1 and 365 days.');
      }
      operationalUpdates.default_payment_window_days = days;
    }

    const changedKeys = [...Object.keys(orgUpdates), ...Object.keys(operationalUpdates)];
    if (changedKeys.length === 0) {
      throw new Error('No valid editable fields were provided in the update payload.');
    }

    // 4. Update organization record in Prisma
    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (Object.keys(orgUpdates).length > 0) {
      await prisma.organizations.update({
        where: { org_id: org.org_id },
        data: {
          ...orgUpdates,
          updated_at: new Date(),
          updated_by: isUuid(userId) ? userId : null,
        },
      });
    }

    // 5. Update tenant operational cache and attempt persistence to legacy finance_settings if table exists
    if (Object.keys(operationalUpdates).length > 0) {
      const existing = tenantOperationalCache.get(org.org_id) || {
        receipt_footer: null,
        default_payment_window_days: 30,
      };
      tenantOperationalCache.set(org.org_id, {
        receipt_footer:
          operationalUpdates.receipt_footer !== undefined
            ? operationalUpdates.receipt_footer
            : existing.receipt_footer,
        default_payment_window_days:
          operationalUpdates.default_payment_window_days !== undefined
            ? operationalUpdates.default_payment_window_days
            : existing.default_payment_window_days,
      });

      try {
        await supabase
          .from('finance_settings')
          .upsert(
            {
              school_id: org.org_id,
              ...operationalUpdates,
              updated_by: userId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'school_id' },
          );
      } catch {
        // Graceful fallback: legacy table not present in finalized database
      }
    }

    // 6. Record audit log entry
    try {
      await supabase.from('finance_audit_logs').insert({
        action: 'FINANCE_CONFIG_UPDATED',
        entity_type: 'finance_configuration',
        entity_id: org.org_id,
        performed_by: userId,
        details: {
          changed_fields: changedKeys,
          org_id: org.org_id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch {
      logger.info('[AuditLog] Finance configuration updated', {
        action: 'FINANCE_CONFIG_UPDATED',
        org_id: org.org_id,
        user_id: userId,
        changed_fields: changedKeys,
      });
    }

    return await this.getConfiguration(org.org_id);
  }

  /**
   * Backwards-compatible legacy method for Phase 1 code.
   */
  public static async getSettings(schoolId: string) {
    try {
      const config = await this.getConfiguration(schoolId);
      return {
        school_id: config.organization.org_id,
        receipt_prefix: config.receipts.prefix,
        demand_prefix: config.demands.prefix,
        currency: config.currency.code,
        currency_symbol: config.currency.symbol,
        late_fee_enabled: false,
        late_fee_percentage: 0,
        grace_days: 0,
        default_payment_window_days: config.demands.default_payment_window_days,
        receipt_footer: config.receipts.footer_note,
        school_year_label: config.academic_year?.name || null,
        updated_at: config.updated_at,
      };
    } catch {
      return {
        school_id: schoolId,
        receipt_prefix: 'RCPT',
        demand_prefix: 'DEM',
        currency: 'INR',
        currency_symbol: '₹',
        late_fee_enabled: false,
        late_fee_percentage: 0,
        grace_days: 0,
        default_payment_window_days: 30,
        receipt_footer: null,
        school_year_label: null,
        updated_at: null,
      };
    }
  }

  /**
   * Backwards-compatible legacy method for Phase 1 code.
   */
  public static async upsertSettings(schoolId: string, updates: any) {
    const updated = await this.updateConfiguration(schoolId, updates.updated_by || 'system', updates);
    return {
      school_id: updated.organization.org_id,
      receipt_prefix: updated.receipts.prefix,
      demand_prefix: updated.demands.prefix,
      currency: updated.currency.code,
      currency_symbol: updated.currency.symbol,
      late_fee_enabled: false,
      late_fee_percentage: 0,
      grace_days: 0,
      default_payment_window_days: updated.demands.default_payment_window_days,
      receipt_footer: updated.receipts.footer_note,
      school_year_label: updated.academic_year?.name || null,
      updated_at: updated.updated_at,
    };
  }
}
