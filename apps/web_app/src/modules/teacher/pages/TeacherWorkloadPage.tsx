import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import { BarChart3, Clock, Layers, BookOpen, AlertTriangle, RefreshCw } from 'lucide-react';

interface WorkloadData {
  total_weekly_periods: number;
  total_assigned_sections: number;
  total_assigned_subjects: number;
  weekday_distribution: Record<number, number>;
  daily_average_periods: number;
}

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export const TeacherWorkloadPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staff_id');
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/workload', {
        params: staffId ? { staff_id: staffId } : undefined,
      });
      setWorkload(res.data?.data || res.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load workload metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Teaching Workload & Metrics
          </h1>
          <p className="text-sm text-slate-500">
            Teaching period distribution, workload balancing, and contact hours analysis.
          </p>
        </div>
        <button
          onClick={fetchWorkload}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>WEEKLY PERIODS</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (workload?.total_weekly_periods ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total instructional periods/wk</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>DAILY AVERAGE</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (workload?.daily_average_periods ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Average periods per school day</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>ASSIGNED SECTIONS</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (workload?.total_assigned_sections ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Classroom divisions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>SUBJECT OFFERINGS</span>
            <BookOpen className="w-4 h-4 text-fuchsia-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (workload?.total_assigned_subjects ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Subjects taught</div>
        </div>
      </div>

      {/* Weekday Distribution Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Weekday Period Load Distribution</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading workload analysis...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((dayNum) => {
              const count = workload?.weekday_distribution?.[dayNum] ?? 0;
              const maxPeriods = 8;
              const percent = Math.min(100, Math.round((count / maxPeriods) * 100));

              return (
                <div
                  key={dayNum}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-3"
                >
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {WEEKDAY_NAMES[dayNum]}
                  </div>
                  <div className="text-2xl font-black text-slate-900">{count}</div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {count === 0 ? 'No periods' : `${count} periods`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
