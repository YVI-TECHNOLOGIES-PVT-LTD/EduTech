import { checkPermission, getEffectiveRoles } from '../../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../../rbac/permissions';
import { SessionService } from '../../../auth/session.service';

interface MockResponse {
  statusCode: number;
  data: any;
  status(code: number): MockResponse;
  json(payload: any): MockResponse;
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

function createMockRequest(
  roles: string[] = [],
  permissions: string[] = [],
  email: string = 'test@school.com',
) {
  return {
    context: {
      user: {
        id: 'user-uuid-1',
        email,
        roles,
        permissions,
        org_id: 'org-uuid-1',
      },
    },
  } as any;
}

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
    failedCount++;
  }
}

async function runRoleSeparationTests() {
  console.log('\n=====================================================');
  console.log('   FINANCE & FRONT OFFICE ROLE SEPARATION TESTS');
  console.log('=====================================================\n');

  // Test 1: normalizeRoleName maps Finance and Front Office roles properly
  assert(
    SessionService.normalizeRoleName('finance') === 'FINANCE_OFFICER',
    'SessionService maps "finance" to "FINANCE_OFFICER"',
  );
  assert(
    SessionService.normalizeRoleName('Finance Manager') === 'FINANCE_MANAGER',
    'SessionService maps "Finance Manager" to "FINANCE_MANAGER"',
  );
  assert(
    SessionService.normalizeRoleName('accountant') === 'ACCOUNTANT',
    'SessionService maps "accountant" to "ACCOUNTANT"',
  );
  assert(
    SessionService.normalizeRoleName('front_office') === 'FRONT_OFFICE',
    'SessionService maps "front_office" to "FRONT_OFFICE"',
  );

  // Test 2: Front Office role cannot manage fee structures (POST/PUT /fees/structures)
  {
    const req = createMockRequest(['FRONT_OFFICE'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_SETUP); // 'fees.structure.manage'
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(
      !nextCalled && res.statusCode === 403,
      'FRONT_OFFICE is rejected with 403 from fees.structure.manage (cannot create/edit structures)',
    );
  }

  // Test 3: Front Office role cannot assign ERP fees or generate demands (FEES_ASSIGN)
  {
    const req = createMockRequest(['FRONT_OFFICE'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_ASSIGN); // 'fees.demand.generate'
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(
      !nextCalled && res.statusCode === 403,
      'FRONT_OFFICE is rejected with 403 from fees.demand.generate (cannot assign fees to students)',
    );
  }

  // Test 4: Front Office CAN collect pre-admission fees (fees.payment.collect)
  {
    const req = createMockRequest(['FRONT_OFFICE'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.PAYMENT_RECORD); // 'fees.payment.collect'
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(
      nextCalled,
      'FRONT_OFFICE is permitted to execute fees.payment.collect (admission fee collections)',
    );
  }

  // Test 5: FINANCE_OFFICER can manage fee structures
  {
    const req = createMockRequest(['FINANCE_OFFICER'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_SETUP);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(nextCalled, 'FINANCE_OFFICER is permitted to execute fees.structure.manage');
  }

  // Test 6: FINANCE_OFFICER can assign fees
  {
    const req = createMockRequest(['FINANCE_OFFICER'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_ASSIGN);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(nextCalled, 'FINANCE_OFFICER is permitted to execute fees.demand.generate');
  }

  // Test 7: ACCOUNTANT can assign fees and view ledgers
  {
    const req = createMockRequest(['ACCOUNTANT'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_ASSIGN);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(nextCalled, 'ACCOUNTANT is permitted to execute fees.demand.generate');
  }

  // Test 8: ACCOUNTANT cannot create/manage fee structures without explicit permission
  {
    const req = createMockRequest(['ACCOUNTANT'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_SETUP);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(
      !nextCalled && res.statusCode === 403,
      'ACCOUNTANT is restricted from fees.structure.manage without explicit permission (role segregation)',
    );
  }

  // Test 9: ADMIN has complete access to fee structure and assignment
  {
    const req = createMockRequest(['ADMIN'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_SETUP);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(nextCalled, 'ADMIN is permitted for fees.structure.manage');
  }

  // Test 10: PARENT role is rejected from fees.structure.manage and fees.demand.generate
  {
    const req = createMockRequest(['PARENT'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_SETUP);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(!nextCalled && res.statusCode === 403, 'PARENT is rejected from fees.structure.manage');
  }
  {
    const req = createMockRequest(['PARENT'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_ASSIGN);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(!nextCalled && res.statusCode === 403, 'PARENT is rejected from fees.demand.generate');
  }

  // Test 11: STUDENT role is rejected from fees.structure.manage and fees.demand.generate
  {
    const req = createMockRequest(['STUDENT'], []);
    const res = createMockResponse();
    let nextCalled = false;
    const middleware = checkPermission(PERMISSIONS.FEES_SETUP);
    middleware(req, res as any, () => {
      nextCalled = true;
    });
    assert(!nextCalled && res.statusCode === 403, 'STUDENT is rejected from fees.structure.manage');
  }

  console.log(
    `\nFinance Role Separation tests complete: ${passedCount} passed, ${failedCount} failed.\n`,
  );
  if (failedCount > 0) {
    process.exit(1);
  }
}

runRoleSeparationTests().catch((e) => {
  console.error('Test runner failure:', e);
  process.exit(1);
});
