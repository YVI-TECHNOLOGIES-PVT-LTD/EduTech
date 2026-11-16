import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { BookOpen, FileText, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CurriculumPlan {
  curriculum_plan_id: string;
  plan_title: string;
  plan_description: string | null;
  status: string;
  version_number: number;
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
  curriculum_plan_units: Array<{
    curriculum_unit_id: string;
    unit_code: string | null;
    unit_title: string;
    unit_description: string | null;
    sequence_number: number;
    planned_duration_periods: number | null;
    curriculum_learning_outcomes: Array<{ outcome_id: string }>;
    lesson_plans: Array<{
      lesson_plan_id: string;
      lesson_title: string;
      duration_minutes: number | null;
    }>;
  }>;
}

export const TeacherCurriculumPage: React.FC = () => {
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurriculum = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/curriculum');
      setPlans(res.data?.data || res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load curriculum plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Curriculum & Syllabus Plans
          </h1>
          <p className="text-sm text-slate-500">
            Published course syllabi, unit sequences, and learning outcomes for your assigned
            subjects.
          </p>
        </div>
        <button
          onClick={fetchCurriculum}
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

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading curriculum plans...</div>
      ) : plans.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No published curriculum plans found for your assigned subjects.
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => {
            const sub = plan.academic_year_grade_subjects?.subjects;
            const grade = plan.academic_year_grade_subjects?.academic_year_grades?.grades;

            return (
              <div
                key={plan.curriculum_plan_id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
                      <BookOpen className="w-4 h-4" />
                      {grade?.grade_name} • {sub?.subject_name} ({sub?.subject_code})
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{plan.plan_title}</h2>
                    {plan.plan_description && (
                      <p className="text-xs text-slate-500 mt-1">{plan.plan_description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold uppercase">
                      {plan.status}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-xs font-mono">
                      v{plan.version_number}
                    </span>
                  </div>
                </div>

                {/* Units List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Syllabus Units ({plan.curriculum_plan_units?.length || 0})
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.curriculum_plan_units?.map((unit) => (
                      <div
                        key={unit.curriculum_unit_id}
                        className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                              Unit {unit.sequence_number}{' '}
                              {unit.unit_code ? `• ${unit.unit_code}` : ''}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                              {unit.unit_title}
                            </h4>
                            {unit.unit_description && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                {unit.unit_description}
                              </p>
                            )}
                          </div>
                          {unit.planned_duration_periods && (
                            <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 flex-shrink-0">
                              {unit.planned_duration_periods} Periods
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                          <span className="text-slate-500">
                            {unit.curriculum_learning_outcomes?.length || 0} Learning Outcomes
                          </span>
                          <span className="font-semibold text-teal-700 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {unit.lesson_plans?.length || 0} Lesson Plans
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
