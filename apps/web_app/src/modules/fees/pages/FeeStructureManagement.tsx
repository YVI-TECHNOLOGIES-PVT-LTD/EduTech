import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Archive,
  ChevronRight,
  ChevronLeft,
  Calendar,
  GraduationCap,
  Sparkles,
  Info,
  DollarSign,
  Trash2,
  Check,
  X,
  FileText,
  Clock,
  Shield,
  ArrowUpRight,
  ListPlus,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface FeeComponentItem {
  id?: string;
  component_name: string;
  component_code: string;
  amount: number;
  is_mandatory: boolean;
  display_order: number;
  description?: string | null;
}

interface FeeStructureItem {
  id: string;
  fee_structure_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  academic_year_grade_id: string;
  academic_year: {
    id: string;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
  grade: {
    id: string;
    name: string;
    code: string;
    board: string | null;
  } | null;
  components_count: number;
  total_amount: number;
  assigned_students_count: number;
  components?: FeeComponentItem[];
}

interface AcademicYearGradeOption {
  academic_year_grade_id: string;
  academic_year_id: string;
  academic_year_name: string;
  academic_year_status: string;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  board: string | null;
  is_configured: boolean;
  existing_structure: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface InstallmentPlanTerm {
  id?: string;
  term_number: number;
  term_name: string;
  percentage: number;
  due_date: string;
  calculated_amount?: number;
}

interface InstallmentPlan {
  id: string;
  plan_name: string;
  description: string | null;
  status: string;
  academic_year_id: string;
  academic_year_name: string;
  terms_count: number;
  terms: InstallmentPlanTerm[];
}

interface SummaryMetrics {
  totalStructures: number;
  publishedStructures: number;
  draftStructures: number;
  inactiveStructures: number;
  totalComponents: number;
  totalPublishedValue: number;
  totalAvailableGrades: number;
  configuredCoveragePercentage: number;
}

const COMPONENT_PRESETS = [
  { name: 'Tuition Fee', code: 'TUITION', amount: 35000, mandatory: true },
  { name: 'Admission / Enrollment Fee', code: 'ADMISSION', amount: 15000, mandatory: true },
  { name: 'Science Laboratory Fee', code: 'LAB_SCI', amount: 5000, mandatory: true },
  { name: 'Computer & IT Fee', code: 'LAB_IT', amount: 4500, mandatory: true },
  { name: 'Annual Examination Fee', code: 'EXAM', amount: 3000, mandatory: true },
  { name: 'Library & Digital Resources', code: 'LIBRARY', amount: 2500, mandatory: true },
  { name: 'Sports & Co-curricular Fee', code: 'SPORTS', amount: 2000, mandatory: false },
  { name: 'Transport & Commute Fee', code: 'TRANSPORT', amount: 12000, mandatory: false },
];

export const FeeStructureManagement: React.FC = () => {
  // Data states
  const [structures, setStructures] = useState<FeeStructureItem[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null);
  const [academicYearGrades, setAcademicYearGrades] = useState<AcademicYearGradeOption[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);

  // Filtering & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'inactive'>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal / Drawer states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructureItem | null>(null);
  const [structureToPublish, setStructureToPublish] = useState<FeeStructureItem | null>(null);
  const [structureToDeactivate, setStructureToDeactivate] = useState<FeeStructureItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModeStructureId, setEditModeStructureId] = useState<string | null>(null);

  // Form Builder state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAcademicYearGradeId, setFormAcademicYearGradeId] = useState('');
  const [formComponents, setFormComponents] = useState<FeeComponentItem[]>([
    {
      component_name: 'Tuition Fee',
      component_code: 'TUITION',
      amount: 45000,
      is_mandatory: true,
      display_order: 1,
      description: 'Standard academic instruction and syllabus fee',
    },
  ]);

  // New component draft row inputs
  const [draftCompName, setDraftCompName] = useState('');
  const [draftCompCode, setDraftCompCode] = useState('');
  const [draftCompAmount, setDraftCompAmount] = useState('');
  const [draftCompMandatory, setDraftCompMandatory] = useState(true);
  const [draftCompDescription, setDraftCompDescription] = useState('');

  // Fetch summary metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const yearParam = academicYearFilter !== 'all' ? `?academicYearId=${academicYearFilter}` : '';
      const res = await apiClient.get(`/fees/structures/summary${yearParam}`);
      if (res.data?.success && res.data?.data) {
        setSummaryMetrics(res.data.data);
      }
    } catch (err: any) {
      console.warn('[FeeStructureManagement] Non-fatal error loading metrics:', err);
    }
  }, [academicYearFilter]);

  // Fetch academic year grades for dropdown
  const fetchAcademicYearGrades = useCallback(async () => {
    try {
      const yearParam = academicYearFilter !== 'all' ? `?academicYearId=${academicYearFilter}` : '';
      const res = await apiClient.get(`/fees/structures/academic-year-grades${yearParam}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setAcademicYearGrades(res.data.data);

        // Derive distinct academic years
        const yearsMap = new Map<string, string>();
        res.data.data.forEach((g: AcademicYearGradeOption) => {
          if (g.academic_year_id && g.academic_year_name) {
            yearsMap.set(g.academic_year_id, g.academic_year_name);
          }
        });
        setAcademicYears(Array.from(yearsMap.entries()).map(([id, name]) => ({ id, name })));
      }
    } catch (err: any) {
      console.warn('[FeeStructureManagement] Error loading academic year grades:', err);
    }
  }, [academicYearFilter]);

  // Fetch installment plans
  const fetchInstallmentPlans = useCallback(async () => {
    try {
      const yearParam = academicYearFilter !== 'all' ? `?academicYearId=${academicYearFilter}` : '';
      const res = await apiClient.get(`/fees/structures/installment-plans${yearParam}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setInstallmentPlans(res.data.data);
      }
    } catch (err: any) {
      console.warn('[FeeStructureManagement] Error loading installment plans:', err);
    }
  }, [academicYearFilter]);

  // Fetch structures list
  const fetchStructures = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (academicYearFilter !== 'all') params.append('academicYearId', academicYearFilter);
      if (gradeFilter !== 'all') params.append('gradeId', gradeFilter);
      params.append('page', String(currentPage));
      params.append('limit', '15');

      const res = await apiClient.get(`/fees/structures?${params.toString()}`);
      if (res.data?.success) {
        setStructures(res.data.items || res.data.structures || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      } else if (Array.isArray(res.data)) {
        setStructures(res.data);
        setTotalPages(1);
        setTotalCount(res.data.length);
      }
    } catch (err: any) {
      console.error('[FeeStructureManagement] Error loading structures:', err);
      setLoadError(err.response?.data?.message || 'Failed to load fee structures. Please check connection and retry.');
      toast.error('Could not load fee structures.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, academicYearFilter, gradeFilter, currentPage]);

  // Initial load
  useEffect(() => {
    fetchMetrics();
    fetchAcademicYearGrades();
    fetchInstallmentPlans();
    fetchStructures();
  }, [fetchMetrics, fetchAcademicYearGrades, fetchInstallmentPlans, fetchStructures]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
    fetchAcademicYearGrades();
    fetchInstallmentPlans();
    fetchStructures();
  };

  // Live total calculation for form components
  const formTotalAmount = useMemo(() => {
    return formComponents.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [formComponents]);

  // Add component to form builder
  const handleAddComponent = () => {
    if (!draftCompName.trim()) {
      toast.error('Component name is required');
      return;
    }
    if (!draftCompCode.trim()) {
      toast.error('Component code is required');
      return;
    }
    const amountVal = parseFloat(draftCompAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Amount must be a positive number greater than 0');
      return;
    }

    const normCode = draftCompCode.trim().toUpperCase();
    const normName = draftCompName.trim().toLowerCase();

    if (formComponents.some((c) => c.component_code.trim().toUpperCase() === normCode)) {
      toast.error(`A component with code "${normCode}" already exists in this structure.`);
      return;
    }
    if (formComponents.some((c) => c.component_name.trim().toLowerCase() === normName)) {
      toast.error(`A component with name "${draftCompName.trim()}" already exists in this structure.`);
      return;
    }

    setFormComponents([
      ...formComponents,
      {
        component_name: draftCompName.trim(),
        component_code: normCode,
        amount: Math.round((amountVal + Number.EPSILON) * 100) / 100,
        is_mandatory: draftCompMandatory,
        display_order: formComponents.length + 1,
        description: draftCompDescription.trim() || null,
      },
    ]);

    // Reset draft inputs
    setDraftCompName('');
    setDraftCompCode('');
    setDraftCompAmount('');
    setDraftCompDescription('');
    setDraftCompMandatory(true);
  };

  // Apply a preset component
  const handleApplyPreset = (preset: (typeof COMPONENT_PRESETS)[0]) => {
    if (formComponents.some((c) => c.component_code.toUpperCase() === preset.code.toUpperCase())) {
      toast.info(`"${preset.name}" is already included in this structure.`);
      return;
    }
    setFormComponents([
      ...formComponents,
      {
        component_name: preset.name,
        component_code: preset.code,
        amount: preset.amount,
        is_mandatory: preset.mandatory,
        display_order: formComponents.length + 1,
      },
    ]);
  };

  // Remove component from form builder
  const handleRemoveComponent = (index: number) => {
    setFormComponents(formComponents.filter((_, idx) => idx !== index));
  };

  // Open Create Structure modal
  const handleOpenCreateModal = () => {
    setEditModeStructureId(null);
    setFormName('');
    setFormDescription('');
    setFormAcademicYearGradeId('');
    setFormComponents([
      {
        component_name: 'Tuition Fee',
        component_code: 'TUITION',
        amount: 45000,
        is_mandatory: true,
        display_order: 1,
        description: 'Core annual academic instruction fee',
      },
    ]);
    setIsCreateModalOpen(true);
  };

  // Open Edit Structure modal
  const handleOpenEditModal = (struct: FeeStructureItem) => {
    setEditModeStructureId(struct.id);
    setFormName(struct.name);
    setFormDescription(struct.description || '');
    setFormAcademicYearGradeId(struct.academic_year_grade_id);
    if (struct.components && struct.components.length > 0) {
      setFormComponents(struct.components);
    } else {
      // Fetch full structure to load components
      apiClient.get(`/fees/structures/${struct.id}`).then((res) => {
        if (res.data?.success && res.data?.data?.components) {
          setFormComponents(res.data.data.components);
        }
      });
    }
    setIsCreateModalOpen(true);
  };

  // Save (Create or Update) Structure
  const handleSaveStructure = async () => {
    if (!formName.trim()) {
      toast.error('Please enter a structure name');
      return;
    }
    if (!editModeStructureId && !formAcademicYearGradeId) {
      toast.error('Please select an academic grade');
      return;
    }
    if (formComponents.length === 0) {
      toast.error('A fee structure must contain at least one component');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editModeStructureId) {
        // Update existing structure
        const res = await apiClient.put(`/fees/structures/${editModeStructureId}`, {
          name: formName.trim(),
          description: formDescription.trim() || null,
          components: formComponents,
        });
        if (res.data?.success) {
          toast.success('Fee structure updated successfully.');
          setIsCreateModalOpen(false);
          handleRefresh();
        }
      } else {
        // Create new structure
        const res = await apiClient.post('/fees/structures', {
          name: formName.trim(),
          description: formDescription.trim() || null,
          academic_year_grade_id: formAcademicYearGradeId,
          components: formComponents,
        });
        if (res.data?.success) {
          toast.success('Fee structure created as Draft.');
          setIsCreateModalOpen(false);
          handleRefresh();
        }
      }
    } catch (err: any) {
      console.error('[FeeStructureManagement] Save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish structure
  const handleConfirmPublish = async () => {
    if (!structureToPublish) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/fees/structures/${structureToPublish.id}/publish`);
      if (res.data?.success) {
        toast.success(`Structure "${structureToPublish.name}" published successfully!`);
        setStructureToPublish(null);
        if (isDetailsModalOpen && selectedStructure?.id === structureToPublish.id) {
          setSelectedStructure((prev) => (prev ? { ...prev, status: 'published' } : null));
        }
        handleRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deactivate structure
  const handleConfirmDeactivate = async () => {
    if (!structureToDeactivate) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/fees/structures/${structureToDeactivate.id}/deactivate`);
      if (res.data?.success) {
        toast.success(`Structure "${structureToDeactivate.name}" deactivated.`);
        setStructureToDeactivate(null);
        if (isDetailsModalOpen && selectedStructure?.id === structureToDeactivate.id) {
          setSelectedStructure((prev) => (prev ? { ...prev, status: 'inactive' } : null));
        }
        handleRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to deactivate fee structure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View Details Drawer
  const handleViewDetails = async (struct: FeeStructureItem) => {
    setSelectedStructure(struct);
    setIsDetailsModalOpen(true);
    try {
      const res = await apiClient.get(`/fees/structures/${struct.id}`);
      if (res.data?.success && res.data?.data) {
        setSelectedStructure(res.data.data);
      }
    } catch (err: any) {
      console.warn('[FeeStructureManagement] Error loading detailed structure info:', err);
    }
  };

  // Selected grade details in create modal
  const selectedGradeOption = useMemo(() => {
    return academicYearGrades.find((g) => g.academic_year_grade_id === formAcademicYearGradeId);
  }, [academicYearGrades, formAcademicYearGradeId]);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8 space-y-8 font-sans">
      {/* ── HEADER & BREADCRUMBS ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            <span>Finance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400">Fee Structure Management</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Fee Structure Management
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              Phase 3 • Verified Models
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure academic grade fee schedules, define component breakdowns with decimal accuracy, and preview
            installment allocations.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fee Structure</span>
          </button>
        </div>
      </div>

      {/* ── SUMMARY METRIC CARDS ────────────────────────────────────────── */}
      {summaryMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Structures */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Structures</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {summaryMetrics.totalStructures}
              </span>
              <span className="text-xs font-medium text-slate-500">configured</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {summaryMetrics.publishedStructures} Published
              </span>
              <span>•</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {summaryMetrics.draftStructures} Draft
              </span>
            </div>
          </div>

          {/* Card 2: Published Structures */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Published</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {summaryMetrics.publishedStructures}
              </span>
              <span className="text-xs font-medium text-slate-500">for student billing</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Total active annual value: <strong className="text-slate-800 dark:text-slate-200">₹{summaryMetrics.totalPublishedValue.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Card 3: Fee Components */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fee Components</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ListPlus className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {summaryMetrics.totalComponents}
              </span>
              <span className="text-xs font-medium text-slate-500">defined elements</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Tuition, lab, exam, and extracurricular components
            </div>
          </div>

          {/* Card 4: Grade Coverage */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grade Coverage</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {summaryMetrics.configuredCoveragePercentage}%
              </span>
              <span className="text-xs font-medium text-slate-500">
                ({summaryMetrics.totalStructures}/{summaryMetrics.totalAvailableGrades} grades)
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summaryMetrics.configuredCoveragePercentage)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── FILTER & SEARCH BAR ─────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by structure name, grade, or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Academic Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Year:</span>
            <select
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">All Academic Years</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <RefreshCw className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading fee structures...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-rose-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Unable to Load Structures</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{loadError}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : structures.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto">
              <Layers className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Fee Structures Configured</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                No fee structures match the current filters. Create a new fee structure to start defining academic fees.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all"
            >
              + Create First Fee Structure
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Structure Name</th>
                  <th className="py-3.5 px-4">Grade & Academic Year</th>
                  <th className="py-3.5 px-4 text-center">Components</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Assignments</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {structures.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {s.name}
                      </div>
                      {s.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                          {s.description}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {s.grade?.name || 'Unassigned Grade'}
                        </span>
                        {s.grade?.board && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {s.grade.board}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{s.academic_year?.name || 'Year N/A'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {s.components_count} items
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white text-sm">
                      ₹{s.total_amount?.toLocaleString('en-IN') || '0.00'}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {s.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published</span>
                        </span>
                      ) : s.status === 'draft' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          <Clock className="w-3 h-3" />
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <Archive className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center text-slate-500 font-semibold">
                      {s.assigned_students_count || 0} students
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewDetails(s)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit (only if draft or editable) */}
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          title="Edit Structure"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Publish (if draft) */}
                        {s.status === 'draft' && (
                          <button
                            onClick={() => setStructureToPublish(s)}
                            title="Publish Structure"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Deactivate (if published or draft) */}
                        {s.status !== 'inactive' && (
                          <button
                            onClick={() => setStructureToDeactivate(s)}
                            title="Deactivate Structure"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalCount > 0 && (
          <div className="py-3.5 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * 15 + 1} to {Math.min(currentPage * 15, totalCount)} of {totalCount} structures
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT STRUCTURE MODAL ───────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>{editModeStructureId ? 'Edit Fee Structure' : 'Create New Fee Structure'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Define structural fee breakdown for target academic grade.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Base Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Structure Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard Annual Fee Structure 2026-27"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={150}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {!editModeStructureId && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                    Target Academic Grade <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formAcademicYearGradeId}
                    onChange={(e) => setFormAcademicYearGradeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="">-- Select Grade & Academic Year --</option>
                    {academicYearGrades.map((g) => (
                      <option
                        key={g.academic_year_grade_id}
                        value={g.academic_year_grade_id}
                        disabled={g.is_configured}
                      >
                        {g.grade_name} ({g.grade_code}) • {g.academic_year_name}
                        {g.is_configured ? ' [ALREADY CONFIGURED]' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedGradeOption?.is_configured && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      Note: A fee structure ({selectedGradeOption.existing_structure?.name}) is already assigned to this grade.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                  Description / Notes (Optional)
                </label>
                <textarea
                  placeholder="Additional context regarding payment rules, concessions, or inclusions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* ── INTERACTIVE COMPONENT BUILDER ───────────────────────── */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Fee Components
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add required and optional components. Each must have a unique code and positive amount.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Total Calculated Fee:</span>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    ₹{formTotalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Add Presets:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMPONENT_PRESETS.map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-semibold transition-colors"
                    >
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Component Row */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Component Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Science Lab Fee"
                      value={draftCompName}
                      onChange={(e) => setDraftCompName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Component Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LAB_SCI"
                      value={draftCompCode}
                      onChange={(e) => setDraftCompCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      min="1"
                      step="1"
                      value={draftCompAmount}
                      onChange={(e) => setDraftCompAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftCompMandatory}
                      onChange={(e) => setDraftCompMandatory(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Mandatory Component</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    + Add Component
                  </button>
                </div>
              </div>

              {/* Component List */}
              <div className="space-y-2">
                {formComponents.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{c.component_name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                            {c.component_code}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {c.is_mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        ₹{Number(c.amount).toLocaleString('en-IN')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── INSTALLMENT SCHEDULE PREVIEW ────────────────────────── */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Installment Schedule Preview</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preview of installment plan terms linked to this academic year.
                  </p>
                </div>
              </div>

              {installmentPlans.length > 0 ? (
                <div className="space-y-3">
                  {installmentPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{plan.plan_name}</span>
                        <span className="text-[10px] font-semibold text-slate-400">{plan.terms_count} terms</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {plan.terms.map((term, tIdx) => {
                          const termAmount = Math.round(((term.percentage / 100) * formTotalAmount + Number.EPSILON) * 100) / 100;
                          return (
                            <div
                              key={tIdx}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                            >
                              <div className="font-bold text-slate-700 dark:text-slate-300">{term.term_name}</div>
                              <div className="text-[10px] text-slate-400">{term.percentage}% of total</div>
                              <div className="font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                ₹{termAmount.toLocaleString('en-IN')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    No published installment plans configured for this academic year. Total fee will apply as a one-time full billing demand.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStructure}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editModeStructureId ? 'Update Fee Structure' : 'Save as Draft'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAILS READ-ONLY MODAL ─────────────────────────────────────── */}
      {isDetailsModalOpen && selectedStructure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStructure.name}</h2>
                  {selectedStructure.status === 'published' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      Published
                    </span>
                  ) : selectedStructure.status === 'draft' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                      Draft
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStructure.grade?.name} ({selectedStructure.grade?.code}) • {selectedStructure.academic_year?.name}
                </p>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedStructure.description && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                {selectedStructure.description}
              </div>
            )}

            {/* Component Breakdown Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Component Breakdown</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedStructure.components || []).map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {c.component_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{c.component_code}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                            {c.is_mandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                          ₹{Number(c.amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
                    <tr>
                      <td colSpan={3} className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 text-right">
                        Total Fee:
                      </td>
                      <td className="py-3 px-3 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        ₹{selectedStructure.total_amount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div>
                Created: {new Date(selectedStructure.created_at).toLocaleDateString()} • Updated:{' '}
                {new Date(selectedStructure.updated_at).toLocaleDateString()}
              </div>
              <div>Assigned: {selectedStructure.assigned_students_count || 0} students</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM PUBLISH DIALOG ─────────────────────────────────────── */}
      {structureToPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Publish Fee Structure?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Publishing <strong>"{structureToPublish.name}"</strong> will activate this fee schedule for student assignment and ledger demand billing for the academic grade.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStructureToPublish(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DEACTIVATE DIALOG ──────────────────────────────────── */}
      {structureToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Deactivate Fee Structure?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Deactivating <strong>"{structureToDeactivate.name}"</strong> will archive this structure. Historical payments and existing student ledgers will not be altered.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStructureToDeactivate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Deactivate Structure</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructureManagement;
