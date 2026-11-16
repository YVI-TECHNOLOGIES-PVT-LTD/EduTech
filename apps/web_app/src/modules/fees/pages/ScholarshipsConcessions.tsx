import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Download,
  FileText,
  Users,
  Percent,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  ArrowRight,
  X,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

// Liquid glass design tokens
const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';
const GLASS_PANEL =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-2xl';

interface ScholarshipMetrics {
  active_programs_count: number;
  pending_applications_count: number;
  approved_awards_count: number;
  applied_concessions_count: number;
  rejected_awards_count: number;
  total_beneficiaries_count: number;
  total_concessions_discount: number;
  average_concession_percentage: number;
}

interface ScholarshipProgram {
  id: string;
  code: string;
  type: 'merit' | 'sports' | 'need_based' | 'government' | 'management';
  name: string;
  description: string;
  default_percentage: number;
  scope: 'academic_year' | 'installment';
  min_percentage: number;
  max_percentage: number;
  status: string;
  eligibility_criteria: string;
  required_documents: string[];
  current_awards_count?: number;
}

interface ScholarshipConcession {
  scholarship_concession_id: string;
  student_id: string;
  academic_year_id: string;
  scholarship_type: 'merit' | 'sports' | 'need_based' | 'government' | 'management';
  concession_name: string;
  concession_percentage: number;
  scope: 'academic_year' | 'installment';
  installment_term_id: string | null;
  status: 'recommended' | 'approved' | 'rejected' | 'applied';
  recommendation_reason: string;
  recommended_by: string;
  recommended_at: string;
  approved_percentage: number | null;
  approved_by: string | null;
  approved_at: string | null;
  applied_percentage: number | null;
  applied_by: string | null;
  applied_at: string | null;
  notes: string | null;
  created_at: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  academic_year_name: string;
  term_name?: string | null;
  recommended_by_name?: string;
  approved_by_name?: string;
}

interface ApprovalAuditEntry {
  scholarship_concession_approval_id: string;
  scholarship_concession_id: string;
  action: 'approved' | 'rejected';
  approved_percentage: number | null;
  remarks: string | null;
  action_at: string;
  action_by: string;
  action_by_name?: string;
}

export const ScholarshipsConcessions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'programs' | 'reports'>('overview');
  const [metrics, setMetrics] = useState<ScholarshipMetrics | null>(null);
  const [programs, setPrograms] = useState<ScholarshipProgram[]>([]);
  const [applications, setApplications] = useState<ScholarshipConcession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modal states
  const [showRecommendModal, setShowRecommendModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Selected item state
  const [selectedConcession, setSelectedConcession] = useState<ScholarshipConcession | null>(null);
  const [auditHistory, setAuditHistory] = useState<ApprovalAuditEntry[]>([]);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [reviewPercentage, setReviewPercentage] = useState<number>(25);
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Recommend form state
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [formProgramType, setFormProgramType] = useState<string>('merit');
  const [formConcessionName, setFormConcessionName] = useState<string>('Academic Merit Scholarship');
  const [formPercentage, setFormPercentage] = useState<number>(25);
  const [formScope, setFormScope] = useState<'academic_year' | 'installment'>('academic_year');
  const [formReason, setFormReason] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Initial data load
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [metricsRes, programsRes, appsRes] = await Promise.all([
        apiClient.get('/fees/scholarships/metrics'),
        apiClient.get('/fees/scholarships/programs'),
        apiClient.get('/fees/scholarships/applications?page=1&limit=20'),
      ]);

      if (metricsRes.data?.success) setMetrics(metricsRes.data.data);
      if (programsRes.data?.success) setPrograms(programsRes.data.data);
      if (appsRes.data?.success) {
        setApplications(appsRes.data.data || []);
        if (appsRes.data.pagination) setTotalPages(appsRes.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Error loading scholarships data:', err);
      toast.error('Failed to load scholarships data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered applications reload
  const reloadApplications = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('scholarshipType', typeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('page', String(page));
      params.append('limit', '20');

      const res = await apiClient.get(`/fees/scholarships/applications?${params.toString()}`);
      if (res.data?.success) {
        setApplications(res.data.data || []);
        if (res.data.pagination) setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error filtering applications:', err);
    }
  };

  useEffect(() => {
    reloadApplications();
  }, [statusFilter, typeFilter, page]);

  // Student search debounce
  useEffect(() => {
    if (!showRecommendModal) return;
    const timer = setTimeout(async () => {
      setStudentSearchLoading(true);
      try {
        const res = await apiClient.get(
          `/fees/scholarships/students?query=${encodeURIComponent(studentSearchTerm.trim())}&limit=10`
        );
        if (res.data?.success) {
          setEligibleStudents(res.data.data || []);
        }
      } catch (e) {
        console.error('Student search failed:', e);
      } finally {
        setStudentSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearchTerm, showRecommendModal]);

  // View audit history
  const handleViewDetail = async (item: ScholarshipConcession) => {
    setSelectedConcession(item);
    setShowDetailModal(true);
    try {
      const res = await apiClient.get(`/fees/scholarships/applications/${item.scholarship_concession_id}`);
      if (res.data?.success && res.data.data.approval_history) {
        setAuditHistory(res.data.data.approval_history);
      }
    } catch (e) {
      console.error('Failed to fetch approval history:', e);
    }
  };

  // Open review modal
  const handleOpenReview = (item: ScholarshipConcession) => {
    setSelectedConcession(item);
    setReviewAction('approved');
    setReviewPercentage(item.concession_percentage);
    setReviewRemarks('');
    setShowReviewModal(true);
  };

  // Open apply modal
  const handleOpenApply = (item: ScholarshipConcession) => {
    setSelectedConcession(item);
    setShowApplyModal(true);
  };

  // Submit approval/rejection decision
  const handleSubmitReview = async () => {
    if (!selectedConcession) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/fees/scholarships/applications/${selectedConcession.scholarship_concession_id}/decision`,
        {
          action: reviewAction,
          approvedPercentage: reviewAction === 'approved' ? Number(reviewPercentage) : null,
          remarks: reviewRemarks.trim() || undefined,
        }
      );

      if (res.data?.success) {
        toast.success(`Application ${reviewAction === 'approved' ? 'approved' : 'rejected'} successfully.`);
        setShowReviewModal(false);
        loadInitialData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Review submission failed';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit apply concession to dues
  const handleSubmitApply = async () => {
    if (!selectedConcession) return;
    setActionLoading(true);
    try {
      const res = await apiClient.post(
        `/fees/scholarships/applications/${selectedConcession.scholarship_concession_id}/apply`
      );

      if (res.data?.success) {
        toast.success('Concession applied successfully! Student obligations have been discounted.');
        setShowApplyModal(false);
        loadInitialData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to apply concession';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit recommendation
  const handleCreateRecommendation = async () => {
    if (!selectedStudent) {
      return toast.error('Please select an eligible student.');
    }
    if (!selectedStudent.academic_year_id) {
      return toast.error('Selected student does not have an active academic year enrollment.');
    }
    if (!formConcessionName.trim()) {
      return toast.error('Concession program name is required.');
    }
    if (!formReason.trim()) {
      return toast.error('Please provide a recommendation justification.');
    }
    if (formPercentage <= 0 || formPercentage > 100) {
      return toast.error('Concession percentage must be between 1 and 100%.');
    }

    setActionLoading(true);
    try {
      const res = await apiClient.post('/fees/scholarships/applications', {
        studentId: selectedStudent.student_id,
        academicYearId: selectedStudent.academic_year_id,
        scholarshipType: formProgramType,
        concessionName: formConcessionName.trim(),
        concessionPercentage: Number(formPercentage),
        scope: formScope,
        recommendationReason: formReason.trim(),
        notes: formNotes.trim() || undefined,
      });

      if (res.data?.success) {
        toast.success('Scholarship recommendation submitted successfully.');
        setShowRecommendModal(false);
        setSelectedStudent(null);
        setFormReason('');
        setFormNotes('');
        loadInitialData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit recommendation';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recommended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Recommended
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'applied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Applied to Dues
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto animate-pulse">
        <div className="h-10 w-72 bg-slate-200 dark:bg-white/10 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-white/10 rounded-2xl" />
            ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* ── Breadcrumb & Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Workspace</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Finance & Fees</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-emerald-600 dark:text-emerald-400">Scholarships & Concessions</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Scholarships & Concessions
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Institutional award programs, merit scholarships, need-based fee waivers, and multi-tier approval governance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowRecommendModal(true);
                setStudentSearchTerm('');
                setSelectedStudent(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Recommend Award
            </button>
            <button
              onClick={loadInitialData}
              className="p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-slate-300"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className={`${GLASS_CARD} p-5 relative overflow-hidden group`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Programs</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black mt-2 text-slate-900 dark:text-white">
            {metrics?.active_programs_count || 5}
          </p>
          <p className="text-xs text-slate-500 mt-1">Configured institutional frameworks</p>
        </div>

        <div className={`${GLASS_CARD} p-5 relative overflow-hidden group`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black mt-2 text-amber-600 dark:text-amber-400">
            {metrics?.pending_applications_count || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Awaiting approval queue decisions</p>
        </div>

        <div className={`${GLASS_CARD} p-5 relative overflow-hidden group`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Approved Awards</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
            {metrics?.approved_awards_count || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Ready to apply to student obligations</p>
        </div>

        <div className={`${GLASS_CARD} p-5 relative overflow-hidden group`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Beneficiaries</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black mt-2 text-indigo-600 dark:text-indigo-400">
            {metrics?.total_beneficiaries_count || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Avg {metrics?.average_concession_percentage ? `${metrics.average_concession_percentage}%` : '0%'} concession
          </p>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex border-b border-slate-200 dark:border-white/10 gap-8 text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3.5 flex items-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Overview & Register
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3.5 flex items-center gap-2 transition-all ${
            activeTab === 'applications'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" /> Approval Queue
          {metrics && metrics.pending_applications_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-black">
              {metrics.pending_applications_count}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('programs')}
          className={`pb-3.5 flex items-center gap-2 transition-all ${
            activeTab === 'programs'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4 h-4" /> Programs Catalog
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3.5 flex items-center gap-2 transition-all ${
            activeTab === 'reports'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" /> Financial Audit Reports
        </button>
      </div>

      {/* ── TAB 1 & 2: Overview & Applications Queue ── */}
      {(activeTab === 'overview' || activeTab === 'applications') && (
        <div className="space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && reloadApplications()}
                placeholder="Search student admission no, name, or award..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {activeTab === 'overview' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3.5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="recommended">Recommended (Pending)</option>
                  <option value="approved">Approved (Ready to Apply)</option>
                  <option value="applied">Applied to Dues</option>
                  <option value="rejected">Rejected</option>
                </select>
              )}

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3.5 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold outline-none"
              >
                <option value="all">All Program Types</option>
                <option value="merit">Merit Scholarship</option>
                <option value="sports">Sports Achievement</option>
                <option value="need_based">Need-Based Hardship</option>
                <option value="government">Government Quota</option>
                <option value="management">Management Concession</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-4 pl-6">Student</th>
                    <th className="p-4">Program & Category</th>
                    <th className="p-4">Academic Year & Scope</th>
                    <th className="p-4 text-center">Concession %</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Governance</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400">
                        <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-base text-slate-600 dark:text-slate-300">
                          No scholarship or concession records found
                        </p>
                        <p className="text-xs mt-1">
                          {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search criteria or filters.'
                            : 'Click "Recommend Award" to submit a student for scholarship evaluation.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    applications.map((item) => (
                      <tr key={item.scholarship_concession_id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.first_name} {item.last_name || ''}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                              {item.admission_no}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">{item.concession_name}</div>
                          <div className="text-xs text-slate-400 capitalize">{item.scholarship_type.replace('_', ' ')}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs font-medium">{item.academic_year_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {item.scope === 'academic_year' ? 'Full Academic Year' : `Term: ${item.term_name || 'Installment'}`}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              {item.applied_percentage || item.approved_percentage || item.concession_percentage}%
                            </span>
                            {item.approved_percentage && item.approved_percentage !== item.concession_percentage && (
                              <span className="text-[10px] text-slate-400 line-through">
                                Rec: {item.concession_percentage}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(item.status)}</td>
                        <td className="p-4 text-xs">
                          {item.recommended_by_name && (
                            <div>Rec: <span className="font-medium">{item.recommended_by_name}</span></div>
                          )}
                          {item.approved_by_name && (
                            <div className="text-slate-400">Appr: <span className="font-medium text-slate-600 dark:text-slate-300">{item.approved_by_name}</span></div>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.status === 'recommended' && (
                              <button
                                onClick={() => handleOpenReview(item)}
                                className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-all"
                              >
                                Review
                              </button>
                            )}

                            {item.status === 'approved' && (
                              <button
                                onClick={() => handleOpenApply(item)}
                                className="px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold transition-all shadow-sm shadow-emerald-500/20"
                              >
                                Apply to Dues
                              </button>
                            )}

                            <button
                              onClick={() => handleViewDetail(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                              title="Audit History & Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Programs Catalog ── */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog) => (
            <div key={prog.id} className={`${GLASS_CARD} p-6 flex flex-col justify-between space-y-4`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {prog.type}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    {prog.default_percentage}%
                  </span>
                </div>
                <h3 className="text-lg font-bold">{prog.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {prog.description}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5 text-xs">
                  <div className="text-slate-400">
                    <strong>Eligibility:</strong> {prog.eligibility_criteria}
                  </div>
                  <div className="text-slate-400">
                    <strong>Scope:</strong> {prog.scope === 'academic_year' ? 'Full Academic Year' : 'Installment Term Specific'}
                  </div>
                  <div className="text-slate-400">
                    <strong>Range:</strong> {prog.min_percentage}% – {prog.max_percentage}%
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setFormProgramType(prog.type);
                  setFormConcessionName(prog.name);
                  setFormPercentage(prog.default_percentage);
                  setFormScope(prog.scope);
                  setShowRecommendModal(true);
                }}
                className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
              >
                Recommend Student <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 4: Financial Audit Reports ── */}
      {activeTab === 'reports' && (
        <div className={`${GLASS_CARD} p-6 space-y-6`}>
          <div>
            <h2 className="text-lg font-black">Financial Concession Audit & Statutory Ledger Summary</h2>
            <p className="text-xs text-slate-500">
              Live persisted ledger discount breakdown verified against physical PostgreSQL constraint enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Total Approved Awards</span>
              <p className="text-2xl font-black text-emerald-600">{metrics?.approved_awards_count || 0}</p>
              <p className="text-[11px] text-slate-400">Approved by Principal/Governing Authority</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Applied to Student Dues</span>
              <p className="text-2xl font-black text-blue-600">{metrics?.applied_concessions_count || 0}</p>
              <p className="text-[11px] text-slate-400">Dues discounted without cash receipts</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1">
              <span className="text-xs font-semibold text-slate-400">Average Award Discount</span>
              <p className="text-2xl font-black text-indigo-600">{metrics?.average_concession_percentage || 0}%</p>
              <p className="text-[11px] text-slate-400">Institutional fee relief ratio</p>
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1 text-amber-800 dark:text-amber-300">
            <p className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Financial Integrity Guarantee:
            </p>
            <p>
              All fee concessions and scholarships are permanently logged with immutable audit entries. Concessions adjust
              student charge dues atomically within database transactions, prevent duplicate credits, and never generate fictitious
              payment receipts or gateway transactions.
            </p>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Recommend Concession Modal ── */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Recommend Scholarship Award</h3>
                  <p className="text-xs text-slate-400">Submit student for Principal & Board review</p>
                </div>
              </div>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Search */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Select Enrolled Student
              </label>
              {!selectedStudent ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Type student name or admission number..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none"
                    />
                  </div>
                  {studentSearchLoading && (
                    <p className="text-xs text-slate-400 animate-pulse">Searching enrolled students...</p>
                  )}
                  {eligibleStudents.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900">
                      {eligibleStudents.map((s) => (
                        <div
                          key={s.student_id}
                          onClick={() => setSelectedStudent(s)}
                          className="p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 cursor-pointer transition-colors text-xs flex justify-between items-center"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{s.full_name}</span>
                            <span className="ml-2 font-mono text-slate-400">({s.admission_no})</span>
                            <div className="text-[11px] text-slate-400">
                              {s.grade_name} · {s.academic_year_name}
                            </div>
                          </div>
                          <span className="text-emerald-600 font-bold">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      {selectedStudent.full_name} ({selectedStudent.admission_no})
                    </span>
                    <div className="text-slate-500 mt-0.5">
                      {selectedStudent.grade_name} · Academic Year: {selectedStudent.academic_year_name}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="text-xs text-rose-500 hover:underline font-bold"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Program Type & Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Program Category</label>
                <select
                  value={formProgramType}
                  onChange={(e) => {
                    const t = e.target.value;
                    setFormProgramType(t);
                    const matching = programs.find((p) => p.type === t);
                    if (matching) {
                      setFormConcessionName(matching.name);
                      setFormPercentage(matching.default_percentage);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="merit">Academic Merit</option>
                  <option value="sports">Sports Achievement</option>
                  <option value="need_based">Need-Based Hardship</option>
                  <option value="government">Government Quota</option>
                  <option value="management">Management Concession</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Award Name</label>
                <input
                  type="text"
                  value={formConcessionName}
                  onChange={(e) => setFormConcessionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold outline-none"
                />
              </div>
            </div>

            {/* Percentage & Scope */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Concession % (1–100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.5"
                  value={formPercentage}
                  onChange={(e) => setFormPercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Applicability Scope</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="academic_year">Full Academic Year</option>
                  <option value="installment">Installment Term Specific</option>
                </select>
              </div>
            </div>

            {/* Justification Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recommendation Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Detail student eligibility, academic rankings, athletic medals, or financial criteria..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowRecommendModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCreateRecommendation}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Submitting...' : 'Submit Recommendation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Review Modal (Approve / Reject) ── */}
      {showReviewModal && selectedConcession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Review Concession Award</h3>
                  <p className="text-xs text-slate-400">Principal / Management Approval Desk</p>
                </div>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {selectedConcession.first_name} {selectedConcession.last_name || ''} ({selectedConcession.admission_no})
              </div>
              <div className="text-slate-500">
                Award: <strong>{selectedConcession.concession_name}</strong> · Requested: <strong>{selectedConcession.concession_percentage}%</strong>
              </div>
              <div className="text-slate-500">
                Justification: <em>"{selectedConcession.recommendation_reason}"</em>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Approval Decision</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewAction('approved')}
                  className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    reviewAction === 'approved'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'border-slate-200 dark:border-white/10 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Award
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('rejected')}
                  className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                    reviewAction === 'rejected'
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'border-slate-200 dark:border-white/10 text-slate-600'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> Reject Award
                </button>
              </div>

              {reviewAction === 'approved' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Approved Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={reviewPercentage}
                    onChange={(e) => setReviewPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold outline-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    You can approve the full {selectedConcession.concession_percentage}% or specify an alternate percentage.
                  </p>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Decision Remarks / Audit Comments
                </label>
                <textarea
                  rows={2}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Official comments recorded in permanent approval history..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSubmitReview}
                className={`flex-1 py-2.5 text-white rounded-xl font-bold text-xs transition-all ${
                  reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Saving...' : `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Apply Concession to Ledger Modal ── */}
      {showApplyModal && selectedConcession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Apply Concession to Ledger</h3>
                  <p className="text-xs text-slate-400">Post approved discount to outstanding fee dues</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-blue-900 dark:text-blue-300 text-sm">
                {selectedConcession.first_name} {selectedConcession.last_name || ''} ({selectedConcession.admission_no})
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Award: <strong>{selectedConcession.concession_name}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Approved Rate: <strong className="text-emerald-600 font-black">{selectedConcession.approved_percentage}%</strong>
              </p>
              <p className="text-slate-500">
                Scope: {selectedConcession.scope === 'academic_year' ? 'All eligible dues for academic year' : 'Targeted installment term'}
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold">Permanent Ledger Mutation Notice:</p>
              <p>
                This action will atomically discount the student's scheduled dues by {selectedConcession.approved_percentage}%.
                This operation does not generate cash transactions, gateway orders, or payment receipts.
              </p>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-white/5 text-slate-600 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSubmitApply}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20"
              >
                {actionLoading ? 'Applying...' : 'Confirm & Apply Concession'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Detail & Audit Trail Modal ── */}
      {showDetailModal && selectedConcession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Award Governance & Audit Record</h3>
                  <p className="text-xs text-slate-400">Complete immutable decision history</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">Student Information</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedConcession.first_name} {selectedConcession.last_name || ''}
                </p>
                <p className="font-mono text-slate-500">{selectedConcession.admission_no}</p>
                <p className="text-slate-400">{selectedConcession.academic_year_name}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl space-y-1">
                <span className="text-slate-400 font-semibold">Program Parameters</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedConcession.concession_name}</p>
                <p className="capitalize text-slate-500">Category: {selectedConcession.scholarship_type.replace('_', ' ')}</p>
                <p className="text-emerald-600 font-black text-sm">
                  Rate: {selectedConcession.applied_percentage || selectedConcession.approved_percentage || selectedConcession.concession_percentage}%
                </p>
              </div>
            </div>

            {/* Justification */}
            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-semibold">Recommendation Justification</span>
              <p className="text-slate-700 dark:text-slate-300 italic">
                "{selectedConcession.recommendation_reason}"
              </p>
            </div>

            {selectedConcession.notes && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs space-y-1 text-blue-900 dark:text-blue-200">
                <span className="font-semibold">Ledger Application Notes</span>
                <p>{selectedConcession.notes}</p>
              </div>
            )}

            {/* Audit History Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Approval Decision Timeline ({auditHistory.length} events)
              </h4>

              {auditHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No approval history recorded yet. Award is in initial recommendation status.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditHistory.map((item) => (
                    <div
                      key={item.scholarship_concession_approval_id}
                      className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 text-xs flex justify-between items-start"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              item.action === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-rose-500/10 text-rose-600'
                            }`}
                          >
                            {item.action.toUpperCase()}
                          </span>
                          {item.approved_percentage && (
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {item.approved_percentage}%
                            </span>
                          )}
                        </div>
                        {item.remarks && (
                          <p className="text-slate-600 dark:text-slate-400 italic">"{item.remarks}"</p>
                        )}
                        <div className="text-[11px] text-slate-400">
                          Decided by: <span className="font-medium">{item.action_by_name || 'Authorized Officer'}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.action_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 text-right">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
