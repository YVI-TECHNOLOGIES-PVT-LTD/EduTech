import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { toSafeUuid, UUID_REGEX } from './FeeStructureManagerService';
import { FinanceNotificationService } from './FinanceNotificationService';
import { FinanceEventType } from '../events/finance.events';
import { logger } from '../../../utils/logger';

export interface StudentSearchFilter {
  query?: string;
  academicYearId?: string;
  gradeId?: string;
  page?: number;
  limit?: number;
}

export interface AssignFeeStructurePayload {
  studentId: string;
  enrollmentId?: string;
  feeStructureId: string;
  installmentPlanId?: string;
  notes?: string;
}

export class StudentLedgerService {
  /**
   * Decimal-safe rounding to 2 decimal places
   */
  public static roundMoney(val: number | string | Prisma.Decimal | null | undefined): number {
    if (val === null || val === undefined) return 0;
    const num = typeof val === 'number' ? val : Number(val.toString());
    if (isNaN(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Search students within tenant organization for ledger management.
   * Cross-tenant enumeration is strictly prevented by scoping to org_id.
   */
  public static async searchStudents(orgId: string, filter: StudentSearchFilter = {}) {
    if (!orgId) {
      throw new Error('Tenant organization ID is required');
    }
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const safeYearId = toSafeUuid(filter.academicYearId);
    const safeGradeId = toSafeUuid(filter.gradeId);

    // Build Prisma query condition scoped strictly to org_id
    const whereCondition: Prisma.studentsWhereInput = {
      org_id: safeOrgId,
    };

    if (filter.query && filter.query.trim().length > 0) {
      const q = filter.query.trim();
      whereCondition.OR = [
        { admission_no: { contains: q, mode: 'insensitive' } },
        { first_name: { contains: q, mode: 'insensitive' } },
        { last_name: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (safeYearId || safeGradeId) {
      whereCondition.student_enrollments = {
        some: {
          academic_year_grades: {
            ...(safeYearId ? { academic_year_id: safeYearId } : {}),
            ...(safeGradeId ? { grade_id: safeGradeId } : {}),
          },
        },
      };
    }

    const [total, students] = await Promise.all([
      prisma.students.count({ where: whereCondition }),
      prisma.students.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
        include: {
          student_enrollments: {
            where: {
              status: 'active',
            },
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              academic_year_grades: {
                include: {
                  academic_years: true,
                  grades: true,
                },
              },
              sections: true,
            },
          },
        },
      }),
    ]);

    const formattedStudents = students.map((s: any) => {
      const activeEnrollment = s.student_enrollments[0] || null;
      const ayg = activeEnrollment?.academic_year_grades || null;
      const activeAssignment = activeEnrollment?.student_fee_assignments?.[0] || null;

      return {
        student_id: s.student_id,
        admission_no: s.admission_no,
        first_name: s.first_name,
        last_name: s.last_name || '',
        full_name: `${s.first_name} ${s.last_name || ''}`.trim(),
        dob: s.dob ? s.dob.toISOString().split('T')[0] : null,
        gender: s.gender,
        status: s.status,
        enrollment: activeEnrollment
          ? {
              enrollment_id: activeEnrollment.enrollment_id,
              roll_number: activeEnrollment.roll_number,
              status: activeEnrollment.status,
              academic_year_id: ayg?.academic_year_id || null,
              academic_year_name: ayg?.academic_years.academic_year_name || 'N/A',
              grade_id: ayg?.grade_id || null,
              grade_name: ayg?.grades.grade_name || 'N/A',
              section_id: activeEnrollment.section_id,
              section_name: activeEnrollment.sections?.section_name || null,
            }
          : null,
        assignment: activeAssignment
          ? {
              assignment_id: activeAssignment.student_fee_assignment_id,
              fee_structure_id: activeAssignment.fee_structure_id,
              fee_structure_name: activeAssignment.fee_structures.name,
              installment_plan_id: activeAssignment.installment_plan_id,
              installment_plan_name: activeAssignment.installment_plans.plan_name,
              assigned_at: activeAssignment.assigned_at,
              status: activeAssignment.status,
            }
          : null,
      };
    });

    return {
      students: formattedStudents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve authoritative, tenant-scoped ledger summary for a single student.
   * Calculations use strictly persisted relationships without fabrication.
   */
  public static async getStudentLedgerSummary(
    orgId: string,
    studentId: string,
    academicYearId?: string,
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    if (!studentId) throw new Error('Student ID is required');

    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier format');
      err.statusCode = 400;
      throw err;
    }

    const safeYearId = toSafeUuid(academicYearId);

    // 1. Fetch student strictly scoped to tenant org
    const student: any = await prisma.students.findFirst({
      where: {
        student_id: safeStudentId,
        org_id: safeOrgId,
      },
      include: {
        student_enrollments: {
          orderBy: { created_at: 'desc' },
          include: {
            academic_year_grades: {
              include: {
                academic_years: true,
                grades: true,
              },
            },
            sections: true,
          },
        },
      },
    });

    if (!student) {
      const err: any = new Error('Student not found within the authorized tenant organization');
      err.statusCode = 404;
      throw err;
    }

    // Determine target enrollment
    let enrollment = student.student_enrollments.find((e: any) => e.status === 'active');
    if (safeYearId && enrollment) {
      const matched = student.student_enrollments.find(
        (e: any) => e.academic_year_grades.academic_year_id === safeYearId,
      );
      if (matched) enrollment = matched;
    }
    if (!enrollment && student.student_enrollments.length > 0) {
      enrollment = student.student_enrollments[0];
    }

    const ayg = enrollment?.academic_year_grades || null;
    const assignment = enrollment?.student_fee_assignments?.[0] || null;

    // Calculate Assigned Structure Amount (Annual scheduled baseline)
    let assignedStructureAmount = 0;
    if (assignment?.fee_structures?.fee_components) {
      for (const comp of assignment.fee_structures.fee_components) {
        assignedStructureAmount = this.roundMoney(
          assignedStructureAmount + Number(comp.amount.toString()),
        );
      }
    }

    // 2. Query Persisted Billed Charges (student_charges)
    const charges = await prisma.student_charges.findMany({
      where: {
        student_id: safeStudentId,
        status: { in: ['active', 'waived'] },
      },
      include: {
        fee_components: true,
        student_charge_dues: {
          include: {
            installment_plan_terms: true,
            payment_allocations: {
              include: {
                payment_transactions: true,
              },
            },
          },
        },
      },
      orderBy: { charge_date: 'asc' },
    });

    // 3. Query Payment Orders & Transactions for student
    const paymentOrders = await prisma.payment_orders.findMany({
      where: {
        student_id: safeStudentId,
      },
      include: {
        payment_transactions: {
          include: {
            payment_allocations: true,
          },
        },
      },
    });

    // 4. Query Scholarship Concessions
    const concessions = await prisma.scholarship_concessions.findMany({
      where: {
        student_id: safeStudentId,
        ...(ayg ? { academic_year_id: ayg.academic_year_id } : {}),
      },
      include: {
        installment_plan_terms: true,
      },
    });

    // 5. Centralized Financial Calculations using Decimal rounding
    let totalAssessedAmount = 0;
    let totalWaivedChargesAmount = 0;
    let totalDueAmount = 0;
    let totalOverdueAmount = 0;
    let totalAllocatedPaymentAmount = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    for (const charge of charges) {
      const chargeAmt = Number(charge.amount.toString());
      if (charge.status === 'active') {
        totalAssessedAmount = this.roundMoney(totalAssessedAmount + chargeAmt);

        for (const due of charge.student_charge_dues) {
          if (due.status === 'cancelled') continue;

          const dueAmt = Number(due.amount_due.toString());
          totalDueAmount = this.roundMoney(totalDueAmount + dueAmt);

          // Calculate allocations strictly from successful transactions
          let dueAllocated = 0;
          for (const alloc of due.payment_allocations) {
            if (alloc.payment_transactions.status === 'success') {
              dueAllocated = this.roundMoney(
                dueAllocated + Number(alloc.allocated_amount.toString()),
              );
            }
          }

          totalAllocatedPaymentAmount = this.roundMoney(totalAllocatedPaymentAmount + dueAllocated);

          const outstandingForDue = Math.max(0, this.roundMoney(dueAmt - dueAllocated));
          const dueDateStr = due.due_date.toISOString().split('T')[0];

          // Overdue calculation rule: past due date + positive balance + not paid/cancelled
          if (
            dueDateStr < todayStr &&
            outstandingForDue > 0 &&
            due.status !== 'paid' &&
            due.status !== 'waived'
          ) {
            totalOverdueAmount = this.roundMoney(totalOverdueAmount + outstandingForDue);
          }
        }
      } else if (charge.status === 'waived') {
        totalWaivedChargesAmount = this.roundMoney(totalWaivedChargesAmount + chargeAmt);
      }
    }

    // Calculate total transactions & unallocated payments
    let totalSuccessfulTransactionsAmount = 0;
    for (const order of paymentOrders) {
      for (const tx of order.payment_transactions) {
        if (tx.status === 'success') {
          totalSuccessfulTransactionsAmount = this.roundMoney(
            totalSuccessfulTransactionsAmount + Number(tx.amount.toString()),
          );
        }
      }
    }

    const unallocatedPaymentsAmount = Math.max(
      0,
      this.roundMoney(totalSuccessfulTransactionsAmount - totalAllocatedPaymentAmount),
    );

    // Concession summary
    let approvedConcessionsCount = 0;
    let totalApprovedConcessionPct = 0;
    for (const conc of concessions) {
      if (conc.status === 'approved' || conc.status === 'applied') {
        approvedConcessionsCount++;
        const pct =
          conc.approved_percentage || conc.applied_percentage || conc.concession_percentage;
        totalApprovedConcessionPct += Number(pct.toString());
      }
    }

    // Outstanding Balance Rule:
    // If assessed charges exist, outstanding = assessed charges - valid allocated payments
    // If no assessed charges exist, but assignment exists: unbilled
    const hasAssessedCharges = charges.filter((c: any) => c.status === 'active').length > 0;
    const outstandingBalance = hasAssessedCharges
      ? Math.max(0, this.roundMoney(totalAssessedAmount - totalAllocatedPaymentAmount))
      : 0;

    const reliabilityNotes: string[] = [];
    if (!hasAssessedCharges && assignment) {
      reliabilityNotes.push(
        'Student has an assigned fee structure, but individual payable charges/demands have not yet been posted to the ledger.',
      );
    }
    if (!assignment) {
      reliabilityNotes.push(
        'Student has not yet been assigned a fee structure for the current academic enrollment.',
      );
    }
    if (unallocatedPaymentsAmount > 0) {
      reliabilityNotes.push(
        `There is INR ${unallocatedPaymentsAmount.toFixed(2)} in successful payments recorded that are not yet allocated to specific fee obligations.`,
      );
    }

    return {
      student: {
        student_id: student.student_id,
        admission_no: student.admission_no,
        first_name: student.first_name,
        last_name: student.last_name || '',
        full_name: `${student.first_name} ${student.last_name || ''}`.trim(),
        dob: student.dob ? student.dob.toISOString().split('T')[0] : null,
        gender: student.gender,
        status: student.status,
        enrollment: enrollment
          ? {
              enrollment_id: enrollment.enrollment_id,
              roll_number: enrollment.roll_number,
              status: enrollment.status,
              academic_year_id: ayg?.academic_year_id || null,
              academic_year_name: ayg?.academic_years.academic_year_name || 'N/A',
              grade_id: ayg?.grade_id || null,
              grade_name: ayg?.grades.grade_name || 'N/A',
              section_id: enrollment.section_id,
              section_name: enrollment.sections?.section_name || null,
            }
          : null,
      },
      summary: {
        currency: 'INR',
        total_assigned_structure_amount: assignedStructureAmount,
        total_assessed_amount: totalAssessedAmount,
        total_paid_amount: totalAllocatedPaymentAmount,
        total_transactions_amount: totalSuccessfulTransactionsAmount,
        unallocated_payments_amount: unallocatedPaymentsAmount,
        outstanding_balance: outstandingBalance,
        overdue_balance: totalOverdueAmount,
        waived_charges_amount: totalWaivedChargesAmount,
        concessions_count: approvedConcessionsCount,
        has_assessed_charges: hasAssessedCharges,
        has_assigned_structure: !!assignment,
        reliability_notes: reliabilityNotes,
      },
    };
  }

  /**
   * Retrieve detailed fee assessments and fee structures for a student.
   */
  public static async getStudentAssessments(orgId: string, studentId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    // Verify student belongs to tenant
    const student: any = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
      include: {
        student_enrollments: {
          where: { status: 'active' },
          include: {
            academic_year_grades: {
              include: { academic_years: true, grades: true },
            },
          },
        },
      },
    });

    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    const charges = await prisma.student_charges.findMany({
      where: { student_id: safeStudentId },
      include: {
        fee_components: true,
        student_charge_dues: {
          include: {
            installment_plan_terms: true,
            payment_allocations: {
              include: { payment_transactions: true },
            },
          },
          orderBy: { due_date: 'asc' },
        },
      },
      orderBy: { charge_date: 'asc' },
    });

    const activeEnrollment = student.student_enrollments[0] || null;
    const assignment = activeEnrollment?.student_fee_assignments?.[0] || null;

    const formattedCharges = charges.map((c: any) => {
      let paidOnCharge = 0;
      const dues = c.student_charge_dues.map((d: any) => {
        let paidOnDue = 0;
        for (const alloc of d.payment_allocations) {
          if (alloc.payment_transactions.status === 'success') {
            paidOnDue = this.roundMoney(paidOnDue + Number(alloc.allocated_amount.toString()));
          }
        }
        paidOnCharge = this.roundMoney(paidOnCharge + paidOnDue);
        const amountDue = Number(d.amount_due.toString());
        const balance = Math.max(0, this.roundMoney(amountDue - paidOnDue));

        return {
          due_id: d.student_charge_due_id,
          installment_term: d.installment_plan_terms?.term_name || 'Ad-hoc',
          due_date: d.due_date.toISOString().split('T')[0],
          amount_due: amountDue,
          allocated_amount: paidOnDue,
          outstanding_amount: balance,
          status: d.status,
          is_overdue:
            d.due_date.toISOString().split('T')[0] < new Date().toISOString().split('T')[0] &&
            balance > 0,
        };
      });

      const chargeAmt = Number(c.amount.toString());
      return {
        charge_id: c.student_charge_id,
        description: c.description,
        source_type: c.source_type,
        amount: chargeAmt,
        paid_amount: paidOnCharge,
        balance_amount: Math.max(0, this.roundMoney(chargeAmt - paidOnCharge)),
        currency_code: c.currency_code,
        charge_date: c.charge_date.toISOString().split('T')[0],
        status: c.status,
        component_name: c.fee_components?.component_name || 'General Charge',
        component_code: c.fee_components?.component_code || null,
        dues,
      };
    });

    return {
      assigned_structure: assignment
        ? {
            assignment_id: assignment.student_fee_assignment_id,
            assigned_at: assignment.assigned_at,
            status: assignment.status,
            fee_structure: {
              fee_structure_id: assignment.fee_structures.fee_structure_id,
              name: assignment.fee_structures.name,
              status: assignment.fee_structures.status,
              total_amount: this.roundMoney(
                assignment.fee_structures.fee_components.reduce(
                  (sum: number, comp: any) => sum + Number(comp.amount.toString()),
                  0,
                ),
              ),
              components: assignment.fee_structures.fee_components.map((comp: any) => ({
                component_id: comp.fee_component_id,
                component_name: comp.component_name,
                component_code: comp.component_code,
                amount: Number(comp.amount.toString()),
                is_mandatory: comp.is_mandatory,
              })),
            },
            installment_plan: assignment.installment_plans
              ? {
                  plan_id: assignment.installment_plans.installment_plan_id,
                  plan_name: assignment.installment_plans.plan_name,
                  terms: assignment.installment_plans.installment_plan_terms.map((t: any) => ({
                    term_id: t.installment_term_id,
                    term_number: t.term_number,
                    term_name: t.term_name,
                    percentage: Number(t.percentage.toString()),
                    due_date: t.due_date.toISOString().split('T')[0],
                  })),
                }
              : null,
          }
        : null,
      charges: formattedCharges,
    };
  }

  /**
   * Retrieve payments, transaction records, and allocation breakdown for a student.
   */
  public static async getStudentPayments(orgId: string, studentId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    const student = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
    });
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    const paymentOrders = await prisma.payment_orders.findMany({
      where: { student_id: safeStudentId },
      include: {
        student_charge_dues: {
          include: {
            student_charges: {
              include: { fee_components: true },
            },
            installment_plan_terms: true,
          },
        },
        payment_transactions: {
          include: {
            payment_allocations: {
              include: {
                student_charge_dues: {
                  include: {
                    student_charges: true,
                    installment_plan_terms: true,
                  },
                },
              },
            },
            payment_refunds: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const transactions: any[] = [];
    let totalPaid = 0;
    let totalAllocated = 0;

    for (const order of paymentOrders) {
      for (const tx of order.payment_transactions) {
        const txAmount = Number(tx.amount.toString());
        let allocatedAmount = 0;

        const allocations = tx.payment_allocations.map((a: any) => {
          const allocAmt = Number(a.allocated_amount.toString());
          allocatedAmount = this.roundMoney(allocatedAmount + allocAmt);
          return {
            allocation_id: a.payment_allocation_id,
            allocated_amount: allocAmt,
            allocated_at: a.allocated_at,
            due_id: a.student_charge_due_id,
            charge_description:
              a.student_charge_dues?.student_charges?.description || 'Fee Obligation',
            term_name: a.student_charge_dues?.installment_plan_terms?.term_name || 'Ad-hoc',
          };
        });

        if (tx.status === 'success') {
          totalPaid = this.roundMoney(totalPaid + txAmount);
          totalAllocated = this.roundMoney(totalAllocated + allocatedAmount);
        }

        const unallocated =
          tx.status === 'success' ? Math.max(0, this.roundMoney(txAmount - allocatedAmount)) : 0;

        transactions.push({
          payment_transaction_id: tx.payment_transaction_id,
          order_id: order.payment_order_id,
          order_reference: order.order_reference,
          payment_method: tx.payment_method,
          status: tx.status,
          amount: txAmount,
          currency_code: tx.currency_code,
          transaction_date: tx.transaction_date || tx.created_at,
          gateway_name: tx.gateway_name,
          gateway_transaction_id: tx.gateway_transaction_id,
          allocations,
          allocated_amount: allocatedAmount,
          unallocated_amount: unallocated,
          refunds: tx.payment_refunds.map((r: any) => ({
            refund_id: r.payment_refund_id,
            amount: Number(r.amount.toString()),
            status: r.status,
            reason: r.reason,
            processed_at: r.processed_at,
          })),
        });
      }
    }

    return {
      total_paid: totalPaid,
      total_allocated: totalAllocated,
      unallocated: Math.max(0, this.roundMoney(totalPaid - totalAllocated)),
      transactions,
    };
  }

  /**
   * Retrieve obligation-level dues and overdue statuses for a student.
   */
  public static async getStudentDues(orgId: string, studentId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    const student = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
    });
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    const dues = await prisma.student_charge_dues.findMany({
      where: {
        student_charges: {
          student_id: safeStudentId,
          status: 'active',
        },
      },
      include: {
        student_charges: {
          include: { fee_components: true },
        },
        installment_plan_terms: true,
        payment_allocations: {
          include: { payment_transactions: true },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const formattedDues = dues.map((d: any) => {
      let paidAmt = 0;
      for (const a of d.payment_allocations) {
        if (a.payment_transactions.status === 'success') {
          paidAmt = this.roundMoney(paidAmt + Number(a.allocated_amount.toString()));
        }
      }

      const amountDue = Number(d.amount_due.toString());
      const outstanding = Math.max(0, this.roundMoney(amountDue - paidAmt));
      const dueDateStr = d.due_date.toISOString().split('T')[0];
      const isOverdue =
        dueDateStr < todayStr && outstanding > 0 && d.status !== 'paid' && d.status !== 'waived';

      return {
        due_id: d.student_charge_due_id,
        charge_id: d.student_charge_id,
        charge_description: d.student_charges.description,
        component_name: d.student_charges.fee_components?.component_name || 'Tuition',
        term_name: d.installment_plan_terms?.term_name || 'Standard Term',
        amount_due: amountDue,
        paid_amount: paidAmt,
        outstanding_amount: outstanding,
        due_date: dueDateStr,
        is_overdue: isOverdue,
        status: d.status,
      };
    });

    return formattedDues;
  }

  /**
   * Retrieve chronological transaction and ledger event history.
   */
  public static async getStudentTransactionHistory(orgId: string, studentId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    // Verify student belongs to tenant
    const student: any = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
      include: {
        student_enrollments: true,
      },
    });

    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    const [charges, paymentOrders, concessions, feeAssignments] = await Promise.all([
      prisma.student_charges.findMany({
        where: { student_id: safeStudentId },
        include: {
          fee_components: true,
          student_charge_dues: true,
        },
      }),
      prisma.payment_orders.findMany({
        where: { student_id: safeStudentId },
        include: {
          payment_transactions: {
            include: {
              payment_allocations: true,
              payment_refunds: true,
            },
          },
        },
      }),
      prisma.scholarship_concessions.findMany({
        where: { student_id: safeStudentId },
      }),
      prisma.student_fee_assignments.findMany({
        where: {
          enrollment_id: { in: student.student_enrollments.map((e: any) => e.enrollment_id) },
        },
        include: {
          fee_structures: true,
          installment_plans: true,
        },
      }),
    ]);

    student.student_charges = charges;
    student.payment_orders = paymentOrders;
    student.scholarship_concessions = concessions;

    const events: any[] = [];

    // 1. Assignments
    for (const asg of feeAssignments || []) {
      events.push({
        event_id: asg.student_fee_assignment_id,
        timestamp: asg.assigned_at,
        type: 'STRUCTURE_ASSIGNED',
        category: 'ASSESSMENT',
        reference: asg.fee_structures?.name || 'Fee Structure',
        description: `Fee Structure '${asg.fee_structures?.name || 'N/A'}' assigned with plan '${asg.installment_plans?.plan_name || 'Standard'}'`,
        debit_amount: 0,
        credit_amount: 0,
        status: asg.status,
      });
    }

    // 2. Charges (Debits)
    for (const chg of student.student_charges) {
      events.push({
        event_id: chg.student_charge_id,
        timestamp: chg.created_at,
        type: 'CHARGE_ASSESSED',
        category: 'DEBIT',
        reference: chg.description,
        description: `Billed charge: ${chg.description} (${chg.source_type})`,
        debit_amount: Number(chg.amount.toString()),
        credit_amount: 0,
        status: chg.status,
      });

      // Scheduled Dues
      for (const due of chg.student_charge_dues) {
        events.push({
          event_id: due.student_charge_due_id,
          timestamp: due.created_at,
          type: 'INSTALLMENT_SCHEDULED',
          category: 'SCHEDULE',
          reference: due.due_date.toISOString().split('T')[0],
          description: `Installment due on ${due.due_date.toISOString().split('T')[0]}`,
          debit_amount: Number(due.amount_due.toString()),
          credit_amount: 0,
          status: due.status,
        });
      }
    }

    // 3. Payments (Credits)
    for (const ord of student.payment_orders) {
      for (const tx of ord.payment_transactions) {
        events.push({
          event_id: tx.payment_transaction_id,
          timestamp: tx.transaction_date || tx.created_at,
          type: 'PAYMENT_RECEIVED',
          category: 'CREDIT',
          reference: tx.gateway_transaction_id || ord.order_reference,
          description: `Payment via ${tx.payment_method.toUpperCase()} (${tx.status})`,
          debit_amount: 0,
          credit_amount: tx.status === 'success' ? Number(tx.amount.toString()) : 0,
          status: tx.status,
        });

        for (const ref of tx.payment_refunds) {
          events.push({
            event_id: ref.payment_refund_id,
            timestamp: ref.created_at,
            type: 'PAYMENT_REFUND',
            category: 'DEBIT',
            reference: ref.refund_reference,
            description: `Refund requested/processed: ${ref.reason}`,
            debit_amount: Number(ref.amount.toString()),
            credit_amount: 0,
            status: ref.status,
          });
        }
      }
    }

    // 4. Concessions
    for (const conc of student.scholarship_concessions) {
      events.push({
        event_id: conc.scholarship_concession_id,
        timestamp: conc.created_at,
        type: 'CONCESSION_RECORDED',
        category: 'ADJUSTMENT',
        reference: conc.concession_name,
        description: `Concession: ${conc.concession_name} (${conc.concession_percentage}% approved: ${conc.approved_percentage ?? 'pending'}%)`,
        debit_amount: 0,
        credit_amount: 0,
        status: conc.status,
      });
    }

    // Sort descending by timestamp
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return events;
  }

  /**
   * Find eligible fee structures and installment plans for a student's enrollment.
   */
  public static async getEligibleStructures(orgId: string, studentId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    if (!safeStudentId) {
      const err: any = new Error('Invalid student identifier');
      err.statusCode = 400;
      throw err;
    }

    const student = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
      include: {
        student_enrollments: {
          where: { status: 'active' },
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            academic_year_grades: {
              include: { academic_years: true, grades: true },
            },
          },
        },
      },
    });

    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    const activeEnrollment = student.student_enrollments[0];
    if (!activeEnrollment) {
      return {
        enrollment: null,
        structures: [],
        installment_plans: [],
      };
    }

    const aygId = activeEnrollment.academic_year_grade_id;
    const ayId = activeEnrollment.academic_year_grades.academic_year_id;

    // Fetch published structures matching the student's grade & academic year
    const structures = await prisma.fee_structures.findMany({
      where: {
        academic_year_grade_id: aygId,
        status: 'published',
        academic_year_grades: {
          academic_years: {
            org_id: safeOrgId,
          },
        },
      },
      include: {
        fee_components: {
          orderBy: { display_order: 'asc' },
        },
      },
    });

    // Fetch published installment plans for this academic year
    const plans = await prisma.installment_plans.findMany({
      where: {
        org_id: safeOrgId,
        academic_year_id: ayId,
        status: 'published',
      },
      include: {
        installment_plan_terms: {
          orderBy: { term_number: 'asc' },
        },
      },
    });

    const formattedStructures = structures.map((s: any) => ({
      fee_structure_id: s.fee_structure_id,
      name: s.name,
      status: s.status,
      total_amount: this.roundMoney(
        s.fee_components.reduce((sum: number, c: any) => sum + Number(c.amount.toString()), 0),
      ),
      components_count: s.fee_components.length,
      components: s.fee_components.map((c: any) => ({
        component_name: c.component_name,
        amount: Number(c.amount.toString()),
      })),
    }));

    const formattedPlans = plans.map((p: any) => ({
      installment_plan_id: p.installment_plan_id,
      plan_name: p.plan_name,
      status: p.status,
      terms_count: p.installment_plan_terms.length,
      terms: p.installment_plan_terms.map((t: any) => ({
        term_name: t.term_name,
        percentage: Number(t.percentage.toString()),
        due_date: t.due_date.toISOString().split('T')[0],
      })),
    }));

    return {
      enrollment: {
        enrollment_id: activeEnrollment.enrollment_id,
        grade_name: activeEnrollment.academic_year_grades.grades.grade_name,
        academic_year_name: activeEnrollment.academic_year_grades.academic_years.academic_year_name,
      },
      structures: formattedStructures,
      installment_plans: formattedPlans,
    };
  }

  /**
   * Assign a published fee structure to an eligible student enrollment.
   * Transactional and strictly validated against tenant, academic year, and grade constraints.
   */
  public static async assignFeeStructure(
    orgId: string,
    userId: string | null,
    payload: AssignFeeStructurePayload | any,
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const studentIdRaw = payload.studentId || payload.student_id;
    const structureIdRaw = payload.feeStructureId || payload.fee_structure_id;
    const enrollmentIdRaw = payload.enrollmentId || payload.enrollment_id;
    const installmentPlanIdRaw = payload.installmentPlanId || payload.installment_plan_id;
    const notesRaw = payload.notes || payload.remarks;

    const safeStudentId = toSafeUuid(studentIdRaw);
    if (!safeStudentId) {
      const err: any = new Error('Valid student ID is required');
      err.statusCode = 400;
      throw err;
    }

    const safeStructureId = toSafeUuid(structureIdRaw);
    if (!safeStructureId) {
      const err: any = new Error('Valid fee structure ID is required');
      err.statusCode = 400;
      throw err;
    }

    const safeEnrollmentId = toSafeUuid(enrollmentIdRaw);
    const safeUserId = toSafeUuid(userId);

    // 1. Verify Fee Structure exists, belongs to tenant, and is published
    const feeStructure = await prisma.fee_structures.findFirst({
      where: {
        fee_structure_id: safeStructureId,
        academic_year_grades: {
          academic_years: {
            org_id: safeOrgId,
          },
        },
      },
      include: {
        academic_year_grades: {
          include: { academic_years: true, grades: true },
        },
        fee_components: true,
      },
    });

    if (!feeStructure) {
      const err: any = new Error(
        'Fee structure not found or does not belong to the authorized tenant',
      );
      err.statusCode = 404;
      throw err;
    }

    if (feeStructure.status !== 'published') {
      const err: any = new Error(
        `Cannot assign fee structure in '${feeStructure.status}' status. Only 'published' structures can be assigned.`,
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Verify Student exists and resolve active enrollment matching the structure's AYG
    const student: any = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
      include: {
        student_enrollments: {
          where: safeEnrollmentId
            ? { enrollment_id: safeEnrollmentId }
            : {
                status: 'active',
                academic_year_grade_id: feeStructure.academic_year_grade_id,
              },
          include: {
            academic_year_grades: {
              include: { academic_years: true, grades: true },
            },
          },
          take: 1,
        },
      },
    });

    if (!student) {
      const err: any = new Error('Student not found in the current organization');
      err.statusCode = 404;
      throw err;
    }

    let enrollment = student.student_enrollments?.[0];
    if (!enrollment) {
      const anyEnrollment = await prisma.student_enrollments.findFirst({
        where: { student_id: safeStudentId, status: 'active' },
        include: { academic_year_grades: { include: { grades: true, academic_years: true } } },
      });
      if (anyEnrollment) {
        const err: any = new Error(
          `Student is currently enrolled in ${anyEnrollment.academic_year_grades.grades.grade_name} (${anyEnrollment.academic_year_grades.academic_years.academic_year_name}), which does not match fee structure grade ${feeStructure.academic_year_grades.grades.grade_name} (${feeStructure.academic_year_grades.academic_years.academic_year_name}).`,
        );
        err.statusCode = 400;
        throw err;
      }
      const err: any = new Error('No active enrollment found for this student to assign fees to');
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify Structure is applicable to the student's grade and academic year
    if (feeStructure.academic_year_grade_id !== enrollment.academic_year_grade_id) {
      const err: any = new Error(
        'Fee structure is not configured for the student enrollment academic year and grade',
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Verify Installment Plan
    let installmentPlanId = toSafeUuid(installmentPlanIdRaw);
    let plan: any = null;

    if (!installmentPlanId) {
      // Find an existing published installment plan for this academic year
      plan = await prisma.installment_plans.findFirst({
        where: {
          org_id: safeOrgId,
          academic_year_id: enrollment.academic_year_grades.academic_year_id,
          status: 'published',
        },
        include: {
          installment_plan_terms: {
            orderBy: { term_number: 'asc' },
          },
        },
        orderBy: { created_at: 'asc' },
      });

      if (!plan) {
        // Fallback: check draft plan if no published plan exists
        plan = await prisma.installment_plans.findFirst({
          where: {
            org_id: safeOrgId,
            academic_year_id: enrollment.academic_year_grades.academic_year_id,
          },
          include: {
            installment_plan_terms: {
              orderBy: { term_number: 'asc' },
            },
          },
          orderBy: { created_at: 'asc' },
        });
      }

      if (!plan) {
        const err: any = new Error(
          'No installment plan found for this academic year. Please configure an installment plan first.',
        );
        err.statusCode = 400;
        throw err;
      }
      installmentPlanId = plan.installment_plan_id;
    } else {
      plan = await prisma.installment_plans.findFirst({
        where: {
          installment_plan_id: installmentPlanId,
          org_id: safeOrgId,
          academic_year_id: enrollment.academic_year_grades.academic_year_id,
        },
        include: {
          installment_plan_terms: {
            orderBy: { term_number: 'asc' },
          },
        },
      });

      if (!plan) {
        const err: any = new Error(
          'Installment plan not found or does not match the student academic year',
        );
        err.statusCode = 404;
        throw err;
      }
    }

    // 5. Check existing assignment for this enrollment (Idempotency and duplicate prevention)
    const existingAssignment = await prisma.student_fee_assignments.findFirst({
      where: {
        enrollment_id: enrollment.enrollment_id,
        status: 'active',
      },
      include: {
        fee_structures: true,
        installment_plans: true,
      },
    });

    if (existingAssignment) {
      if (
        existingAssignment.fee_structure_id === safeStructureId &&
        (!installmentPlanId || existingAssignment.installment_plan_id === installmentPlanId)
      ) {
        // Idempotent retry: check if charges and dues already exist
        const existingCharges = await prisma.student_charges.findMany({
          where: {
            student_fee_assignment_id: existingAssignment.student_fee_assignment_id,
          },
          include: { student_charge_dues: true },
        });

        if (existingCharges.length > 0) {
          const totalExistingDues = existingCharges.reduce(
            (sum: number, c: any) => sum + c.student_charge_dues.length,
            0,
          );
          const totalAmount = this.roundMoney(
            existingCharges.reduce((sum: number, c: any) => sum + Number(c.amount.toString()), 0),
          );

          return {
            student_fee_assignment_id: existingAssignment.student_fee_assignment_id,
            enrollment_id: existingAssignment.enrollment_id,
            fee_structure_id: existingAssignment.fee_structure_id,
            fee_structure_name: feeStructure.name,
            installment_plan_id: existingAssignment.installment_plan_id,
            installment_plan_name: plan.plan_name,
            assigned_at: existingAssignment.assigned_at,
            status: existingAssignment.status,
            total_structure_amount: totalAmount,
            charges_count: existingCharges.length,
            dues_count: totalExistingDues,
            is_idempotent_replay: true,
          };
        }
      } else {
        const err: any = new Error(
          `Student already has an active fee structure ('${existingAssignment.fee_structures?.name || 'Assigned'}') assigned.`,
        );
        err.statusCode = 409;
        throw err;
      }
    }

    // 6. Transactional Write to student_fee_assignments, student_charges, and student_charge_dues
    const terms = (plan.installment_plan_terms || []).sort(
      (a: any, b: any) => a.term_number - b.term_number,
    );

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 6.1 Create student_fee_assignments
      const createdAssignment = await tx.student_fee_assignments.create({
        data: {
          enrollment_id: enrollment.enrollment_id,
          fee_structure_id: safeStructureId,
          installment_plan_id: plan.installment_plan_id,
          status: 'active',
          notes: notesRaw || null,
          created_by: safeUserId,
          updated_by: safeUserId,
        },
        include: {
          fee_structures: {
            include: { fee_components: true },
          },
          installment_plans: true,
        },
      });

      let totalChargesAmount = 0;
      let totalCreatedDues = 0;
      const createdChargesSummary = [];

      // 6.2 For each fee component, create student_charges and partition into student_charge_dues
      for (const comp of feeStructure.fee_components) {
        const compAmount = this.roundMoney(Number(comp.amount.toString()));
        totalChargesAmount = this.roundMoney(totalChargesAmount + compAmount);

        const charge = await tx.student_charges.create({
          data: {
            student_id: safeStudentId,
            student_fee_assignment_id: createdAssignment.student_fee_assignment_id,
            fee_component_id: comp.fee_component_id,
            source_type: 'academic',
            source_id: comp.fee_component_id,
            description: `${comp.component_name} (${comp.component_code})`,
            amount: compAmount,
            currency_code: 'INR',
            charge_date: new Date(),
            status: 'active',
            created_by: safeUserId,
            updated_by: safeUserId,
          },
        });

        // 6.3 Generate student_charge_dues based on installment plan terms
        if (terms.length > 0) {
          let allocatedForComp = 0;

          for (let i = 0; i < terms.length; i++) {
            const term = terms[i];
            const isLast = i === terms.length - 1;
            let dueAmount: number;

            if (isLast) {
              dueAmount = this.roundMoney(compAmount - allocatedForComp);
            } else {
              dueAmount = this.roundMoney(compAmount * (Number(term.percentage.toString()) / 100));
              allocatedForComp = this.roundMoney(allocatedForComp + dueAmount);
            }

            await tx.student_charge_dues.create({
              data: {
                student_charge_id: charge.student_charge_id,
                installment_term_id: term.installment_term_id,
                amount_due: dueAmount,
                due_date: new Date(term.due_date),
                status: 'pending',
                created_by: safeUserId,
                updated_by: safeUserId,
              },
            });

            totalCreatedDues++;
          }
        } else {
          // Fallback if no terms: single full due 30 days out
          const defaultDueDate = new Date();
          defaultDueDate.setDate(defaultDueDate.getDate() + 30);

          await tx.student_charge_dues.create({
            data: {
              student_charge_id: charge.student_charge_id,
              amount_due: compAmount,
              due_date: defaultDueDate,
              status: 'pending',
              created_by: safeUserId,
              updated_by: safeUserId,
            },
          });

          totalCreatedDues++;
        }

        createdChargesSummary.push({
          charge_id: charge.student_charge_id,
          component_name: comp.component_name,
          amount: compAmount,
        });
      }

      return {
        assignment: createdAssignment,
        totalAmount: totalChargesAmount,
        chargesCount: createdChargesSummary.length,
        duesCount: totalCreatedDues,
      };
    });

    // Authoritative fee assessment notification event emission
    FinanceNotificationService.publishEvent({
      eventType: FinanceEventType.FEE_ASSESSMENT_CREATED,
      orgId: safeOrgId,
      sourceEntityId: transactionResult.assignment.student_fee_assignment_id,
      sourceWorkflow: 'student_fee_structure_assign',
      timestamp: new Date().toISOString(),
      correlationId: `assign_${transactionResult.assignment.student_fee_assignment_id}`,
      idempotencyKey: `fee_assign_${transactionResult.assignment.student_fee_assignment_id}`,
      studentId: safeStudentId,
      studentName: `${student.first_name} ${student.last_name || ''}`.trim(),
      admissionNo: student.admission_no,
      amount: transactionResult.totalAmount,
      gradeName: enrollment.academic_year_grades?.grades?.grade_name || undefined,
      feeDescription: feeStructure.name,
      performedBy: safeUserId || undefined,
    }).catch((err) => {
      logger.error('[StudentLedgerService] Fee assessment created notification error:', err);
    });

    return {
      student_fee_assignment_id: transactionResult.assignment.student_fee_assignment_id,
      enrollment_id: transactionResult.assignment.enrollment_id,
      fee_structure_id: transactionResult.assignment.fee_structure_id,
      fee_structure_name: feeStructure.name,
      installment_plan_id: transactionResult.assignment.installment_plan_id,
      installment_plan_name: plan.plan_name,
      assigned_at: transactionResult.assignment.assigned_at,
      status: transactionResult.assignment.status,
      total_structure_amount: transactionResult.totalAmount,
      charges_count: transactionResult.chargesCount,
      dues_count: transactionResult.duesCount,
    };
  }

  /**
   * Bulk assign a published fee structure to multiple eligible students
   */
  public static async bulkAssignFeeStructure(
    orgId: string,
    userId: string,
    payload:
      | {
          studentIds?: string[];
          student_ids?: string[];
          feeStructureId?: string;
          fee_structure_id?: string;
          installmentPlanId?: string;
          installment_plan_id?: string;
          notes?: string;
          remarks?: string;
        }
      | any,
  ) {
    if (!orgId) throw new Error('Tenant organization ID is required');

    const studentIdsRaw = payload.studentIds || payload.student_ids;
    const structureIdRaw = payload.feeStructureId || payload.fee_structure_id;
    const installmentPlanIdRaw = payload.installmentPlanId || payload.installment_plan_id;
    const notesRaw = payload.notes || payload.remarks;

    if (!studentIdsRaw || !Array.isArray(studentIdsRaw) || studentIdsRaw.length === 0) {
      const err: any = new Error('At least one student ID is required for bulk assignment');
      err.statusCode = 400;
      throw err;
    }

    const results: Array<{
      studentId: string;
      success: boolean;
      assignment?: any;
      error?: string;
    }> = [];

    for (const sId of studentIdsRaw) {
      try {
        const assignment = await this.assignFeeStructure(orgId, userId, {
          studentId: sId,
          feeStructureId: structureIdRaw,
          installmentPlanId: installmentPlanIdRaw,
          notes: notesRaw,
        });

        results.push({
          studentId: sId,
          success: true,
          assignment,
        });
      } catch (err: any) {
        results.push({
          studentId: sId,
          success: false,
          error: err.message || 'Failed to assign fee structure',
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: studentIdsRaw.length,
      succeeded,
      failed,
      results,
    };
  }
}
