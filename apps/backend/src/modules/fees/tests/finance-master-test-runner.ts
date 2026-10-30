import { runFinanceConfigurationTests } from './finance-configuration.spec';
import { runFinanceStructureTests } from './finance-structures.spec';
import { runFinanceLedgerTests } from './finance-ledger.spec';
import { runFinanceParentAssignmentTests } from './finance-parent-assignment.spec';
import { runFinancePaymentTests } from './finance-payments.spec';
import { runFinanceGatewayTests } from './finance-gateway.spec';
import { runFinanceScholarshipTests } from './finance-scholarships.spec';
import { runFinanceReceivablesTests } from './finance-receivables.spec';
import { runFinanceNotificationTests } from './finance-notifications.spec';
import { runFinanceReconciliationTests } from './finance-reconciliation.spec';
import { runFinanceAccountingTests } from './finance-accounting.spec';
import { runFinanceReportsTests } from './finance-reports.spec';
import { runFinancePlanningTests } from './finance-planning.spec';
import { runFinanceAuditTests } from './finance-audit.spec';
import { runFinanceOperationsTests } from './finance-operations.spec';
import { runFinancePhase16Tests } from './finance-phase16-reliability.spec';
import { runFinanceRouteTests } from './finance-routes.spec';
import { runFinancePhase2ParentBreakdownTests } from './finance-phase2-parent-breakdown.spec';
import { runFinancePhase3ParentPaymentsTests } from './finance-phase3-parent-payments.spec';
import { runFinancePhase3HardeningTests } from './finance-phase3-hardening.spec';

export async function runAllFinanceTests() {
  console.log('=====================================================');
  console.log('  EDUTRACK ERP FINANCE MODULE MASTER TEST SUITE      ');
  console.log('=====================================================\n');

  await runFinanceConfigurationTests();
  await runFinanceStructureTests();
  await runFinanceLedgerTests();
  await runFinanceParentAssignmentTests();
  await runFinancePhase2ParentBreakdownTests();
  await runFinancePhase3ParentPaymentsTests();
  await runFinancePhase3HardeningTests();
  await runFinancePaymentTests();
  await runFinanceGatewayTests();
  await runFinanceScholarshipTests();
  await runFinanceReceivablesTests();
  await runFinanceNotificationTests();
  await runFinanceReconciliationTests();
  await runFinanceAccountingTests();
  await runFinanceReportsTests();
  await runFinancePlanningTests();
  await runFinanceAuditTests();
  await runFinanceOperationsTests();
  await runFinancePhase16Tests();
  runFinanceRouteTests();

  console.log('\n=====================================================');
  console.log('  ALL FINANCE MODULE TESTS PASSED (PHASES 2 THROUGH 16) ✅');
  console.log('=====================================================');
}

if (require.main === module) {
  runAllFinanceTests().catch((err) => {
    console.error('Finance Test Runner Failed:', err);
    process.exit(1);
  });
}
