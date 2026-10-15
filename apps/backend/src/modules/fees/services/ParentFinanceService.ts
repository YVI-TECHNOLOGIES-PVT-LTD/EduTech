import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from './FeeStructureManagerService';

export interface ChildFeeOverview {
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  grade_name: string | null;
  academic_year_name: string | null;
  section_name: string | null;
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
  };
  summary: {
    total_assessed: number;
    total_paid: number;
    outstanding_balance: number;
    balance?: number;
    overdue_amount: number;
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
    component_name: string;
    component_code: string;
    amount: number;
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

    if (!safeStudentId) return false;

    // Check if the user is the student directly
    const directStudent = await prisma.students.findFirst({
      where: {
        student_id: safeStudentId,
        org_id: safeOrgId,
        OR: [
          ...(safeUserId ? [{ user_id: safeUserId }] : []),
          ...(userEmail ? [{ admission_no: userEmail }] : []),
        ],
      },
    });

    if (directStudent) return true;

    // Check if the user is a linked parent via student_parents
    const parent = await prisma.parents.findFirst({
      where: {
        org_id: safeOrgId,
        OR: [
          ...(safeUserId ? [{ user_id: safeUserId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

    if (!parent) return false;

    const link = await prisma.student_parents.findFirst({
      where: {
        parent_id: parent.parent_id,
        student_id: safeStudentId,
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
    const parent = await prisma.parents.findFirst({
      where: {
        org_id: safeOrgId,
        OR: [
          ...(safeUserId ? [{ user_id: safeUserId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

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
      const studentSelf = await prisma.students.findFirst({
        where: {
          org_id: safeOrgId,
          OR: [
            ...(safeUserId ? [{ user_id: safeUserId }] : []),
            ...(userEmail ? [{ admission_no: userEmail }] : []),
          ],
        },
      });

      if (studentSelf) {
        targetStudentIds = [studentSelf.student_id];
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
          take: 1,
        },
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
    });

    const children: ChildFeeOverview[] = [];

    for (const student of students) {
      const enrollment = student.student_enrollments[0] || null;
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
          currency: tx.currency_code,
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

      // Extract components
      if (activeAssignment?.fee_structures?.fee_components) {
        for (const comp of activeAssignment.fee_structures.fee_components) {
          componentsList.push({
            component_name: comp.component_name,
            component_code: comp.component_code,
            amount: Number(comp.amount),
            description: comp.description,
          });
        }
      }

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
        },
        summary: {
          total_assessed: totalAssessed,
          total_paid: totalPaid,
          outstanding_balance: outstandingBalance,
          balance: outstandingBalance,
          overdue_amount: totalOverdue,
          total_dues_count: duesList.length,
          unpaid_dues_count: duesList.filter((d) => d.outstanding_amount > 0).length,
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
}
