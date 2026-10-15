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
import { runFinanceRouteTests } from './finance-routes.spec';

export async function runAllFinanceTests() {
  console.log('=====================================================');
  console.log('  EDUTRACK ERP FINANCE MODULE TEST SUITE             ');
  console.log('=====================================================\n');

  await runFinanceConfigurationTests();
  await runFinanceStructureTests();
  await runFinanceLedgerTests();
  await runFinanceParentAssignmentTests();
  await runFinancePaymentTests();
  await runFinanceGatewayTests();
  await runFinanceScholarshipTests();
  await runFinanceReceivablesTests();
  await runFinanceNotificationTests();
  await runFinanceReconciliationTests();
  await runFinanceAccountingTests();
  await runFinanceReportsTests();
  runFinanceRouteTests();

  console.log('\n=====================================================');
  console.log('  ALL FINANCE MODULE TESTS PASSED (PHASES 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 & 12) ✅');
  console.log('=====================================================');
}

if (require.main === module) {
  runAllFinanceTests().catch((err) => {
    console.error('Finance Test Runner Failed:', err);
    process.exit(1);
  });
}
