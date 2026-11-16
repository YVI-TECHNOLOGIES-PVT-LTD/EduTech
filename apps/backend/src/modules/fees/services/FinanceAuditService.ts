/**
 * EduTrack ERP — Phase 14 Finance Audit Service
 * ===============================================
 * Business logic, governance evaluation, and exception auditing engine.
 * 
 * Invariants:
 * - Read-only operational oversight respecting the schema freeze.
 * - Strict tenant isolation on org_id.
 * - Decimal-safe money arithmetic (roundMoney).
 * - Distinguishes verified exceptions, review candidates, and schema-blocked features.
 * - Protects against CSV formula injection.
 * - Zero artificial or simulated financial journal entries.
 */

import { FinanceAuditRepository, AuditPaginationFilter } from '../repositories/FinanceAuditRepository';
import { AccountingService } from './AccountingService';

export class FinanceAuditService {
  public static roundMoney(val: number | string | null | undefined): number {
    return FinanceAuditRepository.roundMoney(val);
  }

  /**
   * Sanitizes spreadsheet formula injection prefixes (=, +, -, @, \t, \r)
   * Double single quotes on '=' ensures spreadsheet engines do not swallow text markers.
   */
  public static sanitizeCsvField(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val);
    const trimmed = str.trimStart();
    if (/^=/.test(trimmed)) {
      str = "''" + str;
    } else if (/^[+\-@\t\r]/.test(trimmed)) {
      str = "'" + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private static validateTenant(tenantOrgId: string) {
    if (!tenantOrgId || typeof tenantOrgId !== 'string' || tenantOrgId.trim() === '') {
      throw new Error('Tenant organization ID is mandatory for financial audit.');
    }
  }

  // =========================================================================
  // 1. CAPABILITIES & SYSTEM STATE
  // =========================================================================
  public static async getCapabilities(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getAuditCapabilities(tenantOrgId);
  }

  // =========================================================================
  // 2. AUDIT SUMMARY
  // =========================================================================
  public static async getSummary(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getAuditSummary(tenantOrgId);
  }

  // =========================================================================
  // 3. PAYMENT AUDIT REGISTER
  // =========================================================================
  public static async getPayments(tenantOrgId: string, filters?: AuditPaginationFilter) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getPaymentAuditRegister(tenantOrgId, filters);
  }

  // =========================================================================
  // 4. SETTLEMENT AUDIT
  // =========================================================================
  public static async getSettlements(tenantOrgId: string, filters?: AuditPaginationFilter) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getSettlementAudit(tenantOrgId, filters);
  }

  // =========================================================================
  // 5. CONCESSION AUDIT
  // =========================================================================
  public static async getConcessions(tenantOrgId: string, filters?: AuditPaginationFilter) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getConcessionAudit(tenantOrgId, filters);
  }

  // =========================================================================
  // 6. WEBHOOK & RECOVERY AUDIT
  // =========================================================================
  public static async getWebhooks(tenantOrgId: string, filters?: AuditPaginationFilter) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getWebhookAudit(tenantOrgId, filters);
  }

  // =========================================================================
  // 7. ACCOUNTING READINESS AUDIT
  // =========================================================================
  public static async getAccountingReadinessAudit(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    const [summary, capabilities] = await Promise.all([
      AccountingService.getSummary(tenantOrgId),
      AccountingService.getCapabilities(tenantOrgId)
    ]);
    return {
      summary,
      capabilities,
      audit_governance: {
        formal_journal_posting_auditable: false,
        trial_balance_verification_auditable: false,
        limitation_notice: 'Under finalized database schema freeze, durable general ledger tables do not exist. Audit is limited to operational event readiness.'
      }
    };
  }

  // =========================================================================
  // 8. AUDIT CONTROL MATRIX
  // =========================================================================
  public static async getCoverage(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return FinanceAuditRepository.getAuditControlMatrix(tenantOrgId);
  }

  // =========================================================================
  // 9. FORMULA-SANITIZED CSV EXPORTS
  // =========================================================================
  public static async exportAuditCSV(
    tenantOrgId: string,
    exportType: 'payments' | 'settlements' | 'concessions' | 'webhooks' | 'controls',
    filters?: AuditPaginationFilter
  ): Promise<string> {
    this.validateTenant(tenantOrgId);

    const timestamp = new Date().toISOString();
    const headerLines = [
      '# NOTICE: Generated via EduTrack ERP Financial Audit & Governance Engine',
      `# Report Type: ${exportType.toUpperCase()}`,
      `# Generated At: ${timestamp}`,
      `# Tenant Org ID: ${tenantOrgId}`,
      '# Compliance Disclaimer: Uncertified operational audit register. Derived strictly from operational database records under schema freeze.',
      ''
    ];

    if (exportType === 'payments') {
      const payments = await FinanceAuditRepository.getPaymentAuditRegister(tenantOrgId, {
        ...filters,
        limit: 1000
      });
      const csvHeader = 'Transaction Reference,Order Reference,Admission No,Student Name,Amount,Allocated,Unallocated,Status,Allocation Classification,Audit Flag,Transaction Date';
      const rows = payments.data.map(p => [
        this.sanitizeCsvField(p.payment_transaction_id),
        this.sanitizeCsvField(p.order_reference),
        this.sanitizeCsvField(p.admission_no),
        this.sanitizeCsvField(p.student_name),
        p.transaction_amount.toFixed(2),
        p.total_allocated.toFixed(2),
        p.unallocated_amount.toFixed(2),
        this.sanitizeCsvField(p.transaction_status),
        this.sanitizeCsvField(p.allocation_classification),
        p.audit_flag_raised ? 'FLAGGED' : 'NORMAL',
        this.sanitizeCsvField(p.transaction_date)
      ].join(','));
      return [...headerLines, csvHeader, ...rows].join('\r\n');
    }

    if (exportType === 'settlements') {
      const settlements = await FinanceAuditRepository.getSettlementAudit(tenantOrgId, {
        ...filters,
        limit: 1000
      });
      const csvHeader = 'Settlement Reference,Provider Settlement ID,Provider,Gross Amount,Fee Amount,Tax Amount,Other Adjustments,Net Amount,Calculated Net,Discrepancy,Audit Status,Settlement Date';
      const rows = settlements.data.map(s => [
        this.sanitizeCsvField(s.settlement_reference),
        this.sanitizeCsvField(s.provider_settlement_id),
        this.sanitizeCsvField(s.provider_name),
        s.gross_amount.toFixed(2),
        s.fee_amount.toFixed(2),
        s.tax_amount.toFixed(2),
        s.other_adjustment_amount.toFixed(2),
        s.net_settlement_amount.toFixed(2),
        s.calculated_net_amount.toFixed(2),
        s.arithmetic_discrepancy.toFixed(2),
        this.sanitizeCsvField(s.settlement_audit_status),
        this.sanitizeCsvField(s.settlement_date)
      ].join(','));
      return [...headerLines, csvHeader, ...rows].join('\r\n');
    }

    if (exportType === 'concessions') {
      const concessions = await FinanceAuditRepository.getConcessionAudit(tenantOrgId, {
        ...filters,
        limit: 1000
      });
      const csvHeader = 'Concession ID,Admission No,Student Name,Scholarship Type,Discount %,Discount Amount,Concession Status,Latest Action,Action By,Latest Action At,Control Finding';
      const rows = concessions.data.map(c => [
        this.sanitizeCsvField(c.concession_id),
        this.sanitizeCsvField(c.admission_no),
        this.sanitizeCsvField(c.student_name),
        this.sanitizeCsvField(c.scholarship_type),
        c.percentage.toFixed(2),
        c.discount_amount.toFixed(2),
        this.sanitizeCsvField(c.concession_status),
        this.sanitizeCsvField(c.latest_action || 'N/A'),
        this.sanitizeCsvField(c.latest_action_by || 'N/A'),
        this.sanitizeCsvField(c.latest_action_at || 'N/A'),
        this.sanitizeCsvField(c.control_finding)
      ].join(','));
      return [...headerLines, csvHeader, ...rows].join('\r\n');
    }

    if (exportType === 'webhooks') {
      const webhooks = await FinanceAuditRepository.getWebhookAudit(tenantOrgId, {
        ...filters,
        limit: 1000
      });
      const csvHeader = 'Webhook ID,Provider,Provider Event ID,Event Type,Order ID,Status,Received At,Processed At,Processing Error,Audit Finding';
      const rows = webhooks.data.map(w => [
        this.sanitizeCsvField(w.payment_webhook_event_id),
        this.sanitizeCsvField(w.provider_name),
        this.sanitizeCsvField(w.provider_event_id),
        this.sanitizeCsvField(w.event_type),
        this.sanitizeCsvField(w.payment_order_id || 'N/A'),
        this.sanitizeCsvField(w.webhook_status),
        this.sanitizeCsvField(w.received_at),
        this.sanitizeCsvField(w.processed_at || 'N/A'),
        this.sanitizeCsvField(w.processing_error || 'None'),
        this.sanitizeCsvField(w.webhook_finding)
      ].join(','));
      return [...headerLines, csvHeader, ...rows].join('\r\n');
    }

    // Default: Audit Control Matrix
    const coverage = await FinanceAuditRepository.getAuditControlMatrix(tenantOrgId);
    const csvHeader = 'Control ID,Control Name,Domain,Status,Finding Count,Finding Amount,Evidence Completeness,Limitation,Recommended Action';
    const rows = coverage.controls.map(c => [
      this.sanitizeCsvField(c.control_id),
      this.sanitizeCsvField(c.control_name),
      this.sanitizeCsvField(c.domain),
      this.sanitizeCsvField(c.status),
      c.finding_count,
      c.finding_amount.toFixed(2),
      this.sanitizeCsvField(c.evidence_completeness),
      this.sanitizeCsvField(c.limitation || 'None'),
      this.sanitizeCsvField(c.recommended_action)
    ].join(','));
    return [...headerLines, csvHeader, ...rows].join('\r\n');
  }
}
