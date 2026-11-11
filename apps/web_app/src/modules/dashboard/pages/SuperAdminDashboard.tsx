import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  ShieldAlert,
  Building2,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  Clock,
  Sparkles,
  FolderCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SuperAdminOverview {
  academic_years_count: number;
  active_academic_year: {
    academic_year_id: string;
    academic_year_name: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  grades_count: number;
  sections_count: number;
  faculty_assignments_count: number;
  curriculum_plans_count: number;
  lesson_plans_count: number;
  timetable_entries_count: number;
  learning_resources_count: number;
  published_timetable_versions_count: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const [data, setData] = useState<SuperAdminOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/superadmin/overview');
      setData(res.data?.data || res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load enterprise academic overview',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            Enterprise Institutional Governance
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Super Administrator Dashboard
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Cross-organizational oversight, academic lifecycle health, and tenant governance
            controls.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Active Academic Year Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Active Session
              </div>
              <div className="text-lg font-bold text-slate-900">
                {data?.active_academic_year
                  ? data.active_academic_year.academic_year_name
                  : loading
                    ? 'Loading...'
                    : 'No Active Academic Session'}
              </div>
            </div>
          </div>
          {data?.active_academic_year && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold uppercase">
              {data.active_academic_year.status}
            </span>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>TOTAL ACADEMIC YEARS</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.academic_years_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Configured institutional years</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>OFFERED GRADES</span>
            <GraduationCap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.grades_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Academic grade tiers</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>ACTIVE SECTIONS</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.sections_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Classroom section divisions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>FACULTY ASSIGNMENTS</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.faculty_assignments_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Section-subject-teacher mappings</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>CURRICULUM PLANS</span>
            <BookOpen className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.curriculum_plans_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Subject curricula & syllabi</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>AUTHORED LESSON PLANS</span>
            <Sparkles className="w-4 h-4 text-fuchsia-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.lesson_plans_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">AI & teacher structured plans</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>TIMETABLE SLOTS</span>
            <Clock className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.timetable_entries_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.published_timetable_versions_count ?? 0} published versions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>DIGITAL RESOURCES</span>
            <FolderCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.learning_resources_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Cataloged learning assets</div>
        </div>
      </div>

      {/* Strategic Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <Link
          to="/app/academic/readiness"
          className="group p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Academic Readiness Engine
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Audit system configuration completeness across 12 operational academic domains.
          </p>
        </Link>

        <Link
          to="/app/academic/structure"
          className="group p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
            Academic Structure & Hierarchy
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic sessions, grade offerings, curriculum frameworks, and classrooms.
          </p>
        </Link>

        <Link
          to="/app/admin/dashboard"
          className="group p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-500 hover:shadow-md transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition">
            School Administrative Portal
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Access daily operational administration, staff directories, admissions, and finance
            desks.
          </p>
        </Link>
      </div>
    </div>
  );
};
