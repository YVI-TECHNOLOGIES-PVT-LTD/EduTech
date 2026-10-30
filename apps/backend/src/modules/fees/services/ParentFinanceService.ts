import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from './FeeStructureManagerService';
import { StudentLedgerService } from './StudentLedgerService';
import { PaymentCollectionService } from './PaymentCollectionService';
import { PaymentRepository } from '../repositories/PaymentRepository';

export interface ChildFeeOverview {
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  grade_name: string | null;
  academic_year_name: string | null;
  section_name: string | null;
  roll_number?: string | null;
  enrollment_id: string | null;
  is_assigned: boolean;
  assignment_id: string | null;
  fee_structure_name: string | null;
  installment_plan_name: string | null;
  student?: {
    id: string;
    full_name: string;
    student_code: string;
    grade_name?: string | null;
    section_name?: string | null;
    roll_number?: string | null;
    academic_year_name?: string | null;
  };
  summary: {
    total_assessed: number;
    total_paid: number;
    outstanding_balance: number;
    balance?: number;
    overdue_amount: number;
    next_due_date?: string | null;
    next_due_amount?: number | null;
    total_dues_count: number;
    unpaid_dues_count: number;
    status: 'fully_paid' | 'partially_paid' | 'pending' | 'overdue' | 'no_fees_assigned';
  };
  fees?: Array<{
    id: string;
    fee_type: string;
    fee_structure: { name: string };
    assigned_amount: number;
  }>;
  payments?: Array<{
    id: string;
    amount_paid: number;
    created_at: string;
    payment_mode: string;
    reference_no: string | null;
  }>;
  components: Array<{
    component_id?: string;
    component_name: string;
    component_code: string;
    amount: number;
    paid_amount?: number;
    outstanding_amount?: number;
    status?: string;
    description: string | null;
  }>;
  dues: Array<{
    due_id: string;
    charge_id: string;
    charge_description: string;
    component_name: string;
    term_name: string;
    amount_due: number;
    paid_amount: number;
    outstanding_amount: number;
    due_date: string;
    is_overdue: boolean;
    status: string;
  }>;
  payment_history: Array<{
    transaction_id: string;
    order_id: string | null;
    payment_method: string;
    amount: number;
    currency: string;
    status: string;
    transaction_reference: string | null;
    created_at: string;
  }>;
}

/**
 * Deterministically select active enrollment within tenant organization.
 */
export function selectCurrentEnrollment(enrollments: any[], orgId: string): any | null {
  if (!enrollments || enrollments.length === 0) return null;

  const tenantEnrollments = enrollments.filter((e) => {
    const ayOrgId = e.academic_year_grades?.academic_years?.org_id;
    return !ayOrgId || ayOrgId === orgId;
  });

  if (tenantEnrollments.length === 0) return null;
  if (tenantEnrollments.length === 1) return tenantEnrollments[0];

  const activeYearEnrollment = tenantEnrollments.find((e) => {
    const ayStatus = e.academic_year_grades?.academic_years?.status;
    return ayStatus && !['closed', 'archived'].includes(ayStatus);
  });

  if (activeYearEnrollment) return activeYearEnrollment;
  return tenantEnrollments[0];
}

export class ParentFinanceService {
  /**
   * Decimal-safe rounding to 2 decimal places
   */
  public static roundMoney(val: number): number {
    return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Verify if the authenticated parent/user is authorized to access a specific student's records
   */
  public static async verifyParentChildAccess(
    orgId: string,
    userId: string,
    studentId: string,
    userEmail?: string,
  ): Promise<boolean> {
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeStudentId = toSafeUuid(studentId);
    const safeUserId = toSafeUuid(userId);

    if (!safeStudentId || !safeOrgId) return false;

    // 1. Check if the user is the student directly within the authorized tenant
    if (safeUserId) {
      const directStudent = await prisma.students.findFirst({
        where: {
          student_id: safeStudentId,
          org_id: safeOrgId,
          user_id: safeUserId,
        },
      });
      if (directStudent) return true;
    }

    // 2. Check if the user is a linked parent via student_parents
    let parent = null;
    if (safeUserId) {
      parent = await prisma.parents.findFirst({
        where: {
          org_id: safeOrgId,
          user_id: safeUserId,
        },
      });
    }

    // Anti-hijacking: safe email fallback only matches unlinked parent profiles (user_id is null)
    if (!parent && userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase();
      parent = await prisma.parents.findFirst({
        where: {
          org_id: safeOrgId,
          email: { equals: normalizedEmail, mode: 'insensitive' },
          user_id: null,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    if (!parent) return false;

    // Check relationship and guarantee student also strictly belongs to the tenant organization
    const link = await prisma.student_parents.findFirst({
      where: {
        parent_id: parent.parent_id,
        student_id: safeStudentId,
        students: {
          org_id: safeOrgId,
        },
      },
    });

    return Boolean(link);
  }

  /**
   * Retrieve multi-child fee summary for the authenticated parent account
   */
  public static async getMyChildrenFees(
    orgId: string,
    userId: string,
    userEmail?: string,
  ): Promise<{
    parent_id: string | null;
    parent_name: string | null;
    parent_email: string | null;
    children_count: number;
    children: ChildFeeOverview[];
    message?: string;
  }> {
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeUserId = toSafeUuid(userId);

    // 1. Resolve parent entity in this organization
    let parent = null;
    if (safeUserId) {
      parent = await prisma.parents.findFirst({
        where: {
          org_id: safeOrgId,
          user_id: safeUserId,
        },
      });
    }

    if (!parent && userEmail) {
      const normalizedEmail = userEmail.trim().toLowerCase();
      parent = await prisma.parents.findFirst({
        where: {
          org_id: safeOrgId,
          email: { equals: normalizedEmail, mode: 'insensitive' },
          user_id: null,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    let targetStudentIds: string[] = [];
    let parentName: string | null = null;
    let parentEmail: string | null = userEmail || null;

    if (parent) {
      parentName = `${parent.first_name} ${parent.last_name || ''}`.trim();
      parentEmail = parent.email || parentEmail;

      const links = await prisma.student_parents.findMany({
        where: { parent_id: parent.parent_id },
        select: { student_id: true },
      });

      targetStudentIds = links.map((l: any) => l.student_id);
    } else {
      // Check if user is a student account viewing their own fees
      if (safeUserId) {
        const studentSelf = await prisma.students.findFirst({
          where: {
            org_id: safeOrgId,
            user_id: safeUserId,
          },
        });

        if (studentSelf) {
          targetStudentIds = [studentSelf.student_id];
        }
      }
    }

    if (targetStudentIds.length === 0) {
      return {
        parent_id: parent?.parent_id || null,
        parent_name: parentName,
        parent_email: parentEmail,
        children_count: 0,
        children: [],
        message: 'No student accounts are currently linked to this authenticated profile.',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Fetch full student, enrollment, and fee details for each child
    const students = await prisma.students.findMany({
      where: {
        student_id: { in: targetStudentIds },
        org_id: safeOrgId,
      },
      include: {
        student_enrollments: {
          where: { status: 'active' },
          include: {
            academic_year_grades: {
              include: { academic_years: true, grades: true },
            },
            sections: true,
            student_fee_assignments: {
              where: { status: 'active' },
              include: {
                fee_structures: {
                  include: { fee_components: { orderBy: { display_order: 'asc' } } },
                },
                installment_plans: {
                  include: { installment_plan_terms: { orderBy: { term_number: 'asc' } } },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    const children: ChildFeeOverview[] = [];

    for (const student of students) {
      const enrollment =
        selectCurrentEnrollment(student.student_enrollments, safeOrgId) ||
        student.student_enrollments[0] ||
        null;
      const activeAssignment = enrollment?.student_fee_assignments?.[0] || null;

      // Query active charges and dues
      const charges = await prisma.student_charges.findMany({
        where: {
          student_id: student.student_id,
          status: { in: ['active', 'waived'] },
        },
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

      // Query payment history
      const paymentOrders = await prisma.payment_orders.findMany({
        where: { student_id: student.student_id },
        include: {
          payment_transactions: {
            orderBy: { created_at: 'desc' },
          },
        },
      });

      const paymentHistory = paymentOrders.flatMap((o) =>
        o.payment_transactions.map((tx: any) => ({
          transaction_id: tx.payment_transaction_id,
          order_id: o.payment_order_id,
          payment_method: tx.payment_method,
          amount: Number(tx.amount),
          currency: tx.currency_code || 'INR',
          status: tx.status,
          transaction_reference: tx.transaction_reference,
          created_at: tx.created_at.toISOString(),
        })),
      );

      let totalAssessed = 0;
      let totalPaid = 0;
      let totalOverdue = 0;
      const duesList: ChildFeeOverview['dues'] = [];
      const componentsList: ChildFeeOverview['components'] = [];

      // Process charges and dues
      for (const charge of charges) {
        if (charge.status === 'active') {
          totalAssessed = this.roundMoney(totalAssessed + Number(charge.amount));

          for (const due of charge.student_charge_dues) {
            if (due.status === 'cancelled') continue;

            const dueAmt = Number(due.amount_due);

            // Compute paid allocations strictly from successful transactions
            let paidAllocated = 0;
            for (const alloc of due.payment_allocations) {
              if (alloc.payment_transactions?.status === 'success') {
                paidAllocated = this.roundMoney(paidAllocated + Number(alloc.allocated_amount));
              }
            }

            totalPaid = this.roundMoney(totalPaid + paidAllocated);
            const outstanding = Math.max(0, this.roundMoney(dueAmt - paidAllocated));
            const dueDateStr = due.due_date.toISOString().split('T')[0];
            const isOverdue =
              dueDateStr < todayStr &&
              outstanding > 0 &&
              due.status !== 'paid' &&
              due.status !== 'waived';

            if (isOverdue) {
              totalOverdue = this.roundMoney(totalOverdue + outstanding);
            }

            duesList.push({
              due_id: due.student_charge_due_id,
              charge_id: due.student_charge_id,
              charge_description: charge.description,
              component_name: charge.fee_components?.component_name || 'Academic Fee',
              term_name: due.installment_plan_terms?.term_name || 'Term Due',
              amount_due: dueAmt,
              paid_amount: paidAllocated,
              outstanding_amount: outstanding,
              due_date: dueDateStr,
              is_overdue: isOverdue,
              status: due.status,
            });
          }
        }
      }

      // Extract component breakdown directly from active charges
      const activeCharges = charges.filter((c) => c.status === 'active');
      if (activeCharges.length > 0) {
        for (const charge of activeCharges) {
          const chargeAmt = Number(charge.amount);
          let chargePaid = 0;
          let chargeHasOverdue = false;

          for (const due of charge.student_charge_dues) {
            if (due.status === 'cancelled') continue;
            let duePaid = 0;
            for (const alloc of due.payment_allocations) {
              if (alloc.payment_transactions?.status === 'success') {
                duePaid = this.roundMoney(duePaid + Number(alloc.allocated_amount));
              }
            }
            chargePaid = this.roundMoney(chargePaid + duePaid);
            const dueOutstanding = Math.max(0, this.roundMoney(Number(due.amount_due) - duePaid));
            const dueDateStr = due.due_date.toISOString().split('T')[0];
            if (
              dueDateStr < todayStr &&
              dueOutstanding > 0 &&
              due.status !== 'paid' &&
              due.status !== 'waived'
            ) {
              chargeHasOverdue = true;
            }
          }

          const chargeOutstanding = Math.max(0, this.roundMoney(chargeAmt - chargePaid));
          let compStatus = 'pending';
          if (chargeOutstanding <= 0 && chargeAmt > 0) {
            compStatus = 'paid';
          } else if (chargeHasOverdue) {
            compStatus = 'overdue';
          } else if (chargePaid > 0) {
            compStatus = 'partial';
          }

          componentsList.push({
            component_id: charge.fee_component_id || charge.student_charge_id,
            component_name:
              charge.fee_components?.component_name || charge.description || 'Academic Fee',
            component_code: charge.fee_components?.component_code || 'COMP',
            amount: chargeAmt,
            paid_amount: chargePaid,
            outstanding_amount: chargeOutstanding,
            status: compStatus,
            description: charge.description || charge.fee_components?.description || null,
          });
        }
      } else if (activeAssignment?.fee_structures?.fee_components) {
        // Fallback to structure components if individual charges are pending generation
        for (const comp of activeAssignment.fee_structures.fee_components) {
          const compAmt = Number(comp.amount);
          componentsList.push({
            component_id: comp.fee_component_id,
            component_name: comp.component_name,
            component_code: comp.component_code,
            amount: compAmt,
            paid_amount: 0,
            outstanding_amount: compAmt,
            status: 'pending',
            description: comp.description,
          });
        }
      }

      // Sort dues chronologically
      duesList.sort((a, b) => a.due_date.localeCompare(b.due_date));

      // Calculate next due installment (earliest upcoming or overdue due with positive balance)
      let nextDueDate: string | null = null;
      let nextDueAmount: number | null = null;
      const unpaidDues = duesList.filter((d) => d.outstanding_amount > 0);
      if (unpaidDues.length > 0) {
        nextDueDate = unpaidDues[0].due_date;
        nextDueAmount = unpaidDues[0].outstanding_amount;
      }

      const outstandingBalance = Math.max(0, this.roundMoney(totalAssessed - totalPaid));

      let overallStatus: ChildFeeOverview['summary']['status'] = 'pending';
      if (!activeAssignment && charges.length === 0) {
        overallStatus = 'no_fees_assigned';
      } else if (outstandingBalance <= 0 && totalAssessed > 0) {
        overallStatus = 'fully_paid';
      } else if (totalOverdue > 0) {
        overallStatus = 'overdue';
      } else if (totalPaid > 0) {
        overallStatus = 'partially_paid';
      }

      const fullName = `${student.first_name} ${student.last_name || ''}`.trim();
      const gradeName = enrollment?.academic_year_grades?.grades?.grade_name || null;

      children.push({
        student_id: student.student_id,
        admission_no: student.admission_no,
        first_name: student.first_name,
        last_name: student.last_name,
        full_name: fullName,
        grade_name: gradeName,
        academic_year_name:
          enrollment?.academic_year_grades?.academic_years?.academic_year_name || null,
        section_name: enrollment?.sections?.section_name || null,
        roll_number: enrollment?.roll_number || null,
        enrollment_id: enrollment?.enrollment_id || null,
        is_assigned: Boolean(activeAssignment),
        assignment_id: activeAssignment?.student_fee_assignment_id || null,
        fee_structure_name: activeAssignment?.fee_structures?.name || null,
        installment_plan_name: activeAssignment?.installment_plans?.plan_name || null,
        student: {
          id: student.student_id,
          full_name: fullName,
          student_code: student.admission_no,
          grade_name: gradeName,
          section_name: enrollment?.sections?.section_name || null,
          roll_number: enrollment?.roll_number || null,
          academic_year_name:
            enrollment?.academic_year_grades?.academic_years?.academic_year_name || null,
        },
        summary: {
          total_assessed: totalAssessed,
          total_paid: totalPaid,
          outstanding_balance: outstandingBalance,
          balance: outstandingBalance,
          overdue_amount: totalOverdue,
          next_due_date: nextDueDate,
          next_due_amount: nextDueAmount,
          total_dues_count: duesList.length,
          unpaid_dues_count: unpaidDues.length,
          status: overallStatus,
        },
        fees: componentsList.map((c, idx) => ({
          id: duesList[idx]?.charge_id || `${student.student_id}-fee-${idx}`,
          fee_type: 'ACADEMIC',
          fee_structure: { name: c.component_name },
          assigned_amount: c.amount,
        })),
        payments: paymentHistory.map((p) => ({
          id: p.transaction_id,
          amount_paid: p.amount,
          created_at: p.created_at,
          payment_mode: p.payment_method,
          reference_no: p.transaction_reference,
        })),
        components: componentsList,
        dues: duesList,
        payment_history: paymentHistory,
      });
    }

    return {
      parent_id: parent?.parent_id || null,
      parent_name: parentName,
      parent_email: parentEmail,
      children_count: children.length,
      children,
    };
  }

  /**
   * Retrieve detailed financial overview for a specific linked child of an authenticated parent
   */
  public static async getChildFeeDetails(
    orgId: string,
    userId: string,
    studentId: string,
    userEmail?: string,
  ): Promise<ChildFeeOverview> {
    const data = await this.getMyChildrenFees(orgId, userId, userEmail);
    const child = data.children.find((c) => c.student_id === studentId);
    if (!child) {
      const err: any = new Error(
        'Student fee record not found or not linked to this authenticated parent account.',
      );
      err.statusCode = 404;
      err.code = 'STUDENT_NOT_LINKED';
      throw err;
    }
    return child;
  }

  /**
   * Create an authorized online payment order intent for an authenticated parent's child
   */
  public static async createParentPaymentOrder(
    orgId: string,
    parentUserId: string,
    payload: {
      studentId: string;
      studentChargeDueId?: string;
      dueId?: string;
      amount?: number;
      paymentMethod?: string;
      notes?: string;
    },
    userEmail?: string,
  ): Promise<any> {
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeParentUserId = toSafeUuid(parentUserId);
    const studentIdRaw = payload.studentId || (payload as any).student_id;
    const safeStudentId = toSafeUuid(studentIdRaw);
    const dueIdRaw =
      payload.studentChargeDueId ||
      (payload as any).student_charge_due_id ||
      payload.dueId ||
      (payload as any).due_id;
    const safeDueId = toSafeUuid(dueIdRaw);

    if (!safeOrgId) {
      const err: any = new Error('Tenant organization ID is required');
      err.statusCode = 400;
      throw err;
    }

    if (!safeStudentId) {
      const err: any = new Error('Valid student ID is required for payment initiation');
      err.statusCode = 400;
      throw err;
    }

    // 1. Authoritative Parent-Child & Tenant Access Verification (P0)
    const isAuthorized = await this.verifyParentChildAccess(
      safeOrgId,
      parentUserId,
      safeStudentId,
      userEmail,
    );

    if (!isAuthorized) {
      const err: any = new Error(
        'Unauthorized: You are not authorized to initiate payments for this student.',
      );
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_STUDENT_ACCESS';
      throw err;
    }

    // 2. Verify Student belongs to tenant
    const student = await prisma.students.findFirst({
      where: { student_id: safeStudentId, org_id: safeOrgId },
      select: { student_id: true, first_name: true, last_name: true, admission_no: true },
    });

    if (!student) {
      const err: any = new Error('Student not found in authorized organization');
      err.statusCode = 404;
      throw err;
    }

    // 3. Resolve Target Due and Amount Authoritatively
    let targetDueId: string;
    let payableAmount: number;

    if (safeDueId) {
      // Validate specific requested due
      const due = await PaymentRepository.findDueWithAllocations(safeDueId, safeStudentId);
      if (!due) {
        const err: any = new Error(
          'Obligation due not found or does not belong to the selected student',
        );
        err.statusCode = 404;
        throw err;
      }

      if (due.status === 'cancelled' || due.status === 'waived') {
        const err: any = new Error(
          `Cannot collect payment on obligation with status '${due.status}'`,
        );
        err.statusCode = 400;
        throw err;
      }

      const dueAmount = Number(due.amount_due);
      const allocated = Number(due.allocated_amount);
      const remainingPayable = Math.max(0, StudentLedgerService.roundMoney(dueAmount - allocated));

      if (remainingPayable <= 0) {
        const err: any = new Error('This obligation has already been fully paid and settled');
        err.statusCode = 400;
        throw err;
      }

      if (payload.amount !== undefined && payload.amount !== null) {
        const requested = Number(payload.amount);
        if (isNaN(requested) || requested <= 0) {
          const err: any = new Error('Payment amount must be a positive number');
          err.statusCode = 400;
          throw err;
        }
        if (requested > remainingPayable + 0.001) {
          const err: any = new Error(
            `Payment amount (₹${requested.toFixed(2)}) exceeds eligible remaining balance (₹${remainingPayable.toFixed(2)})`,
          );
          err.statusCode = 400;
          throw err;
        }
        payableAmount = StudentLedgerService.roundMoney(requested);
      } else {
        payableAmount = remainingPayable;
      }

      targetDueId = safeDueId;
    } else {
      // Automatically resolve earliest unpaid due
      const eligibleDues = await PaymentRepository.getEligibleDuesForStudent(safeStudentId);
      const activeUnpaidDues = eligibleDues.filter(
        (d) => d.remaining_payable_amount > 0 && d.status !== 'cancelled' && d.status !== 'waived',
      );

      if (activeUnpaidDues.length === 0) {
        const err: any = new Error('No unpaid fee obligations found for this student');
        err.statusCode = 400;
        throw err;
      }

      // Sort: overdue first, then by earliest due date
      const sortedDues = [...activeUnpaidDues].sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      const selectedDue = sortedDues[0];
      targetDueId = selectedDue.student_charge_due_id;

      if (payload.amount !== undefined && payload.amount !== null) {
        const requested = Number(payload.amount);
        if (isNaN(requested) || requested <= 0) {
          const err: any = new Error('Payment amount must be a positive number');
          err.statusCode = 400;
          throw err;
        }
        if (requested > selectedDue.remaining_payable_amount + 0.001) {
          const err: any = new Error(
            `Payment amount (₹${requested.toFixed(2)}) exceeds eligible remaining balance (₹${selectedDue.remaining_payable_amount.toFixed(2)})`,
          );
          err.statusCode = 400;
          throw err;
        }
        payableAmount = StudentLedgerService.roundMoney(requested);
      } else {
        payableAmount = selectedDue.remaining_payable_amount;
      }
    }

    // 4. Delegate to authoritative PaymentCollectionService
    const result = await PaymentCollectionService.createOnlinePaymentOrder(
      safeOrgId,
      safeParentUserId || null,
      {
        studentId: safeStudentId,
        studentChargeDueId: targetDueId,
        amount: payableAmount,
        paymentMethod: payload.paymentMethod || (payload as any).payment_method || 'card',
        notes: payload.notes || `Online parent payment for ${student.first_name}`,
      },
    );

    return {
      success: true,
      order_id: result.order.gateway_order_id,
      amount: Math.round(result.order.amount * 100), // integer paise
      amount_in_rupees: result.order.amount,
      currency: result.order.currency,
      key_id: result.order.key_id,
      payment_order_id: result.order.payment_order_id,
      order_reference: result.order.order_reference,
      student_id: safeStudentId,
      student_charge_due_id: targetDueId,
      is_simulation: Boolean(result.order.is_simulation),
      checkout_url: `/api/v1/fees/razorpay/checkout/${result.order.payment_order_id}`,
    };
  }

  /**
   * Verify and reconcile an online payment made by an authenticated parent
   */
  public static async verifyParentPayment(
    orgId: string,
    parentUserId: string,
    payload: {
      razorpay_order_id?: string;
      order_id?: string;
      razorpayOrderId?: string;
      razorpay_payment_id?: string;
      payment_id?: string;
      razorpayPaymentId?: string;
      razorpay_signature?: string;
      signature?: string;
      razorpaySignature?: string;
      payment_order_id?: string;
      paymentOrderId?: string;
    },
    userEmail?: string,
  ): Promise<any> {
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const orderId = String(
      payload.razorpay_order_id || payload.order_id || payload.razorpayOrderId || '',
    ).trim();
    const paymentId = String(
      payload.razorpay_payment_id || payload.payment_id || payload.razorpayPaymentId || '',
    ).trim();
    const signature = String(
      payload.razorpay_signature || payload.signature || payload.razorpaySignature || '',
    ).trim();
    const clientPaymentOrderId = payload.payment_order_id || payload.paymentOrderId;

    if (!orderId || !paymentId || !signature) {
      const err: any = new Error(
        'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required for payment verification.',
      );
      err.statusCode = 400;
      throw err;
    }

    // 1. Locate local transaction and order to verify parent-child authorization
    let localTx: any = await PaymentRepository.findTransactionWithOrderAndDueByGatewayRef(
      orderId,
    ).catch(() => null);

    if (!localTx && clientPaymentOrderId) {
      const orderRecord = await PaymentRepository.findPaymentOrderForVerification(
        clientPaymentOrderId,
      ).catch(() => null);
      if (orderRecord && orderRecord.payment_transactions?.[0]) {
        localTx = {
          payment_transaction_id: orderRecord.payment_transactions[0].payment_transaction_id,
          payment_order_id: orderRecord.payment_order_id,
          payment_method: orderRecord.payment_transactions[0].payment_method,
          status: orderRecord.payment_transactions[0].status,
          amount: Number(orderRecord.amount),
          payment_orders: orderRecord,
        };
      }
    }

    if (!localTx || !localTx.payment_orders) {
      const err: any = new Error('Payment order not found for verification');
      err.statusCode = 404;
      throw err;
    }

    const order = localTx.payment_orders;

    // 2. Tenant isolation check
    if (order.org_id && order.org_id !== safeOrgId) {
      const err: any = new Error(
        'Payment order does not belong to the authorized tenant organization',
      );
      err.statusCode = 403;
      err.code = 'TENANT_MISMATCH';
      throw err;
    }

    // 3. Parent-child access authorization (P0)
    const isAuthorized = await this.verifyParentChildAccess(
      safeOrgId,
      parentUserId,
      order.student_id,
      userEmail,
    );

    if (!isAuthorized) {
      const err: any = new Error(
        'Unauthorized: You are not authorized to verify payments for this student.',
      );
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_STUDENT_ACCESS';
      throw err;
    }

    // 4. Delegate to PaymentCollectionService.verifyOnlinePayment
    const verifyResult = await PaymentCollectionService.verifyOnlinePayment(
      safeOrgId,
      toSafeUuid(parentUserId),
      {
        paymentOrderId: order.payment_order_id,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      },
    );

    return verifyResult;
  }

  /**
   * Retrieve official receipt details for an authenticated parent's child
   */
  public static async getParentReceiptDetails(
    orgId: string,
    parentUserId: string,
    transactionId: string,
    userEmail?: string,
  ): Promise<any> {
    const safeOrgId = toSafeUuid(orgId) || orgId;

    if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
      const err: any = new Error('Valid transaction ID or receipt reference is required');
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch receipt details from repository
    const receipt = await PaymentRepository.getReceiptDetails(safeOrgId, transactionId.trim());

    if (!receipt) {
      const err: any = new Error('Receipt or transaction not found in authorized organization');
      err.statusCode = 404;
      throw err;
    }

    // 2. Verify transaction status qualifies under receipt rules
    const isValidReceiptStatus =
      receipt.receipt_type === 'CANCELLED' ||
      receipt.status === 'GENERATED' ||
      receipt.transaction_status === 'success';

    if (!isValidReceiptStatus) {
      const err: any = new Error(
        'Receipt is not available for unconfirmed or pending transactions',
      );
      err.statusCode = 400;
      throw err;
    }

    // 3. Strict Parent-Child & Tenant Authorization Check (P0/P5)
    const isAuthorized = await this.verifyParentChildAccess(
      safeOrgId,
      parentUserId,
      receipt.student_id,
      userEmail,
    );

    if (!isAuthorized) {
      const err: any = new Error(
        'Unauthorized: You are not authorized to access receipts for this student.',
      );
      err.statusCode = 403;
      err.code = 'UNAUTHORIZED_RECEIPT_ACCESS';
      throw err;
    }

    return receipt;
  }
}
