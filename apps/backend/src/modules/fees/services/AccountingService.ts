/**
 * EduTrack ERP — Phase 11 Finance Accounting Service
 * ========================================================
 * High-integrity domain service for Finance Accounting & General Ledger Integration.
 * 
 * Primary Invariants:
 * - Enforces strict tenant scope on every query.
 * - Truthfully reports that physical General Ledger journal persistence is Blocked by Schema Freeze.
 * - Never fabricates fake journal entries, account balances, or trial balances.
 * - Provides decimal-safe double-entry validation logic.
 * - Sanitizes all CSV exports against spreadsheet formula injection (=, +, -, @).
 * - Distinguishes operational payment/reconciliation success from GL accounting posting.
 */

import {
  AccountingRepository,
  AccountingReadinessFilterOptions,
  AccountingSummaryKPIs,
} from '../repositories/AccountingRepository';

export interface JournalLine {
  account_code: string;
  account_name?: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface SimulatedJournalEntry {
  source_type: string;
  source_id: string;
  entry_date: string;
  lines: JournalLine[];
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  persistence_status: 'BLOCKED_BY_SCHEMA_FREEZE';
  reason: string;
}

export class AccountingService {
  /**
   * Decimal-safe financial rounding to 2 decimal places.
   */
  public static roundMoney(amount: number): number {
    return Math.round((Number(amount) || 0) * 100) / 100;
  }

  /**
   * Sanitizes a string for CSV export to protect against Spreadsheet Formula Injection (CSV Injection).
   * Prepends a single quote if the field begins with =, +, -, @, \t, or \r.
   */
  public static sanitizeCsvField(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Check for dangerous leading characters that trigger spreadsheet execution
    if (/^[=+\-@\t\r]/.test(str)) {
      return `"'${str.replace(/"/g, '""')}"`;
    }
    // Standard CSV escaping if string contains comma, quote, or newline
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Get authoritative accounting capabilities status.
   */
  public static getCapabilities(tenantOrgId: string) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }

    const matrix = AccountingRepository.getCapabilitiesMatrix();
    return {
      capabilities: matrix,
      schema_freeze_status: 'ACTIVE',
      database_tables_present: [
        'payment_transactions',
        'student_charges',
        'student_charge_dues',
        'scholarship_concessions',
        'gateway_settlements',
        'gateway_settlement_items',
        'fee_components',
      ],
      database_tables_missing_for_full_gl: [
        'chart_of_accounts',
        'journal_entries',
        'journal_entry_lines',
        'accounting_periods',
        'account_balances',
      ],
      message:
        'General Ledger journal persistence is blocked by Stage-1 database schema freeze. Operational financial transactions are tracked with readiness indicators and standard debit/credit mappings for downstream ERP integration.',
    };
  }

  /**
   * Get accounting readiness summary KPIs for tenant.
   */
  public static async getSummary(
    tenantOrgId: string,
    options?: { startDate?: string; endDate?: string }
  ): Promise<AccountingSummaryKPIs> {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }
    return await AccountingRepository.getSummaryKPIs(tenantOrgId, options);
  }

  /**
   * Get paginated operational register of transactions awaiting accounting treatment.
   */
  public static async getReadinessRegister(
    tenantOrgId: string,
    options?: AccountingReadinessFilterOptions
  ) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }
    return await AccountingRepository.getReadinessRegister(tenantOrgId, options);
  }

  /**
   * Return standard educational chart of accounts dictionary with mapping guidance.
   */
  public static getAccounts(tenantOrgId: string) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }
    return {
      accounts: AccountingRepository.getStandardChartOfAccounts(),
      is_custom_editable: false,
      notice:
        'Standard educational accounts reference model. Custom account creation is blocked by the database schema freeze.',
    };
  }

  /**
   * Decimal-safe double-entry balancing validation.
   */
  public static validateDoubleEntryJournal(lines: JournalLine[]): {
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    imbalance_amount: number;
  } {
    if (!Array.isArray(lines) || lines.length === 0) {
      return { total_debit: 0, total_credit: 0, is_balanced: false, imbalance_amount: 0 };
    }

    const totalDebit = this.roundMoney(
      lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    );
    const totalCredit = this.roundMoney(
      lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
    );
    const diff = Math.abs(this.roundMoney(totalDebit - totalCredit));
    const isBalanced = diff < 0.009;

    return {
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: isBalanced,
      imbalance_amount: this.roundMoney(diff),
    };
  }

  /**
   * Simulates how an operational event translates into a balanced double-entry journal entry.
   * Discloses truthfully that persistence is blocked by the schema freeze.
   */
  public static simulateJournalFromOperationalEvent(
    eventType: 'PAYMENT' | 'FEE_ASSESSMENT' | 'CONCESSION' | 'SETTLEMENT',
    payload: {
      sourceId: string;
      amount: number;
      feeAmount?: number;
      taxAmount?: number;
      netAmount?: number;
      entryDate?: string;
    }
  ): SimulatedJournalEntry {
    const amount = this.roundMoney(payload.amount);
    const date = payload.entryDate || new Date().toISOString();
    let lines: JournalLine[] = [];

    switch (eventType) {
      case 'PAYMENT':
        // Collection: Debit Bank Clearing (Asset), Credit Accounts Receivable (Asset reduction)
        lines = [
          {
            account_code: '1010',
            account_name: 'Bank Account / Payment Gateway Clearing',
            debit: amount,
            credit: 0,
            description: `Payment collection for order ${payload.sourceId}`,
          },
          {
            account_code: '1200',
            account_name: 'Accounts Receivable (Students)',
            debit: 0,
            credit: amount,
            description: `Student obligation reduction for order ${payload.sourceId}`,
          },
        ];
        break;

      case 'FEE_ASSESSMENT':
        // Fee Assessment: Debit Accounts Receivable (Asset), Credit Tuition Fee Revenue (Revenue)
        lines = [
          {
            account_code: '1200',
            account_name: 'Accounts Receivable (Students)',
            debit: amount,
            credit: 0,
            description: `Fee assessment due ${payload.sourceId}`,
          },
          {
            account_code: '4000',
            account_name: 'Tuition Fee Revenue',
            debit: 0,
            credit: amount,
            description: `Fee revenue recognized for ${payload.sourceId}`,
          },
        ];
        break;

      case 'CONCESSION':
        // Concession Applied: Debit Scholarship Contra-Revenue, Credit Accounts Receivable
        lines = [
          {
            account_code: '4900',
            account_name: 'Scholarship & Concession Contra-Revenue',
            debit: amount,
            credit: 0,
            description: `Approved fee concession applied for ${payload.sourceId}`,
          },
          {
            account_code: '1200',
            account_name: 'Accounts Receivable (Students)',
            debit: 0,
            credit: amount,
            description: `Student receivable waiver for ${payload.sourceId}`,
          },
        ];
        break;

      case 'SETTLEMENT':
        // Gateway Bank Disbursement:
        // Debit Operating Bank (net received), Debit Gateway Processing Expense (fee+tax), Credit Clearing (gross)
        const fee = this.roundMoney(payload.feeAmount || 0);
        const tax = this.roundMoney(payload.taxAmount || 0);
        const expenseTotal = this.roundMoney(fee + tax);
        const net = this.roundMoney(payload.netAmount || amount - expenseTotal);
        lines = [
          {
            account_code: '1020',
            account_name: 'Operating Bank Account (Main)',
            debit: net,
            credit: 0,
            description: `Net bank disbursement for settlement ${payload.sourceId}`,
          },
          {
            account_code: '5100',
            account_name: 'Payment Gateway Processing Charges & Taxes',
            debit: expenseTotal,
            credit: 0,
            description: `Gateway processing fees & GST for settlement ${payload.sourceId}`,
          },
          {
            account_code: '1010',
            account_name: 'Bank Account / Payment Gateway Clearing',
            debit: 0,
            credit: amount,
            description: `Clearing gross settlement for ${payload.sourceId}`,
          },
        ];
        break;

      default:
        lines = [];
    }

    const balanceCheck = this.validateDoubleEntryJournal(lines);

    return {
      source_type: eventType,
      source_id: payload.sourceId,
      entry_date: date,
      lines,
      total_debit: balanceCheck.total_debit,
      total_credit: balanceCheck.total_credit,
      is_balanced: balanceCheck.is_balanced,
      persistence_status: 'BLOCKED_BY_SCHEMA_FREEZE',
      reason:
        'Physical PostgreSQL schema lacks durable journal_entries and journal_entry_lines tables.',
    };
  }

  /**
   * Return journal query response disclosing that journal persistence is blocked.
   */
  public static getJournals(tenantOrgId: string) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }
    return {
      data: [],
      total: 0,
      capability_status: 'blocked_by_schema_freeze',
      message:
        'General Ledger journal persistence is blocked by Stage-1 database schema freeze. No physical journal tables exist in PostgreSQL.',
    };
  }

  /**
   * Return trial balance response disclosing that GL trial balance is blocked.
   */
  public static async getTrialBalance(tenantOrgId: string) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }

    const summary = await AccountingRepository.getSummaryKPIs(tenantOrgId);

    return {
      capability_status: 'blocked_by_schema_freeze',
      message:
        'Trial balance generation from General Ledger is blocked because physical journal lines do not exist. Operational summary figures are provided below for reconciliation.',
      operational_summary: {
        total_assessed_receivables: summary.unposted_fee_assessments_amount,
        total_collected_funds: summary.unposted_payments_amount,
        total_applied_concessions: summary.unposted_concessions_amount,
        total_settled_disbursements: summary.unposted_settlements_amount,
      },
    };
  }

  /**
   * Return general ledger report response disclosing that GL reports are blocked.
   */
  public static getGeneralLedger(tenantOrgId: string) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }
    return {
      capability_status: 'blocked_by_schema_freeze',
      message:
        'General ledger account report generation is blocked because physical journal tables do not exist in the database.',
    };
  }

  /**
   * Retrieve prioritized accounting review exceptions.
   */
  public static async getAccountingExceptions(
    tenantOrgId: string,
    options?: { limit?: number; offset?: number }
  ) {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }
    return await AccountingRepository.getAccountingExceptions(tenantOrgId, options);
  }

  /**
   * Export accounting readiness register as CSV with formula injection sanitization.
   */
  public static async exportReadinessCSV(
    tenantOrgId: string,
    options?: AccountingReadinessFilterOptions
  ): Promise<string> {
    if (!tenantOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }

    const { records } = await AccountingRepository.getReadinessRegister(tenantOrgId, {
      ...options,
      limit: 1000,
      offset: 0,
    });

    const headers = [
      'Record ID',
      'Source Type',
      'Source Reference',
      'Transaction Date',
      'Student Name',
      'Admission No',
      'Amount',
      'Currency',
      'Operational Status',
      'Reconciliation Status',
      'Accounting Readiness',
      'Suggested Debit Account',
      'Suggested Credit Account',
      'Notes',
    ];

    const rows = records.map((r) => [
      this.sanitizeCsvField(r.record_id),
      this.sanitizeCsvField(r.source_type),
      this.sanitizeCsvField(r.source_reference),
      this.sanitizeCsvField(r.source_date),
      this.sanitizeCsvField(r.student_name || 'N/A'),
      this.sanitizeCsvField(r.admission_no || 'N/A'),
      this.sanitizeCsvField(r.amount.toFixed(2)),
      this.sanitizeCsvField(r.currency_code),
      this.sanitizeCsvField(r.operational_status),
      this.sanitizeCsvField(r.reconciliation_status),
      this.sanitizeCsvField(r.accounting_readiness_status),
      this.sanitizeCsvField(r.suggested_debit_account),
      this.sanitizeCsvField(r.suggested_credit_account),
      this.sanitizeCsvField(r.notes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    return csvContent;
  }
}
export default AccountingService;
