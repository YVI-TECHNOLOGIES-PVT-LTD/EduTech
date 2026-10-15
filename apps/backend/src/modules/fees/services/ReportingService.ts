import prisma from '../../../lib/prismaClient';

export class ReportingService {
  // ──────────────────────────────────────────────────────
  // Collections Report
  // ──────────────────────────────────────────────────────
  public static async collectionsReport(params: { school_id: string; from: string; to: string }) {
    const fromDate = new Date(`${params.from}T00:00:00.000Z`);
    const toDate = new Date(`${params.to}T23:59:59.999Z`);

    const txs = await prisma.payment_transactions.findMany({
      where: {
        status: 'success',
        created_at: { gte: fromDate, lte: toDate },
        payment_orders: {
          students: { org_id: params.school_id },
        },
      },
      include: {
        payment_orders: {
          include: {
            students: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = txs.map((t) => ({
      id: t.payment_transaction_id,
      amount: Number(t.amount),
      payment_mode: t.payment_method,
      created_at: t.created_at,
      status: t.status,
      application_id: t.payment_orders?.students?.application_id,
      student_id: t.payment_orders?.student_id,
    }));

    const total = data.reduce((s, t) => s + t.amount, 0);
    return { data, total, from: params.from, to: params.to };
  }

  // ──────────────────────────────────────────────────────
  // Outstanding Fees Report
  // ──────────────────────────────────────────────────────
  public static async outstandingReport(params: { school_id: string }) {
    const dues = await prisma.student_charge_dues.findMany({
      where: {
        status: { in: ['pending', 'partially_paid', 'overdue'] },
        student_charges: {
          students: { org_id: params.school_id },
        },
      },
      include: {
        student_charges: {
          include: {
            students: true,
            fee_components: true,
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    const data = dues.map((d) => ({
      id: d.student_charge_due_id,
      demand_no: d.student_charge_due_id.substring(0, 8),
      amount: Number(d.amount_due),
      balance_amount: Number(d.amount_due),
      due_date: d.due_date,
      status: d.status,
      created_at: d.created_at,
      application_id: d.student_charges?.students?.application_id,
      student_id: d.student_charges?.student_id,
      fee_structure: {
        name:
          d.student_charges?.fee_components?.component_name ||
          d.student_charges?.description ||
          'General Fee',
      },
    }));

    const total = data.reduce((s, d) => s + d.balance_amount, 0);
    return { data, total };
  }

  // ──────────────────────────────────────────────────────
  // Aging Report (days overdue buckets)
  // ──────────────────────────────────────────────────────
  public static async agingReport(params: { school_id: string }) {
    const today = new Date();
    const dues = await prisma.student_charge_dues.findMany({
      where: {
        status: { in: ['pending', 'partially_paid', 'overdue'] },
        due_date: { lt: today },
        student_charges: {
          students: { org_id: params.school_id },
        },
      },
      include: {
        student_charges: {
          include: {
            students: true,
          },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const rows: any[] = [];

    for (const d of dues) {
      const daysOverdue = Math.floor((today.getTime() - new Date(d.due_date).getTime()) / 86400000);
      let bucket = '90+';
      if (daysOverdue <= 30) bucket = '0-30';
      else if (daysOverdue <= 60) bucket = '31-60';
      else if (daysOverdue <= 90) bucket = '61-90';

      const balance = Number(d.amount_due);
      (buckets as any)[bucket] += balance;
      rows.push({
        id: d.student_charge_due_id,
        demand_no: d.student_charge_due_id.substring(0, 8),
        balance_amount: balance,
        due_date: d.due_date,
        application_id: d.student_charges?.students?.application_id,
        student_id: d.student_charges?.student_id,
        days_overdue: daysOverdue,
        bucket,
      });
    }

    return { data: rows, buckets };
  }

  // ──────────────────────────────────────────────────────
  // Cash Closing (today's cashier summary by mode)
  // ──────────────────────────────────────────────────────
  public static async cashClosingReport(params: { school_id: string; date: string }) {
    const dayStart = new Date(`${params.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${params.date}T23:59:59.999Z`);

    const txs = await prisma.payment_transactions.findMany({
      where: {
        status: 'success',
        created_at: { gte: dayStart, lte: dayEnd },
        payment_orders: {
          students: { org_id: params.school_id },
        },
      },
      select: {
        amount: true,
        payment_method: true,
        created_by: true,
      },
    });

    const byMode: Record<string, number> = {};
    let grandTotal = 0;

    for (const t of txs) {
      const mode = t.payment_method ? t.payment_method.toUpperCase() : 'UNKNOWN';
      const amt = Number(t.amount);
      byMode[mode] = (byMode[mode] || 0) + amt;
      grandTotal += amt;
    }

    return {
      date: params.date,
      grandTotal,
      byMode,
      transactionCount: txs.length,
    };
  }

  // ──────────────────────────────────────────────────────
  // Payment Mode Analysis
  // ──────────────────────────────────────────────────────
  public static async paymentModeReport(params: { school_id: string; from: string; to: string }) {
    const fromDate = new Date(`${params.from}T00:00:00.000Z`);
    const toDate = new Date(`${params.to}T23:59:59.999Z`);

    const transactions = await prisma.payment_transactions.findMany({
      where: {
        status: 'success',
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
        payment_orders: {
          students: {
            org_id: params.school_id,
          },
        },
      },
      select: {
        amount: true,
        payment_method: true,
      },
    });

    const modes: Record<string, { count: number; total: number }> = {};
    for (const t of transactions) {
      const m = t.payment_method ? t.payment_method.toUpperCase() : 'UNKNOWN';
      if (!modes[m]) modes[m] = { count: 0, total: 0 };
      modes[m].count++;
      modes[m].total += Number(t.amount);
    }

    return {
      data: Object.entries(modes).map(([mode, v]) => ({ mode, ...v })),
      from: params.from,
      to: params.to,
    };
  }

  // ──────────────────────────────────────────────────────
  // Class Summary Report
  // ──────────────────────────────────────────────────────
  public static async classSummaryReport(params: { school_id: string }) {
    const grades = await prisma.grades.findMany({
      where: { org_id: params.school_id, is_active: true },
      include: {
        academic_year_grades: {
          include: {
            student_enrollments: {
              where: { status: 'active' },
              include: {
                student_fee_assignments: {
                  where: { status: 'active' },
                  include: {
                    student_charges: {
                      where: { status: 'active' },
                      include: {
                        student_charge_dues: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { display_order: 'asc' },
    });

    const classData = grades.map((g) => {
      let total = 0;
      let collected = 0;
      let outstanding = 0;

      for (const ayg of g.academic_year_grades) {
        for (const enr of ayg.student_enrollments) {
          for (const sfa of enr.student_fee_assignments) {
            for (const chg of sfa.student_charges) {
              for (const due of chg.student_charge_dues) {
                const amt = Number(due.amount_due);
                total += amt;
                if (due.status === 'paid') {
                  collected += amt;
                } else if (
                  due.status === 'pending' ||
                  due.status === 'partially_paid' ||
                  due.status === 'overdue'
                ) {
                  outstanding += amt;
                }
              }
            }
          }
        }
      }

      return {
        className: g.grade_name,
        total,
        collected,
        outstanding,
      };
    });

    return { data: classData };
  }

  // ──────────────────────────────────────────────────────
  // 30-day Collection Trend (for dashboard chart)
  // ──────────────────────────────────────────────────────
  public static async collectionTrend(params: { school_id: string }) {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const fromDate = new Date(`${days[0]}T00:00:00.000Z`);
    const toDate = new Date(`${days[days.length - 1]}T23:59:59.999Z`);

    const transactions = await prisma.payment_transactions.findMany({
      where: {
        status: 'success',
        created_at: {
          gte: fromDate,
          lte: toDate,
        },
        payment_orders: {
          students: {
            org_id: params.school_id,
          },
        },
      },
      select: {
        amount: true,
        created_at: true,
      },
    });

    const byDay: Record<string, number> = {};
    for (const t of transactions) {
      const day = t.created_at.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + Number(t.amount);
    }

    return days.map((d) => ({
      date: d,
      label: new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      amount: byDay[d] || 0,
    }));
  }

  // ──────────────────────────────────────────────────────
  // Dashboard KPIs
  // ──────────────────────────────────────────────────────
  public static async dashboardKpis(params: { school_id: string }) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999Z`);
    const monthStart = new Date(`${todayStr.substring(0, 7)}-01T00:00:00.000Z`);

    // Today Collection
    const todayTxs = await prisma.payment_transactions.findMany({
      where: {
        status: 'success',
        created_at: { gte: todayStart, lte: todayEnd },
        payment_orders: {
          students: { org_id: params.school_id },
        },
      },
      select: { amount: true },
    });
    const todayCollection = todayTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    // Month Collection
    const monthTxs = await prisma.payment_transactions.findMany({
      where: {
        status: 'success',
        created_at: { gte: monthStart },
        payment_orders: {
          students: { org_id: params.school_id },
        },
      },
      select: { amount: true },
    });
    const monthCollection = monthTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    // Dues statistics
    const dues = await prisma.student_charge_dues.findMany({
      where: {
        student_charges: {
          students: { org_id: params.school_id },
        },
      },
      select: {
        amount_due: true,
        due_date: true,
        status: true,
      },
    });

    let totalBilled = 0;
    let totalOutstanding = 0;
    let pendingCount = 0;
    let overdueAmount = 0;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (const d of dues) {
      const amt = Number(d.amount_due);
      if (d.status !== 'cancelled') {
        totalBilled += amt;
      }

      if (d.status === 'pending' || d.status === 'partially_paid' || d.status === 'overdue') {
        totalOutstanding += amt;
        pendingCount++;

        const dueDate = new Date(d.due_date);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < todayDate) {
          overdueAmount += amt;
        }
      }
    }

    const totalCollected = totalBilled - totalOutstanding;
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

    // Transactions today (count)
    const transactionsCount = await prisma.payment_transactions.count({
      where: {
        created_at: { gte: todayStart, lte: todayEnd },
        payment_orders: {
          students: { org_id: params.school_id },
        },
      },
    });

    // Active structures count
    let activeStructuresCount = 0;
    try {
      activeStructuresCount = await prisma.fee_structures.count({
        where: {
          status: 'published',
          academic_year_grades: {
            academic_years: {
              org_id: params.school_id,
            },
          },
        },
      });
    } catch (e) {
      console.warn('[ReportingService] Error counting fee structures:', e);
    }

    return {
      todayCollection,
      monthCollection,
      collectionRate,
      totalOutstanding,
      pendingCount,
      overdueAmount,
      transactionsCount,
      activeStructuresCount,
    };
  }
}
