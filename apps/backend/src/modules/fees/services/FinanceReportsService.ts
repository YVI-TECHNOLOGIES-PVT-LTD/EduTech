/**
 * EduTrack ERP — Phase 12 Finance Reports & Financial Intelligence Service
 * =========================================================================
 * Production-oriented domain logic for institutional financial reporting.
 * 
 * Features:
 * - Executive summary with data-backed KPIs and zero fabricated growth percentages.
 * - Granular collections reporting distinguishing captured vs unallocated vs pending vs failed.
 * - Ageing analysis aligned with Phase 8 receivables buckets (CURRENT, 1-7, 8-30, 31-60, 61-90, 90+).
 * - Component-level fee assessment aggregation with proper grain isolation (no Cartesian duplication).
 * - Scholarship & concession impact breakdown (approved vs applied).
 * - Gateway settlement reconciliation (gross vs net deposits vs gateway fees).
 * - Reusable Phase 10 reconciliation and Phase 11 accounting readiness metrics.
 * - Sanitized CSV export engine protected against spreadsheet formula injection (=, +, -, @).
 */

import {
  FinanceReportsRepository,
  ReportDateFilter,
  CollectionsFilterOptions,
  ReceivablesFilterOptions
} from '../repositories/FinanceReportsRepository';
import { ReconciliationService } from './ReconciliationService';
import { AccountingService } from './AccountingService';

export class FinanceReportsService {
  /**
   * Helper: Round monetary figures to 2 decimal places using epsilon math.
   */
  public static roundMoney(val: number | string | null | undefined): number {
    return FinanceReportsRepository.roundMoney(val);
  }

  /**
   * Helper: Sanitize string to prevent Spreadsheet Formula Injection in CSVs.
   * Prepends a single quote if the field begins with =, +, -, @, tab, or carriage return.
   */
  public static sanitizeCsvField(field: any): string {
    if (field === null || field === undefined) return '""';
    const str = String(field);
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
    if (str.length > 0 && dangerousChars.includes(str.charAt(0))) {
      return `"'${str.replace(/"/g, '""')}"`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  /**
   * Screen A — Executive Financial Summary
   */
  public static async getSummary(
    tenantOrgId: string,
    filter?: ReportDateFilter
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    return await FinanceReportsRepository.getExecutiveSummary(tenantOrgId, filter);
  }

  /**
   * Screen B — Collections Report
   */
  public static async getCollections(
    tenantOrgId: string,
    options?: CollectionsFilterOptions
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    return await FinanceReportsRepository.getCollectionsReport(tenantOrgId, options);
  }

  /**
   * Screen C — Receivables & Ageing Report
   */
  public static async getAgeing(
    tenantOrgId: string,
    options?: ReceivablesFilterOptions
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    return await FinanceReportsRepository.getAgeingReport(tenantOrgId, options);
  }

  /**
   * Screen D — Fee Assessment and Component Report
   */
  public static async getAssessments(
    tenantOrgId: string,
    filter?: ReportDateFilter
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    return await FinanceReportsRepository.getAssessmentAndComponentReport(tenantOrgId, filter);
  }

  /**
   * Screen E — Scholarships & Concessions Report
   */
  public static async getConcessions(
    tenantOrgId: string,
    filter?: ReportDateFilter
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    return await FinanceReportsRepository.getScholarshipsAndConcessionsReport(tenantOrgId, filter);
  }

  /**
   * Screen F — Gateway Settlements Report
   */
  public static async getSettlements(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    return await FinanceReportsRepository.getSettlementsReport(tenantOrgId, options);
  }

  /**
   * Screen G — Reconciliation Exceptions Report (Reusing Phase 10)
   */
  public static async getReconciliation(
    tenantOrgId: string,
    options?: { page?: number; limit?: number }
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    const summary = await ReconciliationService.getSummaryKPIs(tenantOrgId);
    const exceptions = await ReconciliationService.getExceptions(tenantOrgId, options);

    return {
      summary,
      exceptions
    };
  }

  /**
   * Screen H — Accounting Readiness Report (Reusing Phase 11)
   */
  public static async getAccountingReadiness(
    tenantOrgId: string,
    options?: { startDate?: string; endDate?: string }
  ) {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial reports');
    }

    const capabilities = AccountingService.getCapabilities(tenantOrgId);
    const summary = await AccountingService.getSummary(tenantOrgId, options);

    return {
      capabilities,
      summary,
      disclaimer: 'Operational accounting readiness only. Durable General Ledger journal persistence is Blocked by Schema Freeze.'
    };
  }

  // =========================================================================
  // Screen I — CSV Export Center (Server-side generated & formula-sanitized)
  // =========================================================================
  public static async exportReportCSV(
    tenantOrgId: string,
    reportType: string,
    options: any = {}
  ): Promise<string> {
    if (!tenantOrgId || tenantOrgId.trim().length === 0) {
      throw new Error('Tenant organization ID is mandatory for financial exports');
    }

    const sanitizedType = (reportType || 'summary').toLowerCase();

    switch (sanitizedType) {
      case 'collections': {
        const res = await FinanceReportsRepository.getCollectionsReport(tenantOrgId, {
          ...options,
          limit: 1000,
          offset: 0
        });

        const headers = [
          'Transaction ID',
          'Date',
          'Admission No',
          'Student Name',
          'Payment Method',
          'Status',
          'Amount',
          'Allocated Amount',
          'Unallocated Amount',
          'Gateway Payment ID',
          'Gateway Order ID',
          'Operational Classification'
        ];

        const rows = res.data.map((r: any) => [
          this.sanitizeCsvField(r.payment_transaction_id),
          this.sanitizeCsvField(r.transaction_date ? new Date(r.transaction_date).toISOString().slice(0, 10) : ''),
          this.sanitizeCsvField(r.admission_no || ''),
          this.sanitizeCsvField(r.student_name || ''),
          this.sanitizeCsvField(r.payment_method),
          this.sanitizeCsvField(r.status),
          this.sanitizeCsvField(r.amount),
          this.sanitizeCsvField(r.allocated_amount),
          this.sanitizeCsvField(r.unallocated_amount),
          this.sanitizeCsvField(r.gateway_payment_id || ''),
          this.sanitizeCsvField(r.gateway_order_id || ''),
          this.sanitizeCsvField(r.operational_classification)
        ]);

        return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      }

      case 'ageing':
      case 'receivables': {
        const res = await FinanceReportsRepository.getAgeingReport(tenantOrgId, {
          ...options,
          limit: 1000,
          offset: 0
        });

        const headers = [
          'Due ID',
          'Admission No',
          'Student Name',
          'Component',
          'Due Date',
          'Days Overdue',
          'Ageing Bucket',
          'Original Due',
          'Paid Amount',
          'Outstanding Amount'
        ];

        const rows = res.detail.data.map((r: any) => [
          this.sanitizeCsvField(r.student_charge_due_id),
          this.sanitizeCsvField(r.admission_no || ''),
          this.sanitizeCsvField(r.student_name || ''),
          this.sanitizeCsvField(r.component_name || ''),
          this.sanitizeCsvField(r.due_date ? new Date(r.due_date).toISOString().slice(0, 10) : ''),
          this.sanitizeCsvField(r.days_overdue),
          this.sanitizeCsvField(r.ageing_bucket),
          this.sanitizeCsvField(r.amount_due),
          this.sanitizeCsvField(r.paid_amount),
          this.sanitizeCsvField(r.outstanding_amount)
        ]);

        return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      }

      case 'assessments': {
        const res = await FinanceReportsRepository.getAssessmentAndComponentReport(tenantOrgId, options);

        const headers = [
          'Component Code',
          'Component Name',
          'Charges Count',
          'Students Count',
          'Assessed Amount',
          'Total Dues Amount',
          'Total Paid Amount',
          'Outstanding Amount',
          'Collection Rate (%)'
        ];

        const rows = res.components.map((c: any) => [
          this.sanitizeCsvField(c.component_code),
          this.sanitizeCsvField(c.component_name),
          this.sanitizeCsvField(c.charges_count),
          this.sanitizeCsvField(c.student_count),
          this.sanitizeCsvField(c.assessed_amount),
          this.sanitizeCsvField(c.total_dues_amount),
          this.sanitizeCsvField(c.total_paid_amount),
          this.sanitizeCsvField(c.total_outstanding_amount),
          this.sanitizeCsvField(c.collection_rate_pct)
        ]);

        return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      }

      case 'settlements': {
        const res = await FinanceReportsRepository.getSettlementsReport(tenantOrgId, {
          limit: 1000,
          offset: 0
        });

        const headers = [
          'Settlement ID',
          'Reference',
          'Provider',
          'Settlement Date',
          'Currency',
          'Gross Amount',
          'Gateway Fee',
          'Tax Amount',
          'Net Settlement Amount',
          'Status',
          'Items Count'
        ];

        const rows = res.data.map((s: any) => [
          this.sanitizeCsvField(s.gateway_settlement_id),
          this.sanitizeCsvField(s.settlement_reference),
          this.sanitizeCsvField(s.provider_name),
          this.sanitizeCsvField(s.settlement_date ? new Date(s.settlement_date).toISOString().slice(0, 10) : ''),
          this.sanitizeCsvField(s.currency_code),
          this.sanitizeCsvField(s.gross_amount),
          this.sanitizeCsvField(s.fee_amount),
          this.sanitizeCsvField(s.tax_amount),
          this.sanitizeCsvField(s.net_settlement_amount),
          this.sanitizeCsvField(s.status),
          this.sanitizeCsvField(s.items_count)
        ]);

        return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      }

      case 'summary':
      default: {
        const s = await FinanceReportsRepository.getExecutiveSummary(tenantOrgId, options);

        const lines = [
          ['Metric', 'Value', 'Currency'].map((h) => this.sanitizeCsvField(h)).join(','),
          [this.sanitizeCsvField('Total Fee Assessments'), this.sanitizeCsvField(s.fee_assessments_total), this.sanitizeCsvField('INR')].join(','),
          [this.sanitizeCsvField('Successful Collections'), this.sanitizeCsvField(s.successful_collections_total), this.sanitizeCsvField('INR')].join(','),
          [this.sanitizeCsvField('Successful Transactions Count'), this.sanitizeCsvField(s.successful_transactions_count), this.sanitizeCsvField('Count')].join(','),
          [this.sanitizeCsvField('Outstanding Receivables'), this.sanitizeCsvField(s.outstanding_receivables_total), this.sanitizeCsvField('INR')].join(','),
          [this.sanitizeCsvField('Overdue Receivables'), this.sanitizeCsvField(s.overdue_receivables_total), this.sanitizeCsvField('INR')].join(','),
          [this.sanitizeCsvField('Not Yet Due Receivables'), this.sanitizeCsvField(s.not_yet_due_receivables_total), this.sanitizeCsvField('INR')].join(','),
          [this.sanitizeCsvField('Collection Rate (%)'), this.sanitizeCsvField(s.collection_rate_pct), this.sanitizeCsvField('%')].join(','),
          [this.sanitizeCsvField('Captured-but-Unallocated Total'), this.sanitizeCsvField(s.captured_unallocated_total), this.sanitizeCsvField('INR')].join(','),
          [this.sanitizeCsvField('Captured-but-Unallocated Count'), this.sanitizeCsvField(s.captured_unallocated_count), this.sanitizeCsvField('Count')].join(','),
          [this.sanitizeCsvField('Approved Concessions Count'), this.sanitizeCsvField(s.concessions_approved_count), this.sanitizeCsvField('Count')].join(','),
          [this.sanitizeCsvField('Applied Concessions Count'), this.sanitizeCsvField(s.concessions_applied_count), this.sanitizeCsvField('Count')].join(','),
          [this.sanitizeCsvField('Settled Deposits (Net)'), this.sanitizeCsvField(s.settlements_net_total), this.sanitizeCsvField('INR')].join(',')
        ];

        return lines.join('\n');
      }
    }
  }
}

export default FinanceReportsService;
