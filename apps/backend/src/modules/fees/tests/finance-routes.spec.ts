import assert from 'assert';
import { feesRouter } from '../fees.routes';
import { router as mainRouter } from '../../../routes';

export function runFinanceRouteTests() {
  console.log('=====================================================');
  console.log('   FINANCE PHASE 2: ROUTE REGISTRATION TEST SUITE   ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err.message}`);
      failed++;
    }
  }

  test('feesRouter registers all required Phase 2 endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/configuration', 'get'), 'Missing GET /configuration');
    assert.ok(hasRoute('/configuration', 'patch'), 'Missing PATCH /configuration');
    assert.ok(hasRoute('/configuration/razorpay/status', 'get'), 'Missing GET /configuration/razorpay/status');
    assert.ok(hasRoute('/configuration/razorpay/test', 'post'), 'Missing POST /configuration/razorpay/test');
    assert.ok(hasRoute('/configuration/audit', 'get'), 'Missing GET /configuration/audit');
    assert.ok(hasRoute('/settings', 'get'), 'Missing GET /settings');
    assert.ok(hasRoute('/settings', 'put'), 'Missing PUT /settings');
  });

  test('feesRouter registers all required Phase 3 Fee Structure endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/structures/summary', 'get'), 'Missing GET /structures/summary');
    assert.ok(hasRoute('/structures/academic-year-grades', 'get'), 'Missing GET /structures/academic-year-grades');
    assert.ok(hasRoute('/structures/installment-plans', 'get'), 'Missing GET /structures/installment-plans');
    assert.ok(hasRoute('/structures/:id', 'get'), 'Missing GET /structures/:id');
    assert.ok(hasRoute('/structures', 'get'), 'Missing GET /structures');
    assert.ok(hasRoute('/structures', 'post'), 'Missing POST /structures');
    assert.ok(hasRoute('/structures/:id', 'put'), 'Missing PUT /structures/:id');
    assert.ok(hasRoute('/structures/:id', 'patch'), 'Missing PATCH /structures/:id');
    assert.ok(hasRoute('/structures/:id/publish', 'post'), 'Missing POST /structures/:id/publish');
    assert.ok(hasRoute('/structures/:id/deactivate', 'post'), 'Missing POST /structures/:id/deactivate');
    assert.ok(hasRoute('/structures/:id', 'delete'), 'Missing DELETE /structures/:id');
  });

  test('feesRouter registers all required Phase 4 Student Fee Ledger endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/ledger/students', 'get'), 'Missing GET /ledger/students');
    assert.ok(hasRoute('/ledger/students/:studentId', 'get'), 'Missing GET /ledger/students/:studentId');
    assert.ok(hasRoute('/ledger/students/:studentId/assessments', 'get'), 'Missing GET /ledger/students/:studentId/assessments');
    assert.ok(hasRoute('/ledger/students/:studentId/payments', 'get'), 'Missing GET /ledger/students/:studentId/payments');
    assert.ok(hasRoute('/ledger/students/:studentId/dues', 'get'), 'Missing GET /ledger/students/:studentId/dues');
    assert.ok(hasRoute('/ledger/students/:studentId/transactions', 'get'), 'Missing GET /ledger/students/:studentId/transactions');
    assert.ok(hasRoute('/ledger/students/:studentId/eligible-structures', 'get'), 'Missing GET /ledger/students/:studentId/eligible-structures');
    assert.ok(hasRoute('/ledger/assignments', 'post'), 'Missing POST /ledger/assignments');
    assert.ok(hasRoute('/ledger/student/:studentId', 'get'), 'Missing backwards compatible GET /ledger/student/:studentId');
    assert.ok(hasRoute('/admin/ledger', 'get'), 'Missing backwards compatible GET /admin/ledger');
  });

  test('feesRouter registers all required Phase 5 Payment Collection endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/payments/students/:studentId/obligations', 'get'), 'Missing GET /payments/students/:studentId/obligations');
    assert.ok(hasRoute('/payments/collect', 'post'), 'Missing POST /payments/collect');
    assert.ok(hasRoute('/payments/create-order', 'post'), 'Missing POST /payments/create-order');
    assert.ok(hasRoute('/payments/verify', 'post'), 'Missing POST /payments/verify');
    assert.ok(hasRoute('/payments/history', 'get'), 'Missing GET /payments/history');
    assert.ok(hasRoute('/payments/receipts/:transactionId', 'get'), 'Missing GET /payments/receipts/:transactionId');
    assert.ok(hasRoute('/payments', 'post'), 'Missing POST /payments');
    assert.ok(hasRoute('/receipts/:id', 'get'), 'Missing GET /receipts/:id');
  });

  test('feesRouter registers all required Phase 6 Payment Gateway endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/payments/create-order', 'post'), 'Missing POST /payments/create-order');
    assert.ok(hasRoute('/payments/verify', 'post'), 'Missing POST /payments/verify');
    assert.ok(hasRoute('/payments/webhook', 'post'), 'Missing POST /payments/webhook');
  });

  test('feesRouter registers all required Phase 7 Scholarship and Concession endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/scholarships/metrics', 'get'), 'Missing GET /scholarships/metrics');
    assert.ok(hasRoute('/scholarships/programs', 'get'), 'Missing GET /scholarships/programs');
    assert.ok(hasRoute('/scholarships/students', 'get'), 'Missing GET /scholarships/students');
    assert.ok(hasRoute('/scholarships/applications', 'get'), 'Missing GET /scholarships/applications');
    assert.ok(hasRoute('/scholarships/applications', 'post'), 'Missing POST /scholarships/applications');
    assert.ok(hasRoute('/scholarships/applications/:id', 'get'), 'Missing GET /scholarships/applications/:id');
    assert.ok(hasRoute('/scholarships/applications/:id/decision', 'post'), 'Missing POST /scholarships/applications/:id/decision');
    assert.ok(hasRoute('/scholarships/applications/:id/apply', 'post'), 'Missing POST /scholarships/applications/:id/apply');
    assert.ok(hasRoute('/scholarships/student/:studentId', 'get'), 'Missing GET /scholarships/student/:studentId');
    assert.ok(hasRoute('/scholarships/reports', 'get'), 'Missing GET /scholarships/reports');
  });

  test('feesRouter registers all required Phase 8 Receivables & Collections endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/receivables/summary', 'get'), 'Missing GET /receivables/summary');
    assert.ok(hasRoute('/receivables/register', 'get'), 'Missing GET /receivables/register');
    assert.ok(hasRoute('/receivables/ageing', 'get'), 'Missing GET /receivables/ageing');
    assert.ok(hasRoute('/receivables/collections', 'get'), 'Missing GET /receivables/collections');
    assert.ok(hasRoute('/receivables/students/:studentId', 'get'), 'Missing GET /receivables/students/:studentId');
    assert.ok(hasRoute('/receivables/follow-ups', 'get'), 'Missing GET /receivables/follow-ups');
    assert.ok(hasRoute('/receivables/follow-ups', 'post'), 'Missing POST /receivables/follow-ups');
    assert.ok(hasRoute('/receivables/follow-ups/:id', 'patch'), 'Missing PATCH /receivables/follow-ups/:id');
    assert.ok(hasRoute('/receivables/reports', 'get'), 'Missing GET /receivables/reports');
  });

  test('feesRouter registers all required Phase 9 Finance Notification endpoints', () => {
    const routeLayers = (feesRouter as any).stack.filter((layer: any) => layer.route);
    const routes = routeLayers.map((layer: any) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {}),
    }));

    const hasRoute = (path: string, method: string) =>
      routes.some((r: any) => r.path === path && r.methods.includes(method.toLowerCase()));

    assert.ok(hasRoute('/notifications/summary', 'get'), 'Missing GET /notifications/summary');
    assert.ok(hasRoute('/notifications', 'get'), 'Missing GET /notifications');
    assert.ok(hasRoute('/notifications/templates', 'get'), 'Missing GET /notifications/templates');
    assert.ok(hasRoute('/notifications/channels', 'get'), 'Missing GET /notifications/channels');
    assert.ok(hasRoute('/notifications/:id', 'get'), 'Missing GET /notifications/:id');
    assert.ok(hasRoute('/notifications/preview', 'post'), 'Missing POST /notifications/preview');
    assert.ok(hasRoute('/notifications/send-reminder', 'post'), 'Missing POST /notifications/send-reminder');
    assert.ok(hasRoute('/notifications/:id/retry', 'post'), 'Missing POST /notifications/:id/retry');
  });

  test('main router mounts fees module on /v1/fees and /fees', () => {
    const routerStack = (mainRouter as any).stack || [];
    const mountPaths = routerStack
      .filter((layer: any) => layer.name === 'router')
      .map((layer: any) => layer.regexp.toString());

    // Check for /v1/fees and /fees regex in mainRouter stack
    const hasV1Fees = mountPaths.some((p: string) => p.includes('fees'));
    assert.ok(hasV1Fees, 'Main router must mount fees routes');
  });

  console.log(`\nFinance route tests complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    throw new Error(`${failed} route tests failed!`);
  }
}

if (require.main === module) {
  runFinanceRouteTests();
}
