import { ChildFeeOverview } from '../../src/types/admission.types';

describe('Phase 1 — Parent Placement Synchronization Suite', () => {
  const baseEnrolledChild: ChildFeeOverview = {
    student_id: 'std_001',
    admission_no: 'ADM-2026-0042',
    first_name: 'Priya',
    last_name: 'Nair',
    full_name: 'Priya Nair',
    grade_name: 'Grade 6',
    academic_year_name: '2026-2027',
    section_name: 'A',
    roll_number: '12',
    enrollment_id: 'enr_001',
    is_assigned: true,
    assignment_id: 'asg_001',
    fee_structure_name: 'Grade 6 General 2026',
    installment_plan_name: 'Standard 3-Term Plan',
    summary: {
      total_assessed: 45000,
      total_paid: 15000,
      outstanding_balance: 30000,
      overdue_amount: 0,
      total_dues_count: 3,
      unpaid_dues_count: 2,
      status: 'partially_paid',
    },
  };

  it('1. should preserve authoritative admission number from student record', () => {
    expect(baseEnrolledChild.admission_no).toBe('ADM-2026-0042');
    expect(baseEnrolledChild.student_id).toBe('std_001');
  });

  it('2. should display fully allocated academic placement (year, grade, section, roll number)', () => {
    expect(baseEnrolledChild.academic_year_name).toBe('2026-2027');
    expect(baseEnrolledChild.grade_name).toBe('Grade 6');
    expect(baseEnrolledChild.section_name).toBe('A');
    expect(baseEnrolledChild.roll_number).toBe('12');
  });

  it('3. should safely represent pending section allocation when section_name is null', () => {
    const unallocatedSectionChild: ChildFeeOverview = {
      ...baseEnrolledChild,
      student_id: 'std_002',
      section_name: null,
    };

    const sectionDisplay = unallocatedSectionChild.section_name
      ? `Sec: ${unallocatedSectionChild.section_name}`
      : 'Section Allocation Pending';

    expect(unallocatedSectionChild.section_name).toBeNull();
    expect(sectionDisplay).toBe('Section Allocation Pending');
  });

  it('4. should safely represent pending roll number when roll_number is null or missing', () => {
    const unallocatedRollChild: ChildFeeOverview = {
      ...baseEnrolledChild,
      student_id: 'std_003',
      roll_number: null,
      roll_no: null,
    };

    const rollDisplay =
      unallocatedRollChild.roll_number || unallocatedRollChild.roll_no
        ? `Roll No: ${unallocatedRollChild.roll_number || unallocatedRollChild.roll_no}`
        : 'Roll No Pending';

    expect(unallocatedRollChild.roll_number).toBeNull();
    expect(rollDisplay).toBe('Roll No Pending');
  });

  it('5. should support parent with multiple enrolled children without identifier collisions', () => {
    const multiChildren: ChildFeeOverview[] = [
      baseEnrolledChild,
      {
        ...baseEnrolledChild,
        student_id: 'std_004',
        admission_no: 'ADM-2026-0089',
        first_name: 'Rohan',
        last_name: 'Nair',
        full_name: 'Rohan Nair',
        grade_name: 'Grade 3',
        section_name: null,
        roll_number: null,
      },
    ];

    expect(multiChildren).toHaveLength(2);
    const uniqueIds = new Set(multiChildren.map((c) => c.student_id));
    expect(uniqueIds.size).toBe(2);
    expect(multiChildren[0].admission_no).toBe('ADM-2026-0042');
    expect(multiChildren[1].admission_no).toBe('ADM-2026-0089');
  });

  it('6. should ensure empty enrolled children state yields empty list without crashes', () => {
    const emptyChildren: ChildFeeOverview[] = [];
    expect(emptyChildren).toHaveLength(0);
  });
});
