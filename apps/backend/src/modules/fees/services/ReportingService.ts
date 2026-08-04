import { supabase } from '../../../config/supabase';

export class ReportingService {

    // ──────────────────────────────────────────────────────
    // Collections Report
    // ──────────────────────────────────────────────────────
    public static async collectionsReport(params: {
        school_id: string;
        from: string;
        to: string;
    }) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select(`
                id, amount, payment_mode, created_at, status,
                application_id, student_id
            `)
            .eq('status', 'SUCCESS')
            .gte('created_at', `${params.from}T00:00:00.000Z`)
            .lte('created_at', `${params.to}T23:59:59.999Z`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const total = data?.reduce((s, t) => s + Number(t.amount), 0) || 0;
        return { data: data || [], total, from: params.from, to: params.to };
    }

    // ──────────────────────────────────────────────────────
    // Outstanding Fees Report
    // ──────────────────────────────────────────────────────
    public static async outstandingReport(params: { school_id: string }) {
        const { data, error } = await supabase
            .from('fee_demands')
            .select(`
                id, demand_no, amount, balance_amount, due_date, status,
                created_at, application_id, student_id,
                fee_structure:fee_structure_id(name)
            `)
            .eq('school_id', params.school_id)
            .in('status', ['PENDING', 'PARTIAL'])
            .order('due_date', { ascending: true });

        if (error) throw error;

        const total = data?.reduce((s, d) => s + Number(d.balance_amount), 0) || 0;
        return { data: data || [], total };
    }

    // ──────────────────────────────────────────────────────
    // Aging Report (days overdue buckets)
    // ──────────────────────────────────────────────────────
    public static async agingReport(params: { school_id: string }) {
        const today = new Date();
        const { data, error } = await supabase
            .from('fee_demands')
            .select('id, demand_no, balance_amount, due_date, application_id, student_id')
            .eq('school_id', params.school_id)
            .in('status', ['PENDING', 'PARTIAL'])
            .lt('due_date', today.toISOString().split('T')[0]);

        if (error) throw error;

        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
        const rows: any[] = [];

        for (const d of (data || [])) {
            const daysOverdue = Math.floor(
                (today.getTime() - new Date(d.due_date).getTime()) / 86400000
            );
            let bucket = '90+';
            if (daysOverdue <= 30) bucket = '0-30';
            else if (daysOverdue <= 60) bucket = '31-60';
            else if (daysOverdue <= 90) bucket = '61-90';

            (buckets as any)[bucket] += Number(d.balance_amount);
            rows.push({ ...d, days_overdue: daysOverdue, bucket });
        }

        return { data: rows, buckets };
    }

    // ──────────────────────────────────────────────────────
    // Cash Closing (today's cashier summary by mode)
    // ──────────────────────────────────────────────────────
    public static async cashClosingReport(params: { school_id: string; date: string }) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('amount, payment_mode, cashier_id')
            .eq('status', 'SUCCESS')
            .gte('created_at', `${params.date}T00:00:00.000Z`)
            .lte('created_at', `${params.date}T23:59:59.999Z`);

        if (error) throw error;

        const byMode: Record<string, number> = {};
        let grandTotal = 0;

        for (const t of (data || [])) {
            const mode = t.payment_mode || 'Unknown';
            byMode[mode] = (byMode[mode] || 0) + Number(t.amount);
            grandTotal += Number(t.amount);
        }

        return {
            date: params.date,
            grandTotal,
            byMode,
            transactionCount: data?.length || 0
        };
    }

    // ──────────────────────────────────────────────────────
    // Payment Mode Analysis
    // ──────────────────────────────────────────────────────
    public static async paymentModeReport(params: {
        school_id: string;
        from: string;
        to: string;
    }) {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('amount, payment_mode')
            .eq('status', 'SUCCESS')
            .gte('created_at', `${params.from}T00:00:00.000Z`)
            .lte('created_at', `${params.to}T23:59:59.999Z`);

        if (error) throw error;

        const modes: Record<string, { count: number; total: number }> = {};
        for (const t of (data || [])) {
            const m = t.payment_mode || 'Unknown';
            if (!modes[m]) modes[m] = { count: 0, total: 0 };
            modes[m].count++;
            modes[m].total += Number(t.amount);
        }

        return {
            data: Object.entries(modes).map(([mode, v]) => ({ mode, ...v })),
            from: params.from,
            to: params.to
        };
    }

    // ──────────────────────────────────────────────────────
    // Class Summary Report
    // ──────────────────────────────────────────────────────
    public static async classSummaryReport(params: { school_id: string }) {
        // Get all demands grouped by class via fee_structure → classes mapping
        const { data: demands, error } = await supabase
            .from('fee_demands')
            .select(`
                amount, balance_amount, status,
                fee_structure:fee_structure_id(
                    name,
                    classes:finance_fee_structure_classes(class:class_id(id, name))
                )
            `)
            .eq('school_id', params.school_id);

        if (error) throw error;

        const classMap: Record<string, { className: string; total: number; collected: number; outstanding: number }> = {};

        for (const d of (demands || [])) {
            const feeStruct = d.fee_structure as any;
            const classes = feeStruct?.classes || [];
            for (const c of classes) {
                const cls = c.class;
                if (!cls) continue;
                const key = cls.id;
                if (!classMap[key]) {
                    classMap[key] = { className: cls.name, total: 0, collected: 0, outstanding: 0 };
                }
                classMap[key].total += Number(d.amount);
                classMap[key].outstanding += Number(d.balance_amount);
                classMap[key].collected += Number(d.amount) - Number(d.balance_amount);
            }
        }

        return { data: Object.values(classMap) };
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

        const from = days[0];
        const to = days[days.length - 1];

        const { data, error } = await supabase
            .from('payment_transactions')
            .select('amount, created_at')
            .eq('status', 'SUCCESS')
            .gte('created_at', `${from}T00:00:00.000Z`)
            .lte('created_at', `${to}T23:59:59.999Z`);

        if (error) throw error;

        const byDay: Record<string, number> = {};
        for (const t of (data || [])) {
            const day = t.created_at.split('T')[0];
            byDay[day] = (byDay[day] || 0) + Number(t.amount);
        }

        return days.map(d => ({
            date: d,
            label: new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            amount: byDay[d] || 0
        }));
    }

    // ──────────────────────────────────────────────────────
    // Dashboard KPIs
    // ──────────────────────────────────────────────────────
    public static async dashboardKpis(params: { school_id: string }) {
        const todayStr = new Date().toISOString().split('T')[0];
        const monthStart = `${todayStr.substring(0, 7)}-01`;

        // Today Collection
        const { data: todayCollData, error: tcErr } = await supabase
            .from('payment_transactions')
            .select('amount')
            .eq('school_id', params.school_id)
            .eq('status', 'SUCCESS')
            .gte('created_at', `${todayStr}T00:00:00.000Z`)
            .lte('created_at', `${todayStr}T23:59:59.999Z`);

        if (tcErr) throw tcErr;
        const todayCollection = todayCollData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Month Collection
        const { data: monthCollData, error: mcErr } = await supabase
            .from('payment_transactions')
            .select('amount')
            .eq('school_id', params.school_id)
            .eq('status', 'SUCCESS')
            .gte('created_at', `${monthStart}T00:00:00.000Z`);

        if (mcErr) throw mcErr;
        const monthCollection = monthCollData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        // Demands statistics: total, outstanding, pendingCount, overdueAmount
        const { data: demandsData, error: demErr } = await supabase
            .from('fee_demands')
            .select('amount, balance_amount, status, due_date')
            .eq('school_id', params.school_id)
            .not('status', 'eq', 'CANCELLED');

        if (demErr) throw demErr;

        let totalBilled = 0;
        let totalOutstanding = 0;
        let pendingCount = 0;
        let overdueAmount = 0;

        const todayDate = new Date();
        todayDate.setHours(0,0,0,0);

        for (const d of (demandsData || [])) {
            totalBilled += Number(d.amount);
            
            if (d.status === 'PENDING' || d.status === 'PARTIAL' || d.status === 'OVERDUE') {
                totalOutstanding += Number(d.balance_amount);
                pendingCount++;

                const dueDate = new Date(d.due_date);
                dueDate.setHours(0,0,0,0);
                if (dueDate < todayDate) {
                    overdueAmount += Number(d.balance_amount);
                }
            }
        }

        const totalCollected = totalBilled - totalOutstanding;
        const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

        // Transactions today (Count)
        const { count: transactionsCount, error: txErr } = await supabase
            .from('payment_transactions')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', params.school_id)
            .gte('created_at', `${todayStr}T00:00:00.000Z`)
            .lte('created_at', `${todayStr}T23:59:59.999Z`);

        if (txErr) throw txErr;

        // Active structures count
        const { count: activeStructuresCount, error: structErr } = await supabase
            .from('finance_fee_structures')
            .select('id', { count: 'exact', head: true })
            .eq('school_id', params.school_id)
            .eq('is_active', true);

        if (structErr) throw structErr;

        return {
            todayCollection,
            monthCollection,
            collectionRate,
            totalOutstanding,
            pendingCount,
            overdueAmount,
            transactionsCount: transactionsCount || 0,
            activeStructuresCount: activeStructuresCount || 0
        };
    }
}
