import { Router } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { supabase } from '../../config/supabase';
import { FinanceEngine } from './services/FinanceEngine';
import { ReportingService } from './services/ReportingService';
import { SettingsService } from './services/SettingsService';
import { LedgerPostingService } from './services/LedgerPostingService';
import { FinanceController } from './controllers/FinanceController';

export const feesRouter = Router();

// ======================================
// 1. STRUCTURES (Builder CRUD)
// ======================================

// GET /structures: List active/published templates
feesRouter.get('/structures',
    checkPermission(PERMISSIONS.FEES_STRUCTURE_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const { data: structures, error } = await supabase
                .from('finance_fee_structures')
                .select(`
                    *,
                    academic_year:academic_years(year_label),
                    components:finance_fee_structure_components(*),
                    installments:finance_fee_installments(*),
                    classes:finance_fee_structure_classes(class:class_id(id, name))
                `)
                .eq('school_id', schoolId)
                .eq('is_active', true);

            if (error) throw error;
            res.json(structures || []);
        } catch (error: any) {
            console.error("GET /fees/structures error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// POST /structures: Create new template version
feesRouter.post('/structures',
    checkPermission(PERMISSIONS.FEES_SETUP),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const userId = req.context!.user.id;
            const { name, academic_year_id, effective_from, effective_to, classes, components, installments } = req.body;

            // 1. Fetch current max version for same name/school/year to increment
            const { data: existing } = await supabase
                .from('finance_fee_structures')
                .select('version')
                .eq('school_id', schoolId)
                .eq('academic_year_id', academic_year_id)
                .eq('name', name)
                .order('version', { ascending: false })
                .limit(1);

            const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

            // 2. Insert structure
            const { data: structure, error: structErr } = await supabase
                .from('finance_fee_structures')
                .insert({
                    school_id: schoolId,
                    academic_year_id,
                    name,
                    version: nextVersion,
                    effective_from,
                    effective_to,
                    is_active: true,
                    published_by: userId,
                    published_at: new Date().toISOString()
                })
                .select()
                .single();

            if (structErr || !structure) throw new Error(structErr?.message || "Failed to create structure");

            // 3. Insert class target mappings (M2M)
            if (classes && classes.length > 0) {
                const classMappings = classes.map((cId: string) => ({
                    fee_structure_id: structure.id,
                    class_id: cId
                }));
                const { error: m2mErr } = await supabase.from('finance_fee_structure_classes').insert(classMappings);
                if (m2mErr) throw m2mErr;
            }

            // 4. Insert components
            if (components && components.length > 0) {
                const compRows = components.map((comp: any, idx: number) => ({
                    fee_structure_id: structure.id,
                    name: comp.name,
                    category: comp.category,
                    amount: comp.amount,
                    display_order: comp.display_order ?? idx,
                    is_mandatory: comp.is_mandatory ?? true
                }));
                const { error: compErr } = await supabase.from('finance_fee_structure_components').insert(compRows);
                if (compErr) throw compErr;
            }

            // 5. Insert installments
            if (installments && installments.length > 0) {
                const instRows = installments.map((inst: any) => ({
                    fee_structure_id: structure.id,
                    term: inst.term,
                    due_date: inst.due_date,
                    percentage: inst.percentage || null,
                    fixed_amount: inst.fixed_amount || null
                }));
                const { error: instErr } = await supabase.from('finance_fee_installments').insert(instRows);
                if (instErr) throw instErr;
            }

            // Log Finance Audit Log
            await supabase.from('finance_audit_logs').insert({
                action: 'STRUCTURE_PUBLISHED',
                entity_type: 'finance_fee_structures',
                entity_id: structure.id,
                performed_by: userId,
                details: { name, version: nextVersion }
            });

            // Emit Event
            await FinanceEngine.publishEvents('FeeStructurePublished', {
                structure_id: structure.id,
                name,
                version: nextVersion
            });

            res.status(201).json(structure);
        } catch (error: any) {
            console.error("POST /fees/structures error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// DELETE /structures/:id: Archive template
feesRouter.delete('/structures/:id',
    checkPermission(PERMISSIONS.FEES_SETUP),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { error } = await supabase
                .from('finance_fee_structures')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            res.json({ message: "Archived structure successfully" });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET /application/:applicationId/preview: Get fee structures and components preview for an admission application
feesRouter.get('/application/:applicationId/preview',
    checkPermission(PERMISSIONS.ADMISSION_FEES_INITIALIZE),
    FinanceController.getFeePreview
);

// GET /demands: List billing demands
feesRouter.get('/demands',
    checkPermission(PERMISSIONS.FEES_DEMAND_VIEW),
    async (req, res) => {
        try {
            const { status, studentId, applicationId } = req.query;
            let query = supabase
                .from('fee_demands')
                .select(`
                    *,
                    student:student_id(full_name, student_code),
                    application:application_id(
                        id,
                        lead:lead_id(
                            enquiry:enquiry_id(student_name, grade_applied_for)
                        )
                    ),
                    items:fee_demand_items(*)
                `)
                .order('due_date', { ascending: false });

            if (status) query = query.eq('status', status);
            if (studentId) query = query.eq('student_id', studentId);
            if (applicationId) query = query.eq('application_id', applicationId);

            const { data, error } = await query;
            if (error) throw error;

            // Map data to match the expected frontend contract
            const mapped = (data || []).map((d: any) => {
                const enquiry = d.application?.lead?.enquiry;
                return {
                    ...d,
                    application: d.application ? {
                        id: d.application.id,
                        applicant_name: enquiry?.student_name || 'Applicant',
                        class_applied: enquiry?.grade_applied_for || ''
                    } : null
                };
            });

            res.json(mapped);
        } catch (error: any) {
            console.error("[DEBUG GET /demands error]:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// POST /demands/generate: Allocate billing structure demand (Supports bulk generation)
feesRouter.post('/demands/generate',
    checkPermission(PERMISSIONS.FEES_DEMAND_GENERATE),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const { application_id, student_id, student_ids, fee_structure_id, due_date } = req.body;

            // Support bulk generation by class student list
            if (student_ids && Array.isArray(student_ids) && student_ids.length > 0) {
                const results = [];
                for (const sId of student_ids) {
                    const demand = await FinanceEngine.initializeDemand({
                        student_id: sId,
                        fee_structure_id,
                        due_date,
                        performedBy: userId
                    });
                    results.push(demand);
                }
                return res.status(201).json(results);
            }

            const demand = await FinanceEngine.initializeDemand({
                application_id,
                student_id,
                fee_structure_id,
                due_date,
                performedBy: userId
            });
            res.status(201).json(demand);
        } catch (error: any) {
            console.error("POST /fees/demands/generate error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// ======================================
// 3. PAYMENTS COLLECTION
// ======================================

feesRouter.post('/payments',
    checkPermission(PERMISSIONS.PAYMENT_RECORD),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const {
                application_id, student_id, demand_id, amount,
                payment_mode, transaction_reference, bank_name,
                gateway_name, gateway_transaction_id, payment_channel
            } = req.body;

            const result = await FinanceEngine.collectPayment({
                application_id,
                student_id,
                demand_id,
                amount: Number(amount),
                payment_mode,
                transaction_reference,
                bank_name,
                gateway_name,
                gateway_transaction_id,
                payment_channel,
                cashierId: userId
            });

            res.status(201).json(result);
        } catch (error: any) {
            console.error("POST /fees/payments error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// ======================================
// 4. RECEIPTS
// ======================================

feesRouter.get('/receipts/:id',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const { id } = req.params;
            const receipt = await supabase
                .from('fee_receipts')
                .select(`
                    *,
                    payment_transaction:payment_transaction_id(
                        *,
                        student:student_id(full_name, student_code),
                        application:application_id(
                            id,
                            lead:lead_id(
                                enquiry:enquiry_id(student_name, grade_applied_for)
                            )
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (receipt.error) throw receipt.error;
            
            const data = receipt.data as any;
            if (data && data.payment_transaction?.application) {
                const enquiry = data.payment_transaction.application.lead?.enquiry;
                data.payment_transaction.application = {
                    id: data.payment_transaction.application.id,
                    applicant_name: enquiry?.student_name || 'Applicant',
                    class_applied: enquiry?.grade_applied_for || ''
                };
            }

            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.post('/receipts/:id/reprint',
    checkPermission(PERMISSIONS.FEES_RECEIPT_GENERATE),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const { id } = req.params;

            const { data: orig, error: origErr } = await supabase
                .from('fee_receipts')
                .select('payment_transaction_id, print_count')
                .eq('id', id)
                .single();

            if (origErr || !orig) throw new Error("Original receipt not found");

            // Increment original reprint counter
            await supabase
                .from('fee_receipts')
                .update({ print_count: (orig.print_count || 0) + 1 })
                .eq('id', id);

            // Create Duplicate Reprint entry
            const reprint = await FinanceEngine.generateReceipt({
                payment_transaction_id: orig.payment_transaction_id,
                receipt_type: 'REPRINT',
                generatedBy: userId
            });

            res.status(201).json(reprint);
        } catch (error: any) {
            console.error("POST /receipts/reprint error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// ======================================
// 5. LEDGER & BALANCES
// ======================================

// GET /ledger/student/:studentId: Running Ledger details
feesRouter.get('/ledger/student/:studentId',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const { studentId } = req.params;
            const balance = await FinanceEngine.calculateBalance({ student_id: studentId });
            const entries = await FinanceEngine.getLedgerHistory({ student_id: studentId });
            
            res.json({
                student_id: studentId,
                balance,
                entries,
                history: entries
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET /ledger/application/:applicationId
feesRouter.get('/ledger/application/:applicationId',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const { applicationId } = req.params;
            const balance = await FinanceEngine.calculateBalance({ application_id: applicationId });
            const entries = await FinanceEngine.getLedgerHistory({ application_id: applicationId });
            
            res.json({
                application_id: applicationId,
                balance,
                entries,
                history: entries
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// GET /ledger/admin/queue: Bulk pending ledger list
feesRouter.get('/admin/ledger',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const { search } = req.query;

            // Fetch Active students
            let stuQuery = supabase
                .from('students')
                .select(`
                    id, full_name, student_code,
                    sections:student_sections!inner(
                        section:section_id(name, class:class_id(name))
                    )
                `)
                .eq('school_id', schoolId)
                .eq('status', 'active');

            if (search) {
                stuQuery = stuQuery.or(`full_name.ilike.%${search}%,student_code.ilike.%${search}%`);
            }

            const { data: students, error: stuErr } = await stuQuery;
            if (stuErr) throw stuErr;

            const results = [];
            for (const s of (students || [])) {
                const balance = await FinanceEngine.calculateBalance({ student_id: s.id });
                const classData = (s.sections as any[])?.[0]?.section?.class;
                
                results.push({
                    student_id: s.id,
                    full_name: s.full_name,
                    student_code: s.student_code,
                    class_name: classData?.name || '-',
                    balance
                });
            }

            res.json({ data: results });
        } catch (error: any) {
            console.error("GET /ledger/admin/ledger error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// ======================================
// 6. DASHBOARD ANALYTICS (KPIs and Trends)
// ======================================

feesRouter.get('/dashboard/kpis',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const today = new Date().toISOString().split('T')[0];

            // 1. Today's collections
            const { data: todayTx } = await supabase
                .from('payment_transactions')
                .select('amount')
                .eq('status', 'SUCCESS')
                .gte('created_at', `${today}T00:00:00.000Z`);

            const todayCollection = todayTx?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // 2. Month collections
            const thisMonthStart = `${today.substring(0, 7)}-01T00:00:00.000Z`;
            const { data: monthTx } = await supabase
                .from('payment_transactions')
                .select('amount')
                .eq('status', 'SUCCESS')
                .gte('created_at', thisMonthStart);

            const monthCollection = monthTx?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // 3. Outstanding Balance (Sum of all ledger running balances)
            // Or sum of all fee_demands balance_amount which is much more performant!
            const { data: pendingDemands } = await supabase
                .from('fee_demands')
                .select('balance_amount, amount')
                .in('status', ['PENDING', 'PARTIAL']);

            const totalOutstanding = pendingDemands?.reduce((sum, d) => sum + Number(d.balance_amount), 0) || 0;
            const pendingCount = pendingDemands?.length || 0;

            // 4. Active Fee Structures template count
            const { count: activeStructures } = await supabase
                .from('finance_fee_structures')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', schoolId)
                .eq('is_active', true);

            // 5. Total Transactions
            const { count: txCount } = await supabase
                .from('payment_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'SUCCESS');

            res.json({
                todayCollection,
                monthCollection,
                totalOutstanding,
                pendingCount,
                activeStructuresCount: activeStructures || 0,
                transactionsCount: txCount || 0,
                collectionRate: 85 // Mock placeholder percentage
            });
        } catch (error: any) {
            console.error("GET /dashboard/kpis error:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// Backward compatibility helper `/my` (Parents Dashboard)
feesRouter.get('/my',
    checkPermission(PERMISSIONS.DASHBOARD_VIEW_PARENT),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const { data: links } = await supabase.from('student_parents').select('student_id').eq('parent_user_id', userId);
            if (!links || links.length === 0) return res.json([]);

            const results = [];
            for (const link of links) {
                const sid = link.student_id;
                const { data: student } = await supabase.from('students').select('full_name, student_code').eq('id', sid).single();
                const balance = await FinanceEngine.calculateBalance({ student_id: sid });
                const history = await FinanceEngine.getLedgerHistory({ student_id: sid });

                results.push({
                    student,
                    balance,
                    history
                });
            }
            res.json(results);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ======================================
// PHASE 2: NEW ENDPOINTS
// ======================================


// ──────────────────────────────────────
// DEMANDS — GET single demand detail
// ──────────────────────────────────────
feesRouter.get('/demands/:id',
    checkPermission(PERMISSIONS.FEES_DEMAND_VIEW),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('fee_demands')
                .select(`
                    *,
                    student:student_id(id, full_name, student_code),
                    application:application_id(
                        id,
                        lead:lead_id(
                            enquiry:enquiry_id(student_name, grade_applied_for)
                        )
                    ),
                    fee_structure:fee_structure_id(id, name, version, academic_year:academic_years(year_label)),
                    items:fee_demand_items(*),
                    transactions:payment_transactions(
                        id, amount, payment_mode, transaction_reference, status, created_at, cashier_id
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Demand not found' });
            
            const resData = data as any;
            if (resData.application) {
                const enquiry = resData.application.lead?.enquiry;
                resData.application = {
                    id: resData.application.id,
                    applicant_name: enquiry?.student_name || 'Applicant',
                    class_applied: enquiry?.grade_applied_for || ''
                };
            }

            res.json(resData);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// DEMANDS — Bulk generate (class/section/custom)
// ──────────────────────────────────────
feesRouter.post('/demands/bulk-generate',
    checkPermission(PERMISSIONS.FEES_DEMAND_GENERATE),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const schoolId = req.context!.user.school_id;
            const { mode, class_id, section_id, student_ids, fee_structure_id, due_date } = req.body;
            // mode: 'class' | 'section' | 'custom'

            if (!fee_structure_id || !due_date) {
                return res.status(400).json({ error: 'fee_structure_id and due_date are required' });
            }

            let targetStudentIds: string[] = [];

            if (mode === 'class' && class_id) {
                const { data: sections } = await supabase
                    .from('sections')
                    .select('id')
                    .eq('class_id', class_id);
                const sectionIds = sections?.map(s => s.id) || [];
                const { data: enrollments } = await supabase
                    .from('student_sections')
                    .select('student_id')
                    .in('section_id', sectionIds);
                targetStudentIds = enrollments?.map(e => e.student_id) || [];
            } else if (mode === 'section' && section_id) {
                const { data: enrollments } = await supabase
                    .from('student_sections')
                    .select('student_id')
                    .eq('section_id', section_id);
                targetStudentIds = enrollments?.map(e => e.student_id) || [];
            } else if (mode === 'custom' && student_ids?.length > 0) {
                targetStudentIds = student_ids;
            } else {
                return res.status(400).json({ error: 'Invalid bulk generation parameters' });
            }

            if (targetStudentIds.length === 0) {
                return res.status(400).json({ error: 'No students found for selection' });
            }

            // Check for existing demands to avoid duplicates
            const { data: existing } = await supabase
                .from('fee_demands')
                .select('student_id')
                .eq('fee_structure_id', fee_structure_id)
                .in('student_id', targetStudentIds)
                .not('status', 'eq', 'CANCELLED');

            const alreadyBilled = new Set(existing?.map(e => e.student_id) || []);
            const toGenerate = targetStudentIds.filter(id => !alreadyBilled.has(id));

            const results = [];
            const errors = [];
            for (const sid of toGenerate) {
                try {
                    const demand = await FinanceEngine.initializeDemand({
                        student_id: sid,
                        fee_structure_id,
                        due_date,
                        performedBy: userId
                    });
                    results.push(demand);
                } catch (err: any) {
                    errors.push({ student_id: sid, error: err.message });
                }
            }

            res.status(201).json({
                generated: results.length,
                skipped: alreadyBilled.size,
                errors: errors.length,
                details: results,
                errorDetails: errors
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// DEMANDS — Cancel demand
// ──────────────────────────────────────
feesRouter.patch('/demands/:id/cancel',
    checkPermission(PERMISSIONS.FEES_DEMAND_GENERATE),
    async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.context!.user.id;
            const { reason } = req.body;

            const { data: demand } = await supabase
                .from('fee_demands')
                .select('status, balance_amount')
                .eq('id', id)
                .single();

            if (!demand) return res.status(404).json({ error: 'Demand not found' });
            if (demand.status === 'PAID') return res.status(422).json({ error: 'Cannot cancel a fully paid demand' });

            const { error } = await supabase
                .from('fee_demands')
                .update({
                    status: 'CANCELLED',
                    cancel_reason: reason || 'Cancelled by finance officer',
                    cancelled_by: userId,
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Log audit
            await supabase.from('finance_audit_logs').insert({
                action: 'DEMAND_CANCELLED',
                entity_type: 'fee_demands',
                entity_id: id,
                performed_by: userId,
                details: { reason }
            });

            res.json({ success: true, message: 'Demand cancelled successfully' });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// WAIVERS — Apply waiver (posts WAIVER credit to ledger)
// ──────────────────────────────────────
feesRouter.post('/waivers',
    checkPermission(PERMISSIONS.FEES_WAIVER_APPROVE),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const schoolId = req.context!.user.school_id;
            const { demand_id, student_id, application_id, amount, reason } = req.body;

            if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid waiver amount' });

            // Update demand balance
            const { data: demand, error: dErr } = await supabase
                .from('fee_demands')
                .select('balance_amount')
                .eq('id', demand_id)
                .single();

            if (dErr || !demand) return res.status(404).json({ error: 'Demand not found' });

            const newBalance = Math.max(0, Number(demand.balance_amount) - Number(amount));
            await supabase.from('fee_demands').update({
                balance_amount: newBalance,
                status: newBalance === 0 ? 'PAID' : 'PARTIAL'
            }).eq('id', demand_id);

            // Post WAIVER credit to ledger
            await LedgerPostingService.postEntry({
                student_id: student_id || null,
                application_id: application_id || null,
                school_id: schoolId,
                transaction_type: 'WAIVER',
                debit: 0,
                credit: Number(amount),
                reference_type: 'WAIVER',
                reference_id: demand_id,
                description: reason || 'Fee waiver approved',
                performed_by: userId
            });

            // Audit log
            await supabase.from('finance_audit_logs').insert({
                action: 'WAIVER_APPLIED',
                entity_type: 'fee_demands',
                entity_id: demand_id,
                performed_by: userId,
                school_id: schoolId,
                details: { amount, reason }
            });

            res.json({ success: true, message: `Waiver of ₹${amount} applied`, new_balance: newBalance });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// REFUNDS — Process refund
// ──────────────────────────────────────
feesRouter.post('/refunds',
    checkPermission(PERMISSIONS.FEES_REFUND_PROCESS),
    async (req, res) => {
        try {
            const userId = req.context!.user.id;
            const schoolId = req.context!.user.school_id;
            const { student_id, application_id, transaction_id, amount, reason } = req.body;

            if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid refund amount' });

            // Mark original transaction as REFUNDED
            if (transaction_id) {
                await supabase.from('payment_transactions')
                    .update({ status: 'REFUNDED' })
                    .eq('id', transaction_id);
            }

            // Post REFUND debit to ledger (reverses the credit)
            await LedgerPostingService.postEntry({
                student_id: student_id || null,
                application_id: application_id || null,
                school_id: schoolId,
                transaction_type: 'REFUND',
                debit: Number(amount),
                credit: 0,
                reference_type: 'REFUND',
                reference_id: transaction_id || supabase.rpc('uuid_generate_v4') as any,
                description: reason || 'Refund processed',
                performed_by: userId
            });

            await supabase.from('finance_audit_logs').insert({
                action: 'REFUND_PROCESSED',
                entity_type: 'payment_transactions',
                entity_id: transaction_id,
                performed_by: userId,
                school_id: schoolId,
                details: { amount, reason }
            });

            res.json({ success: true, message: `Refund of ₹${amount} processed` });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// RECEIPTS — List with filters
// ──────────────────────────────────────
feesRouter.get('/receipts',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const { from, to, receipt_type, payment_mode, limit = 100, offset = 0 } = req.query;

            let query = supabase
                .from('fee_receipts')
                .select(`
                    *,
                    transaction:payment_transaction_id(
                        amount, payment_mode, transaction_reference, created_at, student_id, application_id,
                        cashier:users!cashier_id(email),
                        student:student_id(full_name, student_code),
                        application:application_id(
                            id,
                            lead:lead_id(
                                enquiry:enquiry_id(student_name, grade_applied_for)
                            )
                        )
                    )
                `)
                .order('created_at', { ascending: false })
                .range(Number(offset), Number(offset) + Number(limit) - 1);

            if (receipt_type) query = query.eq('receipt_type', receipt_type);
            if (from) query = query.gte('created_at', `${from}T00:00:00.000Z`);
            if (to) query = query.lte('created_at', `${to}T23:59:59.999Z`);

            const { data, error, count } = await query;
            if (error) throw error;

            // Filter by payment_mode post-fetch (nested field)
            const filtered = payment_mode
                ? (data || []).filter((r: any) => r.transaction?.payment_mode === payment_mode)
                : data || [];

            // Map data to match the expected frontend contract
            const mapped = (filtered || []).map((r: any) => {
                if (r.transaction?.application) {
                    const enquiry = r.transaction.application.lead?.enquiry;
                    r.transaction.application = {
                        id: r.transaction.application.id,
                        applicant_name: enquiry?.student_name || 'Applicant',
                        class_applied: enquiry?.grade_applied_for || ''
                    };
                }
                return r;
            });

            res.json({ data: mapped, total: count || mapped.length });
        } catch (error: any) {
            console.error("[DEBUG GET /receipts error]:", error);
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// DASHBOARD — KPIs
// ──────────────────────────────────────
feesRouter.get('/dashboard/kpis',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const kpis = await ReportingService.dashboardKpis({ school_id: schoolId });
            res.json(kpis);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// DASHBOARD — Collection Trend (30 days)
// ──────────────────────────────────────
feesRouter.get('/dashboard/collection-trend',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const trend = await ReportingService.collectionTrend({ school_id: schoolId });
            res.json(trend);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// DASHBOARD — Payment Mode Distribution
// ──────────────────────────────────────
feesRouter.get('/dashboard/payment-modes',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const today = new Date();
            const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            const result = await ReportingService.paymentModeReport({
                school_id: schoolId,
                from: monthStart,
                to: today.toISOString().split('T')[0]
            });
            res.json(result.data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// DASHBOARD — Outstanding by Class
// ──────────────────────────────────────
feesRouter.get('/dashboard/outstanding-by-class',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const result = await ReportingService.classSummaryReport({ school_id: schoolId });
            res.json(result.data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// REPORTS — Dedicated endpoints
// ──────────────────────────────────────

feesRouter.get('/reports/collections',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const today = new Date().toISOString().split('T')[0];
            const { from = today, to = today } = req.query;
            const result = await ReportingService.collectionsReport({ school_id: schoolId, from: from as string, to: to as string });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.get('/reports/outstanding',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const result = await ReportingService.outstandingReport({ school_id: schoolId });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.get('/reports/aging',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const result = await ReportingService.agingReport({ school_id: schoolId });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.get('/reports/cash-closing',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
            const result = await ReportingService.cashClosingReport({ school_id: schoolId, date });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.get('/reports/payment-mode',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const today = new Date().toISOString().split('T')[0];
            const monthStart = `${today.substring(0, 7)}-01`;
            const { from = monthStart, to = today } = req.query;
            const result = await ReportingService.paymentModeReport({ school_id: schoolId, from: from as string, to: to as string });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.get('/reports/class-summary',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const result = await ReportingService.classSummaryReport({ school_id: schoolId });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

// ──────────────────────────────────────
// SETTINGS — GET and PUT
// ──────────────────────────────────────

feesRouter.get('/settings',
    checkPermission(PERMISSIONS.FEES_VIEW),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const settings = await SettingsService.getSettings(schoolId);
            res.json(settings);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

feesRouter.put('/settings',
    checkPermission(PERMISSIONS.FEES_SETUP),
    async (req, res) => {
        try {
            const schoolId = req.context!.user.school_id;
            const userId = req.context!.user.id;
            const settings = await SettingsService.upsertSettings(schoolId, { ...req.body, updated_by: userId });
            res.json(settings);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
);

