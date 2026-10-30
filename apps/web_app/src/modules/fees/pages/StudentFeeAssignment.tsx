import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Wallet,
  Search,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Calendar,
  GraduationCap,
  ListPlus,
  FileText,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface AcademicYearGradeOption {
  academic_year_grade_id: string;
  academic_year_id: string;
  academic_year_name: string;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  is_configured: boolean;
  existing_structure: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface EnrolledStudentItem {
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  grade_id: string;
  grade_name: string;
  section_name: string | null;
  academic_year_id: string;
  academic_year_name: string;
  enrollment_id: string;
  is_assigned: boolean;
  existing_assignment?: {
    assignment_id: string;
    fee_structure_id: string;
    fee_structure_name: string;
    installment_plan_id: string | null;
    status: string;
    assigned_at: string;
  } | null;
}

interface FeeStructureDetail {
  id: string;
  fee_structure_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'inactive';
  total_amount: number;
  components: Array<{
    id?: string;
    component_name: string;
    component_code: string;
    amount: number;
    is_mandatory: boolean;
  }>;
  installment_plan?: {
    id: string;
    plan_name: string;
    terms_count: number;
    terms: Array<{
      term_number: number;
      term_name: string;
      percentage: number;
      due_date: string;
    }>;
  };
}

export const StudentFeeAssignment: React.FC = () => {
  // Configuration options
  const [academicYearGrades, setAcademicYearGrades] = useState<AcademicYearGradeOption[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');

  // Published structure for selection
  const [activeStructure, setActiveStructure] = useState<FeeStructureDetail | null>(null);
  const [isLoadingStructure, setIsLoadingStructure] = useState<boolean>(false);

  // Enrolled students
  const [students, setStudents] = useState<EnrolledStudentItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unassigned' | 'assigned'>('unassigned');

  // Selection states
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'bulk'>('single');
  const [selectedSingleStudentId, setSelectedSingleStudentId] = useState<string>('');
  const [selectedBulkStudentIds, setSelectedBulkStudentIds] = useState<string[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [lastSuccessResult, setLastSuccessResult] = useState<any | null>(null);

  // 1. Fetch academic year grades for filter dropdowns
  const fetchAcademicYearGrades = useCallback(async () => {
    try {
      const res = await apiClient.get('/fees/structures/academic-year-grades');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setAcademicYearGrades(res.data.data);

        // Derive distinct academic years
        const yearsMap = new Map<string, string>();
        res.data.data.forEach((g: AcademicYearGradeOption) => {
          if (g.academic_year_id && g.academic_year_name) {
            yearsMap.set(g.academic_year_id, g.academic_year_name);
          }
        });
        const years = Array.from(yearsMap.entries()).map(([id, name]) => ({ id, name }));
        setAcademicYears(years);

        if (years.length > 0 && !selectedYearId) {
          setSelectedYearId(years[0].id);
        }
      }
    } catch (err: any) {
      console.warn('[StudentFeeAssignment] Error fetching academic year grades:', err);
    }
  }, [selectedYearId]);

  useEffect(() => {
    fetchAcademicYearGrades();
  }, [fetchAcademicYearGrades]);

  // Filter available grades for the selected academic year
  const availableGradesForYear = useMemo(() => {
    if (!selectedYearId) return [];
    return academicYearGrades.filter((g) => g.academic_year_id === selectedYearId);
  }, [academicYearGrades, selectedYearId]);

  // Set default grade when year changes
  useEffect(() => {
    if (availableGradesForYear.length > 0) {
      const currentExists = availableGradesForYear.some((g) => g.grade_id === selectedGradeId);
      if (!currentExists) {
        setSelectedGradeId(availableGradesForYear[0].grade_id);
      }
    } else {
      setSelectedGradeId('');
    }
  }, [availableGradesForYear, selectedGradeId]);

  // 2. Fetch the published structure for the chosen grade & year
  const fetchPublishedStructure = useCallback(async () => {
    if (!selectedYearId || !selectedGradeId) {
      setActiveStructure(null);
      return;
    }

    setIsLoadingStructure(true);
    try {
      const res = await apiClient.get(
        `/fees/structures?academicYearId=${selectedYearId}&gradeId=${selectedGradeId}&status=published`,
      );

      const items =
        res.data?.items || res.data?.structures || (Array.isArray(res.data) ? res.data : []);
      if (items.length > 0) {
        const struct = items[0];
        // Fetch detailed components and installment terms
        const detailRes = await apiClient.get(
          `/fees/structures/${struct.fee_structure_id || struct.id}`,
        );
        if (detailRes.data?.success && detailRes.data?.data) {
          setActiveStructure(detailRes.data.data);
        } else {
          setActiveStructure(struct);
        }
      } else {
        setActiveStructure(null);
      }
    } catch (err: any) {
      console.warn('[StudentFeeAssignment] Error fetching structure:', err);
      setActiveStructure(null);
    } finally {
      setIsLoadingStructure(false);
    }
  }, [selectedYearId, selectedGradeId]);

  // 3. Fetch eligible enrolled students
  const fetchStudents = useCallback(async () => {
    if (!selectedYearId || !selectedGradeId) {
      setStudents([]);
      return;
    }

    setIsLoadingStudents(true);
    try {
      const res = await apiClient.get(
        `/fees/structures/eligible-students?academicYearId=${selectedYearId}&gradeId=${selectedGradeId}&limit=100`,
      );

      const list = res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setStudents(list);
    } catch (err: any) {
      console.warn('[StudentFeeAssignment] Error fetching enrolled students:', err);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedYearId, selectedGradeId]);

  useEffect(() => {
    fetchPublishedStructure();
    fetchStudents();
    setSelectedSingleStudentId('');
    setSelectedBulkStudentIds([]);
    setLastSuccessResult(null);
  }, [fetchPublishedStructure, fetchStudents]);

  // Filter students based on search term & assignment status
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_no?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterMode === 'all' ||
        (filterMode === 'unassigned' && !s.is_assigned) ||
        (filterMode === 'assigned' && s.is_assigned);

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, filterMode]);

  // Unassigned students available for bulk selection
  const unassignedStudents = useMemo(() => {
    return students.filter((s) => !s.is_assigned);
  }, [students]);

  // Toggle single bulk student selection
  const handleToggleBulkStudent = (sId: string) => {
    setSelectedBulkStudentIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId],
    );
  };

  // Toggle all unassigned students in bulk mode
  const handleToggleSelectAll = () => {
    if (selectedBulkStudentIds.length === unassignedStudents.length) {
      setSelectedBulkStudentIds([]);
    } else {
      setSelectedBulkStudentIds(unassignedStudents.map((s) => s.student_id));
    }
  };

  // Handle Assignment submission
  const handleExecuteAssignment = async () => {
    if (!activeStructure) {
      toast.error('No published fee structure is active for this grade.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (assignmentMode === 'single') {
        if (!selectedSingleStudentId) {
          toast.error('Please select an enrolled student to assign fees.');
          setIsSubmitting(false);
          return;
        }

        const selectedStudent = students.find((s) => s.student_id === selectedSingleStudentId);

        const res = await apiClient.post('/fees/ledger/assignments', {
          studentId: selectedSingleStudentId,
          enrollmentId: selectedStudent?.enrollment_id || undefined,
          feeStructureId: activeStructure.fee_structure_id || activeStructure.id,
          installmentPlanId: activeStructure.installment_plan?.id,
          notes: assignmentNotes.trim() || undefined,
        });

        if (res.data?.success) {
          toast.success('Fee structure assigned and installment dues generated successfully!');
          setLastSuccessResult(res.data.data);
          setShowConfirmModal(false);
          fetchStudents();
          setSelectedSingleStudentId('');
        }
      } else {
        if (selectedBulkStudentIds.length === 0) {
          toast.error('Please select at least one student for bulk assignment.');
          setIsSubmitting(false);
          return;
        }

        const res = await apiClient.post('/fees/ledger/assignments/bulk', {
          studentIds: selectedBulkStudentIds,
          feeStructureId: activeStructure.fee_structure_id || activeStructure.id,
          installmentPlanId: activeStructure.installment_plan?.id,
          notes: assignmentNotes.trim() || undefined,
        });

        if (res.data?.success) {
          const { succeeded, failed } = res.data.data;
          toast.success(`Bulk assignment complete: ${succeeded} assigned, ${failed} failed.`);
          setLastSuccessResult(res.data.data);
          setShowConfirmModal(false);
          fetchStudents();
          setSelectedBulkStudentIds([]);
        }
      }
    } catch (err: any) {
      console.error('[StudentFeeAssignment] Assignment error:', err);
      toast.error(err.response?.data?.message || 'Failed to assign fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 space-y-8 font-sans">
      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Finance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-600 dark:text-emerald-400">Student Fee Assignment</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              Student Fee Assignment & Dues Schedule
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Assign official published fee structures to active student enrollments and atomically
            generate installment charge obligations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchPublishedStructure();
              fetchStudents();
            }}
            disabled={isLoadingStudents || isLoadingStructure}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingStudents || isLoadingStructure ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── ACADEMIC YEAR & GRADE SELECTOR ────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Step 1: Select Academic Context & Grade</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Academic Year
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Applicable Grade
            </label>
            <select
              value={selectedGradeId}
              onChange={(e) => setSelectedGradeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {availableGradesForYear.map((g) => (
                <option key={g.grade_id} value={g.grade_id}>
                  {g.grade_name} ({g.grade_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── STEP 2: PUBLISHED STRUCTURE CARD ──────────────────────────── */}
      {isLoadingStructure ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3">
          <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">
            Checking published fee structures for grade...
          </span>
        </div>
      ) : !activeStructure ? (
        <div className="p-6 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              No Published Fee Structure Found for this Grade
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Before student fees can be assigned, a published fee structure must exist for this
              academic year and grade. Please go to <strong>Fee Structure Management</strong> to
              create and publish a fee schedule.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Fee Structure
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50">
                  Published & Ready
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {activeStructure.name}
              </h2>
              {activeStructure.description && (
                <p className="text-xs text-slate-500 mt-0.5">{activeStructure.description}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Total Annual Fee
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{Number(activeStructure.total_amount).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Components and Installment Terms preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Components list */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ListPlus className="w-3.5 h-3.5" />
                <span>Components Breakdown</span>
              </h4>
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(activeStructure.components || []).map((c, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
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
            </div>

            {/* Installment terms schedule */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Installment Schedule ({activeStructure.installment_plan?.plan_name || 'Standard'})
                </span>
              </h4>
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {(activeStructure.installment_plan?.terms || []).map((t, idx) => {
                  const termAmt = Number(activeStructure.total_amount) * (t.percentage / 100);
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {t.term_name}
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold ml-2">
                          {t.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          Due: {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{termAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: ENROLLED STUDENTS ASSIGNMENT WORKSPACE ─────────────── */}
      {activeStructure && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Step 2: Assign Students
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Eligible Enrolled Students ({students.length} total)
              </h3>
            </div>

            {/* Mode switcher: Single vs Bulk */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setAssignmentMode('single')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  assignmentMode === 'single'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Single Student</span>
              </button>

              <button
                onClick={() => setAssignmentMode('bulk')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  assignmentMode === 'bulk'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Bulk Grade Selection ({unassignedStudents.length} eligible)</span>
              </button>
            </div>
          </div>

          {/* Filter and Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student by name or admission no..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode('unassigned')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  filterMode === 'unassigned'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                Unassigned Only ({unassignedStudents.length})
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  filterMode === 'all'
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                All Students ({students.length})
              </button>
            </div>
          </div>

          {/* Bulk select all toggle */}
          {assignmentMode === 'bulk' && unassignedStudents.length > 0 && (
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={
                    unassignedStudents.length > 0 &&
                    selectedBulkStudentIds.length === unassignedStudents.length
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>
                  Select all {unassignedStudents.length} unassigned students for bulk assignment
                </span>
              </div>
              <span className="text-emerald-600 font-bold">
                {selectedBulkStudentIds.length} of {unassignedStudents.length} selected
              </span>
            </div>
          )}

          {/* Students List Table */}
          {isLoadingStudents ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Loading enrolled students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students found matching current filters.
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">
                      {assignmentMode === 'single' ? '#' : ''}
                    </th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Fee Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((s, idx) => {
                    const isSelectedSingle = selectedSingleStudentId === s.student_id;
                    const isSelectedBulk = selectedBulkStudentIds.includes(s.student_id);

                    return (
                      <tr
                        key={s.student_id}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelectedSingle || isSelectedBulk
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {assignmentMode === 'bulk' ? (
                            <input
                              type="checkbox"
                              disabled={s.is_assigned}
                              checked={isSelectedBulk}
                              onChange={() => handleToggleBulkStudent(s.student_id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                            />
                          ) : (
                            <span className="text-slate-400">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {s.full_name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{s.admission_no}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {s.section_name || 'Standard'}
                        </td>
                        <td className="py-3 px-4">
                          {s.is_assigned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/50">
                              <CheckCircle2 className="w-3 h-3" />
                              {s.existing_assignment?.fee_structure_name || 'Assigned'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/50">
                              <Clock className="w-3 h-3" />
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {assignmentMode === 'single' && !s.is_assigned && (
                            <button
                              onClick={() => setSelectedSingleStudentId(s.student_id)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                isSelectedSingle
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {isSelectedSingle ? 'Selected ✓' : 'Select'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Trigger Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {assignmentMode === 'single'
                  ? selectedSingleStudentId
                    ? `Ready to assign 1 student to: "${activeStructure.name}"`
                    : 'Select a student from the table above to proceed'
                  : selectedBulkStudentIds.length > 0
                    ? `Ready to bulk-assign ${selectedBulkStudentIds.length} students to: "${activeStructure.name}"`
                    : 'Select one or more students to proceed with bulk assignment'}
              </div>
              <div className="text-[11px] text-slate-500">
                Annual obligation of ₹{Number(activeStructure.total_amount).toLocaleString('en-IN')}{' '}
                partitioned into dues
              </div>
            </div>

            <button
              disabled={
                assignmentMode === 'single'
                  ? !selectedSingleStudentId
                  : selectedBulkStudentIds.length === 0
              }
              onClick={() => setShowConfirmModal(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Preview & Confirm Assignment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ─────────────────────────────────────────── */}
      {showConfirmModal && activeStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Student Fee Assignment
                </h3>
                <p className="text-xs text-slate-500">
                  {assignmentMode === 'single'
                    ? 'Assigning 1 Student'
                    : `Bulk Assigning ${selectedBulkStudentIds.length} Students`}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Structure:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeStructure.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Annual Charge:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{Number(activeStructure.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Installments Generated:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeStructure.installment_plan?.terms?.length || 1} Terms
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Optional Assignment Notes / Remarks
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Regular Academic Year Admission Batch A"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAssignment}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Execute Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS RECEIPT RESULT ────────────────────────────────────── */}
      {lastSuccessResult && (
        <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>Assignment Successfully Processed!</span>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            {lastSuccessResult.total
              ? `Bulk operation processed: ${lastSuccessResult.succeeded} succeeded, ${lastSuccessResult.failed} failed.`
              : `Created ${lastSuccessResult.charges_count || 'all'} charges and ${lastSuccessResult.dues_count || 'all'} installment dues.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentFeeAssignment;
