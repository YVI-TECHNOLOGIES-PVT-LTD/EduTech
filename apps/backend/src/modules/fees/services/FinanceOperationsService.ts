/**
 * EduTrack ERP — Phase 15 Finance Operations Service
 * ====================================================
 * Business logic layer for Finance Operations Optimization & Executive Insights.
 * 
 * Non-Negotiable Invariants:
 * - Strict tenant isolation on orgId.
 * - Defensive CSV formula injection sanitization (including whitespace-preceded `=, +, -, @, \t, \r`).
 * - Parameterized SQL queries via FinanceOperationsRepository.
 * - Exact monetary decimal rounding.
 * - Read-only operational summaries under database schema freeze.
 */

import {
  FinanceOperationsRepository,
  OperationsDateFilter,
  CollectionsAnalysisFilter,
  ExceptionsQueueFilter
} from '../repositories/FinanceOperationsRepository';

export class FinanceOperationsService {
  /**
   * Defensive CSV formula injection sanitizer.
   * Prepends a single quote if the value begins with dangerous spreadsheet formula characters,
   * even when preceded by arbitrary whitespace.
   */
  public static sanitizeCsvField(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val);
    const trimmed = str.replace(/^[ ]+/, '');
    if (/^=/.test(trimmed) || /^=/.test(str)) {
      str = "''" + str;
    } else if (/^[+\-@\t\r]/.test(trimmed) || /^[+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private static validateTenant(tenantOrgId: string) {
    if (!tenantOrgId || !tenantOrgId.trim()) {
      const err: any = new Error('Tenant organization context is required.');
      err.code = 'TENANT_NOT_FOUND';
      err.statusCode = 400;
      throw err;
    }
  }

  public static async getCapabilities(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return await FinanceOperationsRepository.getCapabilities(tenantOrgId);
  }

  public static async getOverview(tenantOrgId: string, filter?: OperationsDateFilter) {
    this.validateTenant(tenantOrgId);
    return await FinanceOperationsRepository.getExecutiveOverview(tenantOrgId, filter);
  }

  public static async getCollections(tenantOrgId: string, filter?: CollectionsAnalysisFilter) {
    this.validateTenant(tenantOrgId);
    return await FinanceOperationsRepository.getCollectionsPerformance(tenantOrgId, filter);
  }

  public static async getReceivables(tenantOrgId: string, filter?: OperationsDateFilter) {
    this.validateTenant(tenantOrgId);
    return await FinanceOperationsRepository.getReceivablesAndAgeing(tenantOrgId, filter);
  }

  public static async getExceptions(tenantOrgId: string, filter?: ExceptionsQueueFilter) {
    this.validateTenant(tenantOrgId);
    return await FinanceOperationsRepository.getExceptionActionCenter(tenantOrgId, filter);
  }

  public static async getDataQuality(tenantOrgId: string) {
    this.validateTenant(tenantOrgId);
    return await FinanceOperationsRepository.getDataQualityAndReadiness(tenantOrgId);
  }

  /**
   * Export operational data as sanitized CSV
   */
  public static async exportCSV(
    tenantOrgId: string,
    exportType: 'overview' | 'collections' | 'receivables' | 'exceptions',
    filter?: any
  ): Promise<string> {
    this.validateTenant(tenantOrgId);

    const now = new Date().toISOString();
    const preamble = [
      `# EduTrack ERP — Finance Operations & Executive Insights Export`,
      `# Export Type: ${exportType.toUpperCase()}`,
      `# Generated Date: ${now}`,
      `# Tenant Org ID: ${tenantOrgId}`,
      `# Compliance: Operational management report derived from transactional ledger. Not an audited statutory statement.`,
      `# Schema Status: Database schema freeze strictly enforced.`
    ].join('\r\n') + '\r\n\r\n';

    if (exportType === 'overview') {
      const overview = await this.getOverview(tenantOrgId, filter);
      const rows = [
        ['Metric Category', 'Metric Name', 'Value', 'Currency / Unit', 'Notes'],
        ['Collections', 'Total Successful Collections', overview.collections.total_collected, overview.collections.currency_code, 'Confirmed successful payments'],
        ['Collections', 'Successful Transaction Count', overview.collections.successful_count, 'Count', 'Count of settled transactions'],
        ['Collections', 'Pending Transactions Amount', overview.collections.pending_amount, overview.collections.currency_code, 'Gateway pending confirmation'],
        ['Collections', 'Failed Transactions Amount', overview.collections.failed_amount, overview.collections.currency_code, 'Rejected or aborted transactions'],
        ['Receivables', 'Total Assessed Dues', overview.receivables.total_assessed, overview.receivables.currency_code, 'Active student charge dues'],
        ['Receivables', 'Total Allocated Paid', overview.receivables.total_allocated, overview.receivables.currency_code, 'Allocated to dues'],
        ['Receivables', 'Total Outstanding Balance', overview.receivables.total_outstanding, overview.receivables.currency_code, 'Remaining collectible balance'],
        ['Receivables', 'Total Overdue Balance', overview.receivables.total_overdue, overview.receivables.currency_code, 'Dues with due date past today'],
        ['Receivables', 'Current Dues (Not Overdue)', overview.receivables.total_current_due, overview.receivables.currency_code, 'Dues upcoming'],
        ['Performance', 'Collection Realization Rate', `${overview.performance.collection_rate_percentage}%`, 'Percentage', overview.performance.formula_description],
        ['Exceptions', 'Total Unresolved Exceptions', overview.exceptions.total_exceptions_count, 'Count', 'Aggregated across 5 subsystems'],
        ['Exceptions', 'Captured Unallocated Funds Amount', overview.exceptions.unallocated_payments_amount, overview.collections.currency_code, 'Requires reconciliation allocation'],
        ['Concessions', 'Pending Review Count', overview.concessions.pending_review_count, 'Count', 'Concessions requiring supervisor review'],
        ['Data Readiness', 'Readiness Score', `${overview.data_readiness.readiness_score}%`, 'Score', overview.data_readiness.disclaimer]
      ];

      const csvBody = rows
        .map(r => r.map(c => this.sanitizeCsvField(c)).join(','))
        .join('\r\n');

      return preamble + csvBody;
    }

    if (exportType === 'collections') {
      const collections = await this.getCollections(tenantOrgId, filter);
      const rows = [
        ['Section', 'Identifier', 'Label', 'Transaction Count', 'Total Amount', 'Percentage of Total'],
        ...collections.by_payment_method.map(m => [
          'Payment Method',
          m.payment_method,
          m.payment_method,
          m.count,
          m.amount,
          `${m.percentage}%`
        ]),
        ...collections.collections_over_time.map(t => [
          'Timeline',
          t.period_key,
          t.period_label,
          t.count,
          t.amount,
          'N/A'
        ]),
        ...collections.by_fee_component.map(fc => [
          'Fee Component',
          fc.component_id,
          fc.component_name,
          fc.transaction_count,
          fc.allocated_amount,
          'N/A'
        ]),
        ...collections.by_academic_year.map(ay => [
          'Academic Year',
          ay.academic_year_id,
          ay.academic_year_name,
          ay.count,
          ay.amount,
          'N/A'
        ])
      ];

      const csvBody = rows
        .map(r => r.map(c => this.sanitizeCsvField(c)).join(','))
        .join('\r\n');

      return preamble + csvBody;
    }

    if (exportType === 'receivables') {
      const receivables = await this.getReceivables(tenantOrgId, filter);
      const rows = [
        ['Bucket Key', 'Ageing Bucket Label', 'Total Outstanding Amount', 'Dues Count', 'Student Count', 'Percentage'],
        ...receivables.ageing_buckets.map(b => [
          b.bucket_key,
          b.label,
          b.amount,
          b.dues_count,
          b.student_count,
          `${b.percentage}%`
        ]),
        ['SUMMARY', 'Total Outstanding Receivables', receivables.total_outstanding, 'N/A', 'N/A', '100%'],
        ['SUMMARY', 'Total Overdue Receivables', receivables.total_overdue, 'N/A', 'N/A', 'N/A'],
        ['SUMMARY', 'Total Current Receivables', receivables.total_current, 'N/A', 'N/A', 'N/A'],
        ['SUMMARY', 'Total Undated Receivables', receivables.total_undated, 'N/A', 'N/A', 'N/A']
      ];

      const csvBody = rows
        .map(r => r.map(c => this.sanitizeCsvField(c)).join(','))
        .join('\r\n');

      return preamble + csvBody;
    }

    if (exportType === 'exceptions') {
      const exceptions = await this.getExceptions(tenantOrgId, { limit: 100 });
      const rows = [
        ['Exception ID', 'Source Module', 'Category', 'Severity', 'Detected Timestamp', 'Description', 'Source Status', 'Drilldown URL'],
        ...exceptions.items.map(e => [
          e.id,
          e.source_module,
          e.category,
          e.severity,
          e.detected_at || 'UNAVAILABLE',
          e.description,
          e.source_status,
          e.drilldown_url
        ])
      ];

      const csvBody = rows
        .map(r => r.map(c => this.sanitizeCsvField(c)).join(','))
        .join('\r\n');

      return preamble + csvBody;
    }

    throw new Error(`Unsupported export type: ${exportType}`);
  }
}
