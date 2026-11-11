import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LessonPlanItem {
  lesson_plan_id: string;
  lesson_title: string;
  lesson_summary: string | null;
  sequence_number: number;
  planned_date: string | null;
  duration_minutes: number | null;
  teaching_approach: string | null;
  prerequisite_knowledge: string | null;
  curriculum_plan_units?: {
    unit_title: string;
    unit_code: string | null;
    curriculum_plans?: {
      plan_title: string;
      academic_year_grade_subjects?: {
        subjects?: {
          subject_name: string;
          subject_code: string;
        };
        academic_year_grades?: {
          grades?: {
            grade_name: string;
          };
        };
      };
    };
  };
  lesson_activities?: any[];
  lesson_exit_tickets?: any[];
}

export const TeacherLessonPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessonPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/lesson-plans');
      setPlans(res.data?.data || res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonPlans();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Authored Lesson Plans
          </h1>
          <p className="text-sm text-slate-500">
            Structured lesson plans, pedagogical activities, and instructional materials created by
            you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/app/academic/lesson-planning"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            AI Lesson Assistant
          </Link>
          <button
            onClick={fetchLessonPlans}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading your lesson plans...</div>
      ) : plans.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm space-y-3">
          <p>You have not authored any lesson plans yet.</p>
          <Link
            to="/app/academic/lesson-planning"
            className="inline-flex items-center gap-2 text-teal-600 font-bold hover:underline text-xs"
          >
            Launch AI Lesson Planning Assistant
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Plans: {plans.length}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const unit = plan.curriculum_plan_units;
              const sub = unit?.curriculum_plans?.academic_year_grade_subjects?.subjects;
              const grade =
                unit?.curriculum_plans?.academic_year_grade_subjects?.academic_year_grades?.grades;

              return (
                <div
                  key={plan.lesson_plan_id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Lesson {plan.sequence_number}
                      </span>
                      {plan.duration_minutes && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {plan.duration_minutes} min
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{plan.lesson_title}</h3>

                    {plan.lesson_summary && (
                      <p className="text-xs text-slate-500 line-clamp-2">{plan.lesson_summary}</p>
                    )}

                    <div className="text-xs text-slate-600 space-y-1 pt-1">
                      <div className="font-medium text-slate-700">
                        {grade?.grade_name} • {sub?.subject_name}
                      </div>
                      <div className="text-slate-400 text-[11px]">Unit: {unit?.unit_title}</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span>{plan.lesson_activities?.length || 0} Activities</span>
                      <span>{plan.lesson_exit_tickets?.length || 0} Exit Tickets</span>
                    </div>
                    {plan.planned_date && (
                      <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {new Date(plan.planned_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
