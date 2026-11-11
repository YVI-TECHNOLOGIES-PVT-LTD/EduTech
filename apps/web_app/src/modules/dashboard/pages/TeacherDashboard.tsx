import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Users,
  BookOpen,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  FolderCheck,
  BarChart3,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

interface TodayScheduleEntry {
  entry_id: string;
  weekday: number;
  period_name: string;
  start_time: string;
  end_time: string;
  section_name: string;
  grade_name: string;
  subject_name: string;
  subject_code: string;
  classroom: string | null;
  lesson_type: string;
  topic: string | null;
}

interface TeacherDashboardData {
  teacher_staff_id: string;
  current_weekday: number;
  assigned_sections_count: number;
  assigned_subjects_count: number;
  total_weekly_periods: number;
  today_periods_count: number;
  authored_lesson_plans_count: number;
  today_schedule: TodayScheduleEntry[];
  sections_summary: Array<{
    section_id: string;
    section_name: string;
    grade_name: string;
    assignment_role: string;
    subjects: Array<{ subject_name: string }>;
  }>;
  workload_summary: {
    total_weekly_periods: number;
    daily_average_periods: number;
    weekday_distribution: Record<number, number>;
  };
}

const WEEKDAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TeacherDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staff_id');
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/dashboard', {
        params: staffId ? { staff_id: staffId } : undefined,
      });
      setData(res.data?.data || res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load teacher workspace data',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const weekdayName = data?.current_weekday ? WEEKDAYS[data.current_weekday] : 'Today';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-cyan-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Faculty & Teaching Workspace
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Teacher Dashboard</h1>
          <p className="text-teal-100 text-sm mt-1">
            Overview of your daily teaching schedule, assigned classes, and curriculum preparation.
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-semibold transition disabled:opacity-50"
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
            <span>TODAY'S TEACHING PERIODS</span>
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.today_periods_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{weekdayName}'s scheduled classes</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>ASSIGNED SECTIONS</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.assigned_sections_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Class divisions assigned to you</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>ASSIGNED SUBJECTS</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.assigned_subjects_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Subjects across grades</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>MY LESSON PLANS</span>
            <Sparkles className="w-4 h-4 text-fuchsia-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {loading ? '-' : (data?.authored_lesson_plans_count ?? 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Authored curriculum plans</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Column */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <h2 className="font-bold text-slate-900">Today's Class Schedule ({weekdayName})</h2>
            </div>
            <Link
              to="/app/teacher/timetable"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading schedule...</div>
          ) : !data?.today_schedule || data.today_schedule.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No scheduled teaching periods for today. Enjoy your preparation time!
            </div>
          ) : (
            <div className="space-y-3">
              {data.today_schedule.map((entry) => (
                <div
                  key={entry.entry_id}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg hover:border-teal-200 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 text-center">
                      <div className="text-xs font-bold text-slate-700">{entry.period_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {entry.start_time ? entry.start_time.substring(0, 5) : ''}
                      </div>
                    </div>
                    <div className="border-l border-slate-200 pl-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {entry.subject_name} ({entry.subject_code})
                      </div>
                      <div className="text-xs text-slate-500">
                        {entry.grade_name} — Section {entry.section_name}
                        {entry.classroom ? ` • Room ${entry.classroom}` : ''}
                      </div>
                      {entry.topic && (
                        <div className="text-xs text-teal-700 font-medium mt-1">
                          Topic: {entry.topic}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-md font-semibold uppercase">
                    {entry.lesson_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Classes Quick List */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">My Classes</h2>
            </div>
            <Link
              to="/app/teacher/classes"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading classes...</div>
          ) : !data?.sections_summary || data.sections_summary.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No classes assigned yet.</div>
          ) : (
            <div className="space-y-2">
              {data.sections_summary.map((sec) => (
                <div
                  key={sec.section_id}
                  className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">
                      {sec.grade_name} - {sec.section_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {sec.subjects?.map((s) => s.subject_name).join(', ') || 'No subject'}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {sec.assignment_role.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <Link
              to="/app/teacher/lesson-plans"
              className="w-full flex items-center justify-between p-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Lesson Planning Assistant
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/app/teacher/workload"
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                Teaching Workload Analysis
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/app/academic/resources"
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-bold transition"
            >
              <span className="flex items-center gap-2">
                <FolderCheck className="w-4 h-4 text-slate-600" />
                Digital Resource Library
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
