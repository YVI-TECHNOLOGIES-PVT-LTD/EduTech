import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { BookOpen, Layers, AlertTriangle, RefreshCw } from 'lucide-react';

interface AssignedSubject {
  academic_year_grade_subject_id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  grade_name: string;
  grade_code: string;
  academic_year_name: string;
  sections: Array<{
    section_id: string;
    section_name: string;
    assignment_role: string;
  }>;
}

export const TeacherSubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/subjects');
      setSubjects(res.data?.data || res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assigned subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Teaching Subjects
          </h1>
          <p className="text-sm text-slate-500">
            Disciplines, course offerings, and syllabus units mapped to your profile.
          </p>
        </div>
        <button
          onClick={fetchSubjects}
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
        <div className="py-16 text-center text-slate-400 text-sm">Loading assigned subjects...</div>
      ) : subjects.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No subjects currently mapped to your teaching profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.academic_year_grade_subject_id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {sub.subject_code}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-1">{sub.subject_name}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {sub.grade_name} ({sub.grade_code})
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Assigned Sections ({sub.sections?.length || 0})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sub.sections && sub.sections.length > 0 ? (
                    sub.sections.map((sec) => (
                      <span
                        key={sec.section_id}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                      >
                        Section {sec.section_name} ({sec.assignment_role})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">None</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
