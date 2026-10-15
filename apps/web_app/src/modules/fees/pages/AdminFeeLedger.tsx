import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Search,
  User,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  RefreshCw,
  PlusCircle,
  FileText,
  BadgeAlert,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Check,
  X,
  Printer,
  ChevronDown,
  Info,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_CARD =
  'backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] rounded-3xl p-6 transition-all duration-300';

export interface StudentListItem {
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  status: string;
  enrollment: {
    enrollment_id: string;
    roll_number: string | null;
    status: string;
    academic_year_id: string | null;
    academic_year_name: string;
    grade_id: string | null;
    grade_name: string;
    section_id: string | null;
    section_name: string | null;
  } | null;
  assignment: {
    assignment_id: string;
    fee_structure_id: string;
    fee_structure_name: string;
    installment_plan_id: string;
    installment_plan_name: string;
    assigned_at: string;
    status: string;
  } | null;
}

export interface LedgerSummaryData {
  student: {
    student_id: string;
    admission_no: string;
    first_name: string;
    last_name: string;
    full_name: string;
    dob: string | null;
    gender: string | null;
    status: string;
    enrollment: {
      enrollment_id: string;
      roll_number: string | null;
      status: string;
      academic_year_id: string | null;
      academic_year_name: string;
      grade_id: string | null;
      grade_name: string;
      section_id: string | null;
      section_name: string | null;
    } | null;
  };
  summary: {
    currency: string;
    total_assigned_structure_amount: number;
    total_assessed_amount: number;
    total_paid_amount: number;
    total_transactions_amount: number;
    unallocated_payments_amount: number;
    outstanding_balance: number;
    overdue_balance: number;
    waived_charges_amount: number;
    concessions_count: number;
    has_assessed_charges: boolean;
    has_assigned_structure: boolean;
    reliability_notes: string[];
  };
}

export const AdminFeeLedger: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'EXAM_BRIDGE'>('LEDGER');
  const [detailTab, setDetailTab] = useState<'OVERVIEW' | 'ASSESSMENTS' | 'PAYMENTS' | 'DUES' | 'TIMELINE' | 'CONCESSIONS'>('OVERVIEW');
  const [studentConcessions, setStudentConcessions] = useState<any[]>([]);

  // Academic Years
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  // Search & Students
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);

  // Ledger Detail State
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerSummary, setLedgerSummary] = useState<LedgerSummaryData | null>(null);
  const [assessments, setAssessments] = useState<any | null>(null);
  const [payments, setPayments] = useState<any | null>(null);
  const [dues, setDues] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Assign Structure Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [eligibleData, setEligibleData] = useState<any | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Legacy Exam Bridge State
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [bridgeData, setBridgeData] = useState<Record<string, any>>({});

  // Currency Formatter
  const formatMoney = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Load Initial Metadata
  useEffect(() => {
    fetchInitialMetadata();
  }, []);

  const fetchInitialMetadata = async () => {
    try {
      const [yearRes, clsRes] = await Promise.all([
        apiClient.get('/academic-years').catch(() => ({ data: [] })),
        apiClient.get('/academic/classes').catch(() => ({ data: [] })),
      ]);

      const years = Array.isArray(yearRes.data) ? yearRes.data : yearRes.data?.data || [];
      setAcademicYears(years);
      if (years.length > 0) {
        setSelectedYearId(years[0].academic_year_id || years[0].id || '');
      }

      setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  // 2. Fetch Students List
  const fetchStudents = useCallback(async (query = '', yearId = selectedYearId) => {
    setSearching(true);
    try {
      const res = await apiClient.get('/fees/ledger/students', {
        params: {
          query: query || undefined,
          academicYearId: yearId || undefined,
          limit: 30,
        },
      });

      const list: StudentListItem[] = res.data?.data || [];
      setStudents(list);

      // Auto-select first student if none selected
      if (!selectedStudent && list.length > 0) {
        loadStudentLedger(list[0]);
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
      toast.error('Failed to search students');
    } finally {
      setSearching(false);
    }
  }, [selectedYearId, selectedStudent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(searchQuery, selectedYearId);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedYearId, fetchStudents]);

  // 3. Load Full Ledger for a Selected Student
  const loadStudentLedger = async (student: StudentListItem) => {
    setSelectedStudent(student);
    setLoadingLedger(true);
    try {
      const [sumRes, assRes, payRes, duesRes, txRes, concRes] = await Promise.all([
        apiClient.get(`/fees/ledger/students/${student.student_id}`, {
          params: { academicYearId: selectedYearId || undefined },
        }),
        apiClient.get(`/fees/ledger/students/${student.student_id}/assessments`),
        apiClient.get(`/fees/ledger/students/${student.student_id}/payments`),
        apiClient.get(`/fees/ledger/students/${student.student_id}/dues`),
        apiClient.get(`/fees/ledger/students/${student.student_id}/transactions`),
        apiClient.get(`/fees/scholarships/student/${student.student_id}`).catch(() => ({ data: { data: [] } })),
      ]);

      setLedgerSummary(sumRes.data?.data || null);
      setAssessments(assRes.data?.data || null);
      setPayments(payRes.data?.data || null);
      setDues(duesRes.data?.data || []);
      setTransactions(txRes.data?.data || []);
      setStudentConcessions(concRes.data?.data || []);
    } catch (err: any) {
      console.error('Error loading student ledger:', err);
      toast.error('Failed to load student ledger details');
    } finally {
      setLoadingLedger(false);
    }
  };

  // 4. Open Assign Structure Modal
  const handleOpenAssignModal = async () => {
    if (!selectedStudent) return;
    try {
      const res = await apiClient.get(
        `/fees/ledger/students/${selectedStudent.student_id}/eligible-structures`
      );
      setEligibleData(res.data?.data || null);
      const structs = res.data?.data?.structures || [];
      const plans = res.data?.data?.installment_plans || [];
      if (structs.length > 0) setSelectedStructureId(structs[0].fee_structure_id);
      if (plans.length > 0) setSelectedPlanId(plans[0].installment_plan_id);
      setShowAssignModal(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch eligible fee structures');
    }
  };

  // 5. Submit Structure Assignment
  const handleAssignStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedStructureId) {
      toast.error('Please select a fee structure');
      return;
    }

    setAssigning(true);
    try {
      await apiClient.post('/fees/ledger/assignments', {
        studentId: selectedStudent.student_id,
        enrollmentId: selectedStudent.enrollment?.enrollment_id,
        feeStructureId: selectedStructureId,
        installmentPlanId: selectedPlanId || undefined,
        notes: assignmentNotes || undefined,
      });

      toast.success('Fee structure assigned successfully!');
      setShowAssignModal(false);
      setAssignmentNotes('');
      // Refresh current student ledger
      if (selectedStudent) {
        await fetchStudents(searchQuery, selectedYearId);
        await loadStudentLedger(selectedStudent);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign fee structure');
    } finally {
      setAssigning(false);
    }
  };

  // 6. CSV Statement Export
  const handleExportCSV = () => {
    if (!selectedStudent || !ledgerSummary) {
      toast.error('No student ledger selected to export');
      return;
    }

    const rows = [
      ['EduTrack ERP - Student Fee Ledger Statement'],
      ['Generated At', new Date().toISOString()],
      ['Student Name', selectedStudent.full_name],
      ['Admission Number', selectedStudent.admission_no],
      ['Grade / Class', selectedStudent.enrollment?.grade_name || 'N/A'],
      ['Roll Number', selectedStudent.enrollment?.roll_number || 'N/A'],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Assigned Structure Amount', ledgerSummary.summary.total_assigned_structure_amount],
      ['Total Assessed Charges', ledgerSummary.summary.total_assessed_amount],
      ['Total Paid & Allocated', ledgerSummary.summary.total_paid_amount],
      ['Outstanding Balance', ledgerSummary.summary.outstanding_balance],
      ['Overdue Balance', ledgerSummary.summary.overdue_balance],
      ['Unallocated Payments', ledgerSummary.summary.unallocated_payments_amount],
      [''],
      ['TRANSACTION & LEDGER HISTORY'],
      ['Date', 'Type', 'Reference', 'Description', 'Debit (INR)', 'Credit (INR)', 'Status'],
    ];

    transactions.forEach((tx) => {
      rows.push([
        new Date(tx.timestamp).toLocaleDateString(),
        tx.type,
        tx.reference || '',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.debit_amount || 0,
        tx.credit_amount || 0,
        tx.status || '',
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ledger_${selectedStudent.admission_no}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ledger statement CSV exported successfully');
  };

  // Legacy Exam Bridge Fetch
  useEffect(() => {
    if (!selectedClass || !selectedYearId) return;
    apiClient
      .get(`/exams/admin/bridge/${selectedClass}/status?academicYearId=${selectedYearId}`)
      .then((res) => {
        const map: Record<string, any> = {};
        (res.data || []).forEach((s: any) => (map[s.id] = s));
        setBridgeData(map);
      })
      .catch(() => {});
  }, [selectedClass, selectedYearId]);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 text-slate-800 dark:text-slate-100">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <span>Finance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Student Fee Ledger</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Student Fee Ledger
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Tenant-scoped student accounts, fee assessments, verified payment allocations, and obligations.
          </p>
        </div>

        {/* Global Controls & Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Year Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
            >
              {academicYears.map((y) => (
                <option key={y.academic_year_id || y.id} value={y.academic_year_id || y.id} className="dark:bg-slate-800">
                  {y.academic_year_name || y.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-2xl border border-slate-300/60 dark:border-white/10">
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'LEDGER'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ledger Account
            </button>
            <button
              onClick={() => setActiveTab('EXAM_BRIDGE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'EXAM_BRIDGE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Exam Clearance Bridge
            </button>
          </div>

          <button
            onClick={() => {
              fetchStudents(searchQuery, selectedYearId);
              if (selectedStudent) loadStudentLedger(selectedStudent);
            }}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${searching || loadingLedger ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'LEDGER' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT SIDEBAR: STUDENT SEARCH & ROSTER (4 cols)           */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className={`${GLASS_CARD} space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Student Lookup
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {students.length} found
                </span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or admission no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Students List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {searching ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Searching student accounts...
                  </div>
                ) : students.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-dashed border-slate-200 dark:border-white/5">
                    No students match your query in this academic year.
                  </div>
                ) : (
                  students.map((stu) => {
                    const isSelected = selectedStudent?.student_id === stu.student_id;
                    const hasAssignment = !!stu.assignment;
                    return (
                      <button
                        key={stu.student_id}
                        onClick={() => loadStudentLedger(stu)}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-500/15 dark:border-emerald-500/50 shadow-sm'
                            : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {stu.first_name[0]}
                            {stu.last_name ? stu.last_name[0] : ''}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {stu.full_name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Adm: {stu.admission_no}</span>
                              {stu.enrollment?.grade_name && (
                                <>
                                  <span>•</span>
                                  <span>{stu.enrollment.grade_name}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          {hasAssignment ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                              <Check className="w-2.5 h-2.5" /> Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                              Unassigned
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT MAIN WORKSPACE: SELECTED STUDENT LEDGER (8 cols)   */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {selectedStudent && ledgerSummary ? (
              <>
                {/* 1. Student Identity Header Card */}
                <div className={`${GLASS_CARD} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-500/20 shrink-0">
                      {selectedStudent.first_name[0]}
                      {selectedStudent.last_name ? selectedStudent.last_name[0] : ''}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                          {selectedStudent.full_name}
                        </h2>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {selectedStudent.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        <span>Admission No: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.admission_no}</strong></span>
                        <span>•</span>
                        <span>Class: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.enrollment?.grade_name || 'Not Enrolled'}</strong></span>
                        {selectedStudent.enrollment?.section_name && (
                          <>
                            <span>•</span>
                            <span>Section: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.enrollment.section_name}</strong></span>
                          </>
                        )}
                        {selectedStudent.enrollment?.roll_number && (
                          <>
                            <span>•</span>
                            <span>Roll: <strong className="text-slate-800 dark:text-slate-200">{selectedStudent.enrollment.roll_number}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Assign structure & CSV export */}
                  <div className="flex items-center gap-3 shrink-0">
                    {!ledgerSummary.summary.has_assigned_structure && (
                      <button
                        onClick={handleOpenAssignModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Assign Structure
                      </button>
                    )}
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition-all"
                      title="Export Statement as CSV"
                    >
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Export Statement
                    </button>
                  </div>
                </div>

                {/* 2. Reliability Notice Alert (if applicable) */}
                {ledgerSummary.summary.reliability_notes.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium space-y-1">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                      <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Financial Record Status & Notices
                    </div>
                    {ledgerSummary.summary.reliability_notes.map((note, idx) => (
                      <p key={idx} className="pl-6 text-slate-700 dark:text-slate-300">
                        • {note}
                      </p>
                    ))}
                  </div>
                )}

                {/* 3. Ledger Summary KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Assessed Obligations */}
                  <div className="p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Assessed Billed
                    </span>
                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                      {formatMoney(ledgerSummary.summary.total_assessed_amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Assigned: {formatMoney(ledgerSummary.summary.total_assigned_structure_amount)}
                    </p>
                  </div>

                  {/* Paid & Allocated */}
                  <div className="p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Paid & Allocated
                    </span>
                    <p className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatMoney(ledgerSummary.summary.total_paid_amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Total Tx: {formatMoney(ledgerSummary.summary.total_transactions_amount)}
                    </p>
                  </div>

                  {/* Outstanding Balance */}
                  <div className={`p-5 rounded-3xl border shadow-sm space-y-1 ${
                    ledgerSummary.summary.outstanding_balance > 0
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/30'
                      : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-white/10'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      ledgerSummary.summary.outstanding_balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                    }`}>
                      Outstanding Balance
                    </span>
                    <p className={`text-xl md:text-2xl font-black ${
                      ledgerSummary.summary.outstanding_balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {formatMoney(ledgerSummary.summary.outstanding_balance)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {ledgerSummary.summary.has_assessed_charges ? 'Billed Payable' : 'Unbilled Obligation'}
                    </p>
                  </div>

                  {/* Overdue Balance */}
                  <div className={`p-5 rounded-3xl border shadow-sm space-y-1 ${
                    ledgerSummary.summary.overdue_balance > 0
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-white/10'
                  }`}>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Overdue Dues
                    </span>
                    <p className={`text-xl md:text-2xl font-black ${
                      ledgerSummary.summary.overdue_balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {formatMoney(ledgerSummary.summary.overdue_balance)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Past due date
                    </p>
                  </div>
                </div>

                {/* 4. Tab Navigation for Ledger Details */}
                <div className="flex border-b border-slate-200 dark:border-white/10 space-x-6 text-xs font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setDetailTab('OVERVIEW')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                      detailTab === 'OVERVIEW'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Overview
                  </button>

                  <button
                    onClick={() => setDetailTab('ASSESSMENTS')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                      detailTab === 'ASSESSMENTS'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Fee Assessments ({assessments?.charges?.length || 0})
                  </button>

                  <button
                    onClick={() => setDetailTab('PAYMENTS')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                      detailTab === 'PAYMENTS'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Payments ({payments?.transactions?.length || 0})
                  </button>

                  <button
                    onClick={() => setDetailTab('DUES')}
                    className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                      detailTab === 'DUES'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Scheduled Dues ({dues.length})
                  </button>

                    <button
                      onClick={() => setDetailTab('TIMELINE')}
                      className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                        detailTab === 'TIMELINE'
                          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Timeline ({transactions.length})
                    </button>

                    <button
                      onClick={() => setDetailTab('CONCESSIONS')}
                      className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
                        detailTab === 'CONCESSIONS'
                          ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Concessions & Scholarships ({studentConcessions.length})
                    </button>
                  </div>

                {/* 5. Detail Tab Content */}
                {detailTab === 'OVERVIEW' && (
                  <div className="space-y-6">
                    {/* Assigned Fee Structure Card */}
                    <div className={`${GLASS_CARD} space-y-4`}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-emerald-600" />
                          Applicable Fee Structure
                        </h4>
                        {assessments?.assigned_structure ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                            Active Assignment
                          </span>
                        ) : (
                          <button
                            onClick={handleOpenAssignModal}
                            className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                          >
                            + Assign Published Structure
                          </button>
                        )}
                      </div>

                      {assessments?.assigned_structure ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Assigned Structure Name
                            </span>
                            <p className="text-base font-black text-slate-900 dark:text-white">
                              {assessments.assigned_structure.fee_structure.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Annual Total: <strong className="text-emerald-600">{formatMoney(assessments.assigned_structure.fee_structure.total_amount)}</strong>
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Assigned Installment Plan
                            </span>
                            <p className="text-base font-black text-slate-900 dark:text-white">
                              {assessments.assigned_structure.installment_plan?.plan_name || 'Standard Single Payment'}
                            </p>
                            <p className="text-xs text-slate-500">
                              Terms: {assessments.assigned_structure.installment_plan?.terms?.length || 1} installments
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 space-y-2">
                          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            No Published Fee Structure Assigned
                          </p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            This student enrollment does not have an active fee structure assigned yet. You can assign a published fee structure configured for Grade {selectedStudent.enrollment?.grade_name}.
                          </p>
                          <button
                            onClick={handleOpenAssignModal}
                            className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                          >
                            Assign Fee Structure Now
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Student Profile Quick Facts */}
                    <div className={`${GLASS_CARD} space-y-4`}>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        Enrollment & Academic Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 font-semibold">Academic Year</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {selectedStudent.enrollment?.academic_year_name || 'N/A'}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 font-semibold">Grade / Stage</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {selectedStudent.enrollment?.grade_name || 'N/A'}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 font-semibold">Section & Roll</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {selectedStudent.enrollment?.section_name || 'N/A'} (Roll #{selectedStudent.enrollment?.roll_number || 'N/A'})
                          </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 font-semibold">Date of Birth / Gender</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                            {selectedStudent.dob || 'N/A'} ({selectedStudent.gender || 'N/A'})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ASSESSMENTS & CHARGES */}
                {detailTab === 'ASSESSMENTS' && (
                  <div className="space-y-6">
                    {/* Structure Component Breakdown */}
                    {assessments?.assigned_structure?.fee_structure?.components && (
                      <div className={`${GLASS_CARD} space-y-4`}>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
                          <span>Structure Components Breakdown</span>
                          <span className="text-xs font-bold text-emerald-600">
                            Total: {formatMoney(assessments.assigned_structure.fee_structure.total_amount)}
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {assessments.assigned_structure.fee_structure.components.map((comp: any) => (
                            <div key={comp.component_id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{comp.component_name}</p>
                                <span className="text-[10px] text-slate-400">{comp.component_code}</span>
                              </div>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {formatMoney(comp.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Billed Charges */}
                    <div className={`${GLASS_CARD} space-y-4`}>
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Billed Financial Obligations (Charges)
                      </h4>
                      {assessments?.charges?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          No billed charges posted yet for this student.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                              <tr>
                                <th className="pb-3">Description</th>
                                <th className="pb-3">Component</th>
                                <th className="pb-3">Charge Date</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Paid</th>
                                <th className="pb-3">Balance</th>
                                <th className="pb-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                              {assessments.charges.map((chg: any) => (
                                <tr key={chg.charge_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                                    {chg.description}
                                  </td>
                                  <td className="py-3 text-slate-500">{chg.component_name}</td>
                                  <td className="py-3 text-slate-500">{chg.charge_date}</td>
                                  <td className="py-3 font-bold text-slate-900 dark:text-white">{formatMoney(chg.amount)}</td>
                                  <td className="py-3 font-bold text-emerald-600">{formatMoney(chg.paid_amount)}</td>
                                  <td className="py-3 font-bold text-rose-600">{formatMoney(chg.balance_amount)}</td>
                                  <td className="py-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      chg.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {chg.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: PAYMENTS & ALLOCATIONS */}
                {detailTab === 'PAYMENTS' && (
                  <div className={`${GLASS_CARD} space-y-4`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Recorded Payment Transactions
                      </h4>
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-3">
                        <span>Total Paid: <strong className="text-emerald-600">{formatMoney(payments?.total_paid)}</strong></span>
                        {payments?.unallocated > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Unallocated: {formatMoney(payments.unallocated)}
                          </span>
                        )}
                      </div>
                    </div>

                    {payments?.transactions?.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No payment transactions recorded for this student account.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                            <tr>
                              <th className="pb-3">Date</th>
                              <th className="pb-3">Order / Tx Ref</th>
                              <th className="pb-3">Method</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Amount</th>
                              <th className="pb-3">Allocated</th>
                              <th className="pb-3">Unallocated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {payments.transactions.map((tx: any) => (
                              <tr key={tx.payment_transaction_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-3 text-slate-500">
                                  {new Date(tx.transaction_date).toLocaleDateString()}
                                </td>
                                <td className="py-3 font-bold text-slate-800 dark:text-slate-200">
                                  {tx.gateway_transaction_id || tx.order_reference}
                                </td>
                                <td className="py-3 uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                                  {tx.payment_method}
                                </td>
                                <td className="py-3">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    tx.status === 'success'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                      : tx.status === 'pending'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  }`}>
                                    {tx.status}
                                  </span>
                                </td>
                                <td className="py-3 font-bold text-slate-900 dark:text-white">
                                  {formatMoney(tx.amount)}
                                </td>
                                <td className="py-3 font-bold text-emerald-600">
                                  {formatMoney(tx.allocated_amount)}
                                </td>
                                <td className="py-3 font-bold text-slate-500">
                                  {formatMoney(tx.unallocated_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: SCHEDULED DUES & OVERDUE */}
                {detailTab === 'DUES' && (
                  <div className={`${GLASS_CARD} space-y-4`}>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Scheduled Installment Dues & Obligations
                    </h4>
                    {dues.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No scheduled installment dues found for this student.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                            <tr>
                              <th className="pb-3">Due Date</th>
                              <th className="pb-3">Obligation / Component</th>
                              <th className="pb-3">Term</th>
                              <th className="pb-3">Amount Due</th>
                              <th className="pb-3">Paid</th>
                              <th className="pb-3">Outstanding</th>
                              <th className="pb-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {dues.map((d: any) => (
                              <tr key={d.due_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-3 text-slate-800 dark:text-slate-200 font-bold">
                                  {d.due_date}
                                </td>
                                <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                                  {d.charge_description}
                                </td>
                                <td className="py-3 text-slate-500">{d.term_name}</td>
                                <td className="py-3 font-bold text-slate-900 dark:text-white">{formatMoney(d.amount_due)}</td>
                                <td className="py-3 font-bold text-emerald-600">{formatMoney(d.paid_amount)}</td>
                                <td className={`py-3 font-bold ${d.outstanding_amount > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                  {formatMoney(d.outstanding_amount)}
                                </td>
                                <td className="py-3">
                                  {d.is_overdue ? (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                      Overdue
                                    </span>
                                  ) : d.status === 'paid' ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {d.status}
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
                )}

                {/* TAB 5: TIMELINE */}
                {detailTab === 'TIMELINE' && (
                  <div className={`${GLASS_CARD} space-y-4`}>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Unified Financial Event Timeline
                    </h4>
                    {transactions.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No financial events recorded yet for this student.
                      </div>
                    ) : (
                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                        {transactions.map((evt: any) => (
                          <div key={evt.event_id} className="relative flex items-start gap-4">
                            <div className={`w-5 h-5 rounded-full -ml-6 border-2 flex items-center justify-center shrink-0 ${
                              evt.category === 'CREDIT'
                                ? 'bg-emerald-500 border-white text-white'
                                : evt.category === 'DEBIT'
                                ? 'bg-rose-500 border-white text-white'
                                : 'bg-slate-400 border-white text-white'
                            }`} />
                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {new Date(evt.timestamp).toLocaleString()} • {evt.type}
                                </span>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                                  {evt.description}
                                </p>
                              </div>
                              <div className="text-right">
                                {evt.credit_amount > 0 && (
                                  <span className="text-xs font-black text-emerald-600">
                                    +{formatMoney(evt.credit_amount)}
                                  </span>
                                )}
                                {evt.debit_amount > 0 && (
                                  <span className="text-xs font-black text-rose-600">
                                    -{formatMoney(evt.debit_amount)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 6: SCHOLARSHIPS & CONCESSIONS */}
                {detailTab === 'CONCESSIONS' && (
                  <div className={`${GLASS_CARD} space-y-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          Scholarships, Concessions & Waivers
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Financial relief awards, merit scholarships, and fee waivers applied to student dues.
                        </p>
                      </div>
                      <a
                        href="/app/finance/scholarships"
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Scholarship Desk
                      </a>
                    </div>

                    {studentConcessions.length === 0 ? (
                      <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 space-y-3">
                        <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          No Scholarships or Concessions Recorded
                        </p>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          This student has no awarded or applied concessions in the current database. To grant merit, sports, sibling, or need-based aid, submit a recommendation in the Scholarship Desk.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-white/10">
                            <tr>
                              <th className="pb-3">Concession / Award</th>
                              <th className="pb-3">Type</th>
                              <th className="pb-3">Award %</th>
                              <th className="pb-3">Scope</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3">Recommended By</th>
                              <th className="pb-3">Approved By</th>
                              <th className="pb-3">Applied Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {studentConcessions.map((c: any) => (
                              <tr key={c.scholarship_concession_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                <td className="py-3">
                                  <div className="font-bold text-slate-900 dark:text-white">
                                    {c.concession_name}
                                  </div>
                                  {c.recommendation_reason && (
                                    <span className="text-[10px] text-slate-400 italic">
                                      {c.recommendation_reason}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    {c.scholarship_type}
                                  </span>
                                </td>
                                <td className="py-3 font-black text-emerald-600 text-sm">
                                  {c.approved_percentage || c.concession_percentage}%
                                </td>
                                <td className="py-3 text-slate-600 dark:text-slate-400 capitalize">
                                  {c.scope?.replace('_', ' ')}
                                </td>
                                <td className="py-3">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    c.status === 'applied'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                      : c.status === 'approved'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                                      : c.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-600 dark:text-slate-400">
                                  {c.recommended_by ? c.recommended_by.slice(0, 8) : 'System'}
                                </td>
                                <td className="py-3 text-slate-600 dark:text-slate-400">
                                  {c.approved_by ? c.approved_by.slice(0, 8) : '—'}
                                </td>
                                <td className="py-3 text-slate-500">
                                  {c.applied_at ? new Date(c.applied_at).toLocaleDateString() : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className={`${GLASS_CARD} py-20 text-center text-slate-400 space-y-3`}>
                <User className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                  Select a Student
                </h3>
                <p className="text-xs max-w-sm mx-auto">
                  Search and select a student from the directory on the left to view their complete financial ledger, fee structures, and payment history.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Legacy Exam Bridge Tab */
        <div className={`${GLASS_CARD} space-y-6`}>
          <div>
            <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white">
              Exam Clearance & Financial Bridge
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cross-module validation between Student Fee Ledgers and Examination Eligibility.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold"
            >
              <option value="">Select Class to Audit...</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-xs text-slate-500">
              Exam bridge records loaded for selected class. Financial clearance rules are derived directly from the verified ledger balances.
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASSIGN PUBLISHED FEE STRUCTURE                     */}
      {/* ======================================================== */}
      {showAssignModal && eligibleData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Assign Fee Structure
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a published fee structure for {selectedStudent?.full_name} ({eligibleData.enrollment?.grade_name})
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignStructure} className="space-y-4">
              {/* Fee Structure Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Published Fee Structure *
                </label>
                {eligibleData.structures.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                    No published fee structures found for {eligibleData.enrollment?.grade_name}. Please publish a fee structure first in Fee Structure Management.
                  </p>
                ) : (
                  <select
                    value={selectedStructureId}
                    onChange={(e) => setSelectedStructureId(e.target.value)}
                    required
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold outline-none"
                  >
                    {eligibleData.structures.map((s: any) => (
                      <option key={s.fee_structure_id} value={s.fee_structure_id}>
                        {s.name} — {formatMoney(s.total_amount)} ({s.components_count} components)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Installment Plan Dropdown */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Installment Plan
                </label>
                {eligibleData.installment_plans.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No published installment plans found. Standard single payment will apply.
                  </p>
                ) : (
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold outline-none"
                  >
                    <option value="">Default Single Payment</option>
                    {eligibleData.installment_plans.map((p: any) => (
                      <option key={p.installment_plan_id} value={p.installment_plan_id}>
                        {p.plan_name} ({p.terms_count} terms)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Standard academic year fee assignment..."
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || eligibleData.structures.length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-md"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminFeeLedger;
