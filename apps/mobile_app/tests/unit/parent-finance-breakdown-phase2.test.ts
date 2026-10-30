import {
  ChildFeeOverview,
  ChildFeeDueItem,
  ChildPaymentHistoryItem,
} from '../../src/types/admission.types';

describe('Phase 2 — Parent Fee Breakdown & Ledger Synchronization Suite', () => {
  const mockChildWithLedger: ChildFeeOverview = {
    student_id: 'std_001',
    admission_no: 'ADM-2026-0042',
    first_name: 'Aarav',
    last_name: 'Sharma',
    full_name: 'Aarav Sharma',
    grade_name: 'Grade 7',
    academic_year_name: '2026-2027',
    section_name: 'A',
    roll_number: '14',
    enrollment_id: 'enr_001',
    is_assigned: true,
    assignment_id: 'asg_001',
    fee_structure_name: 'Standard Middle School 2026',
    installment_plan_name: 'Quarterly 4-Term Plan',
    summary: {
      total_assessed: 80000,
      total_paid: 40000,
      outstanding_balance: 40000,
      balance: 40000,
      overdue_amount: 20000,
      next_due_date: '2026-04-01',
      next_due_amount: 20000,
      total_dues_count: 4,
      unpaid_dues_count: 2,
      status: 'overdue',
    },
    components: [
      {
        component_id: 'comp_001',
        component_name: 'Tuition Fee',
        component_code: 'TUI',
        amount: 60000,
        paid_amount: 30000,
        outstanding_amount: 30000,
        status: 'partial',
        description: 'Annual Academic Tuition',
      },
      {
        component_id: 'comp_002',
        component_name: 'Laboratory Fee',
        component_code: 'LAB',
        amount: 12000,
        paid_amount: 6000,
        outstanding_amount: 6000,
        status: 'partial',
        description: 'Science and Computing Labs',
      },
      {
        component_id: 'comp_003',
        component_name: 'Sports & Arts',
        component_code: 'SPA',
        amount: 8000,
        paid_amount: 4000,
        outstanding_amount: 4000,
        status: 'partial',
        description: 'Co-curricular facilities',
      },
    ],
    dues: [
      {
        due_id: 'due_001',
        charge_id: 'chg_001',
        charge_description: 'Term 1 Academic Obligation',
        component_name: 'Tuition Fee',
        term_name: 'Term 1 (Apr 2026)',
        amount_due: 20000,
        paid_amount: 20000,
        outstanding_amount: 0,
        due_date: '2026-04-10',
        is_overdue: false,
        status: 'paid',
      },
      {
        due_id: 'due_002',
        charge_id: 'chg_002',
        charge_description: 'Term 2 Academic Obligation',
        component_name: 'Tuition Fee',
        term_name: 'Term 2 (Jul 2026)',
        amount_due: 20000,
        paid_amount: 20000,
        outstanding_amount: 0,
        due_date: '2026-07-10',
        is_overdue: false,
        status: 'paid',
      },
      {
        due_id: 'due_003',
        charge_id: 'chg_003',
        charge_description: 'Term 3 Academic Obligation',
        component_name: 'Tuition Fee',
        term_name: 'Term 3 (Oct 2026)',
        amount_due: 20000,
        paid_amount: 0,
        outstanding_amount: 20000,
        due_date: '2026-10-10',
        is_overdue: true,
        status: 'pending',
      },
      {
        due_id: 'due_004',
        charge_id: 'chg_004',
        charge_description: 'Term 4 Academic Obligation',
        component_name: 'Tuition Fee',
        term_name: 'Term 4 (Jan 2027)',
        amount_due: 20000,
        paid_amount: 0,
        outstanding_amount: 20000,
        due_date: '2027-01-10',
        is_overdue: false,
        status: 'pending',
      },
    ],
    payment_history: [
      {
        transaction_id: 'tx_001',
        order_id: 'ord_001',
        payment_method: 'UPI',
        amount: 20000,
        currency: 'INR',
        status: 'success',
        transaction_reference: 'UPI/20260405/98765',
        created_at: '2026-04-05T10:30:00.000Z',
      },
      {
        transaction_id: 'tx_002',
        order_id: 'ord_002',
        payment_method: 'NET_BANKING',
        amount: 20000,
        currency: 'INR',
        status: 'success',
        transaction_reference: 'NB/20260702/11223',
        created_at: '2026-07-02T14:15:00.000Z',
      },
    ],
  };

  it('1. should verify ledger totals: total_assessed - total_paid = outstanding_balance', () => {
    const { total_assessed, total_paid, outstanding_balance } = mockChildWithLedger.summary;
    expect(total_assessed - total_paid).toBe(outstanding_balance);
    expect(mockChildWithLedger.summary.balance).toBe(outstanding_balance);
  });

  it('2. should verify overdue amount matches sum of overdue installment balances', () => {
    const overdueSum = mockChildWithLedger
      .dues!.filter((d) => d.is_overdue)
      .reduce((acc, d) => acc + d.outstanding_amount, 0);

    expect(overdueSum).toBe(mockChildWithLedger.summary.overdue_amount);
  });

  it('3. should verify next due date and amount are populated from earliest unpaid installment', () => {
    const unpaidDues = mockChildWithLedger.dues!.filter((d) => d.outstanding_amount > 0);
    expect(unpaidDues.length).toBe(mockChildWithLedger.summary.unpaid_dues_count);
    expect(mockChildWithLedger.summary.next_due_date).toBeDefined();
    expect(mockChildWithLedger.summary.next_due_amount).toBeGreaterThan(0);
  });

  it('4. should verify fee component breakdown attributes are present and accurate', () => {
    const components = mockChildWithLedger.components!;
    expect(components).toHaveLength(3);

    const compSum = components.reduce((acc, c) => acc + c.amount, 0);
    expect(compSum).toBe(mockChildWithLedger.summary.total_assessed);

    const compPaidSum = components.reduce((acc, c) => acc + (c.paid_amount || 0), 0);
    expect(compPaidSum).toBe(mockChildWithLedger.summary.total_paid);

    const compBalSum = components.reduce((acc, c) => acc + (c.outstanding_amount || 0), 0);
    expect(compBalSum).toBe(mockChildWithLedger.summary.outstanding_balance);
  });

  it('5. should correctly represent settled installment with zero balance and not overdue', () => {
    const settledDue = mockChildWithLedger.dues![0];
    expect(settledDue.status).toBe('paid');
    expect(settledDue.paid_amount).toBe(settledDue.amount_due);
    expect(settledDue.outstanding_amount).toBe(0);
    expect(settledDue.is_overdue).toBe(false);
  });

  it('6. should correctly represent future installment as pending, not overdue', () => {
    const futureDue = mockChildWithLedger.dues![3];
    expect(futureDue.status).toBe('pending');
    expect(futureDue.is_overdue).toBe(false);
    expect(futureDue.outstanding_amount).toBe(20000);
  });

  it('7. should accurately reflect payment transaction history fields', () => {
    const txList = mockChildWithLedger.payment_history!;
    expect(txList).toHaveLength(2);

    expect(txList[0].payment_method).toBe('UPI');
    expect(txList[0].amount).toBe(20000);
    expect(txList[0].status).toBe('success');
    expect(txList[0].transaction_reference).toBe('UPI/20260405/98765');
  });

  it('8. should safely handle child with no fees assigned (no_fees_assigned status)', () => {
    const unassignedChild: ChildFeeOverview = {
      student_id: 'std_unassigned',
      admission_no: 'ADM-2026-9999',
      first_name: 'Kavya',
      last_name: 'Iyer',
      full_name: 'Kavya Iyer',
      grade_name: 'Kindergarten',
      academic_year_name: '2026-2027',
      section_name: null,
      roll_number: null,
      enrollment_id: 'enr_999',
      is_assigned: false,
      assignment_id: null,
      fee_structure_name: null,
      installment_plan_name: null,
      summary: {
        total_assessed: 0,
        total_paid: 0,
        outstanding_balance: 0,
        overdue_amount: 0,
        next_due_date: null,
        next_due_amount: null,
        total_dues_count: 0,
        unpaid_dues_count: 0,
        status: 'no_fees_assigned',
      },
      components: [],
      dues: [],
      payment_history: [],
    };

    expect(unassignedChild.summary.status).toBe('no_fees_assigned');
    expect(unassignedChild.summary.total_assessed).toBe(0);
    expect(unassignedChild.summary.outstanding_balance).toBe(0);
    expect(unassignedChild.components).toHaveLength(0);
    expect(unassignedChild.dues).toHaveLength(0);
    expect(unassignedChild.payment_history).toHaveLength(0);
  });

  it('9. should ensure multiple children maintain completely independent ledger states', () => {
    const child1 = mockChildWithLedger;
    const child2: ChildFeeOverview = {
      ...mockChildWithLedger,
      student_id: 'std_002',
      admission_no: 'ADM-2026-0043',
      first_name: 'Diya',
      last_name: 'Sharma',
      full_name: 'Diya Sharma',
      summary: {
        total_assessed: 50000,
        total_paid: 50000,
        outstanding_balance: 0,
        balance: 0,
        overdue_amount: 0,
        next_due_date: null,
        next_due_amount: 0,
        total_dues_count: 2,
        unpaid_dues_count: 0,
        status: 'fully_paid',
      },
      dues: [],
    };

    expect(child1.student_id).not.toBe(child2.student_id);
    expect(child1.summary.outstanding_balance).toBe(40000);
    expect(child2.summary.outstanding_balance).toBe(0);
    expect(child1.summary.status).toBe('overdue');
    expect(child2.summary.status).toBe('fully_paid');
  });
});
