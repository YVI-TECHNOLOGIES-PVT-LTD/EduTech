import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../context/AuthContext';
import {
  Printer,
  CreditCard,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  GraduationCap,
  Download,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';

export const MyFees: React.FC = () => {
  const { user } = useAuth();
  const [structures, setStructures] = useState<any[]>([]);
  const [childrenRecords, setChildrenRecords] = useState<any[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [yearRes, structRes, ledgRes] = await Promise.all([
        apiClient.get('/academic-years/current').catch(() => ({ data: null })),
        apiClient.get('/fees/structures').catch(() => ({ data: [] })),
        apiClient.get('/fees/my').catch(() => ({ data: [] })),
      ]);

      setActiveYear(yearRes.data);

      const structList = Array.isArray(structRes.data)
        ? structRes.data
        : structRes.data?.items || structRes.data?.structures || [];
      setStructures(structList);

      const rawLedger = ledgRes.data;
      const list = Array.isArray(rawLedger)
        ? rawLedger
        : rawLedger?.children || rawLedger?.data || [];
      setChildrenRecords(list);
    } catch (err: any) {
      console.error('[MyFees] Error loading fee records:', err);
      toast.error('Failed to load fee statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Fee_Statement_${user?.email || 'Student'}`,
  });

  const activeRecord = childrenRecords[selectedChildIndex] || childrenRecords[0] || null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading student financial ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 font-sans">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Parent Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400">Student Fee Ledger</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Official Fee Center & Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track student fee obligations, installment schedules, and confirmed payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Download Fee Statement</span>
          </button>
        </div>
      </div>

      {/* ── MULTI-CHILD SELECTION TABS ─────────────────────────────────── */}
      {childrenRecords.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {childrenRecords.map((c, idx) => {
            const isSelected = idx === selectedChildIndex;
            return (
              <button
                key={c.student_id || idx}
                onClick={() => setSelectedChildIndex(idx)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.full_name?.charAt(0) || 'S'}
                </div>
                <span>{c.full_name}</span>
                <span
                  className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}
                >
                  ({c.grade_name || 'Enrolled'})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── EMPTY STATE ───────────────────────────────────────────────── */}
      {childrenRecords.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Student Records Linked
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active student enrollments are currently associated with this authenticated parent
            account. If you recently enrolled, please contact the school front office.
          </p>
        </div>
      ) : activeRecord ? (
        <div className="space-y-8">
          {/* ── KPI METRICS CARDS ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Assessed */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Assessed Fees
              </span>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                ₹{Number(activeRecord.summary?.total_assessed || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {activeRecord.fee_structure_name || 'Annual Academic Structure'}
              </div>
            </div>

            {/* Total Paid */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Settled / Paid
              </span>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{Number(activeRecord.summary?.total_paid || 0).toLocaleString('en-IN')}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 font-semibold">
                Verified through financial ledger
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Outstanding
              </span>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                ₹
                {Number(
                  activeRecord.summary?.outstanding_balance ?? activeRecord.summary?.balance ?? 0,
                ).toLocaleString('en-IN')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Remaining payable balance</div>
            </div>

            {/* Status */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Overall Status
              </span>
              <div className="mt-2">
                {(activeRecord.summary?.outstanding_balance ??
                  activeRecord.summary?.balance ??
                  0) <= 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                  </span>
                ) : activeRecord.summary?.overdue_amount > 0 ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 w-fit">
                    <AlertCircle className="w-3.5 h-3.5" /> Overdue Dues
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 w-fit">
                    <Clock className="w-3.5 h-3.5" /> Pending Payment
                  </span>
                )}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Student ID:{' '}
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {activeRecord.admission_no || activeRecord.student?.student_code}
                </span>
              </div>
            </div>
          </div>

          {/* ── INSTALLMENT SCHEDULE & DUES BREAKDOWN ─────────────────────── */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Installment Dues Schedule
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Plan:{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {activeRecord.installment_plan_name || 'Standard Plan'}
                </strong>
              </span>
            </div>

            {!activeRecord.dues || activeRecord.dues.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No installment dues scheduled. Fees may not be assigned yet.
              </div>
            ) : (
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                    <tr>
                      <th className="py-3 px-4">Term Obligation</th>
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-right">Amount Due</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeRecord.dues.map((due: any) => (
                      <tr key={due.due_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {due.term_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {due.component_name}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-500">
                          {due.due_date ? new Date(due.due_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          ₹{Number(due.amount_due).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          ₹{Number(due.paid_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          ₹{Number(due.outstanding_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {due.outstanding_amount <= 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Paid
                            </span>
                          ) : due.is_overdue ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Overdue
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── COMPONENTS & PAYMENT HISTORY GRID ─────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Components Breakdown */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Assigned Fee Components</span>
              </h3>

              {!activeRecord.components || activeRecord.components.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No component records found.
                </div>
              ) : (
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {activeRecord.components.map((c: any, idx: number) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {c.component_name}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2 font-mono">
                          ({c.component_code})
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{Number(c.amount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Payment History */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Verified Payment Transactions</span>
              </h3>

              {!activeRecord.payment_history || activeRecord.payment_history.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic">
                  No payments recorded yet for this student.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeRecord.payment_history.map((p: any) => (
                    <div
                      key={p.transaction_id}
                      className="p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-900 dark:text-emerald-300">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Confirmed'}{' '}
                          via {p.payment_method?.toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.transaction_reference || 'DIRECT'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-0.5 justify-end">
                          <CheckCircle2 className="w-3 h-3" /> Settled
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── PRINTABLE HIDDEN SECTION ──────────────────────────────────── */}
      <div className="hidden">
        <div ref={printRef} className="p-8 space-y-6 text-black bg-white">
          <div className="text-center pb-4 border-b-2 border-black">
            <h1 className="text-xl font-bold uppercase">Official Student Fee Statement</h1>
            <p className="text-xs text-gray-600">
              EduTrack Institutional Financial Management System
            </p>
          </div>

          {activeRecord && (
            <>
              <div className="grid grid-cols-2 text-xs gap-2 pb-4 border-b border-gray-300">
                <div>
                  Student Name: <strong>{activeRecord.full_name}</strong>
                </div>
                <div>
                  Admission No: <strong>{activeRecord.admission_no}</strong>
                </div>
                <div>
                  Grade: <strong>{activeRecord.grade_name || '-'}</strong>
                </div>
                <div>
                  Academic Session: <strong>{activeRecord.academic_year_name || '-'}</strong>
                </div>
                <div>
                  Fee Schedule: <strong>{activeRecord.fee_structure_name || '-'}</strong>
                </div>
                <div>
                  Total Assessed:{' '}
                  <strong>₹{activeRecord.summary?.total_assessed?.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  Total Paid:{' '}
                  <strong>₹{activeRecord.summary?.total_paid?.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  Balance Due:{' '}
                  <strong>
                    ₹{activeRecord.summary?.outstanding_balance?.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase mb-2">Installment Dues Schedule</h3>
                <table className="w-full text-xs text-left border border-black">
                  <thead>
                    <tr className="border-b border-black bg-gray-100">
                      <th className="p-2">Term</th>
                      <th className="p-2">Component</th>
                      <th className="p-2">Due Date</th>
                      <th className="p-2 text-right">Amount Due</th>
                      <th className="p-2 text-right">Paid</th>
                      <th className="p-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeRecord.dues || []).map((d: any, i: number) => (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="p-2">{d.term_name}</td>
                        <td className="p-2">{d.component_name}</td>
                        <td className="p-2">{new Date(d.due_date).toLocaleDateString()}</td>
                        <td className="p-2 text-right">₹{d.amount_due}</td>
                        <td className="p-2 text-right">₹{d.paid_amount}</td>
                        <td className="p-2 text-right">₹{d.outstanding_amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFees;
