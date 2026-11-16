import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import { Layers, Users, DoorClosed, AlertTriangle, RefreshCw } from 'lucide-react';

interface AssignedSection {
  section_id: string;
  section_name: string;
  room_no?: string | null;
  capacity?: number | null;
  grade_id: string;
  grade_name: string;
  grade_code: string;
  academic_year_name: string;
  assignment_role: string;
  subjects: Array<{
    academic_year_grade_subject_id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
  }>;
}

export const TeacherClassesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staff_id');
  const [classes, setClasses] = useState<AssignedSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/classes', {
        params: staffId ? { staff_id: staffId } : undefined,
      });
      setClasses(res.data?.data || res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load assigned classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Classes & Sections
          </h1>
          <p className="text-sm text-slate-500">
            Classrooms and sections assigned to you for teaching and class mentorship.
          </p>
        </div>
        <button
          onClick={fetchClasses}
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
        <div className="py-16 text-center text-slate-400 text-sm">Loading assigned classes...</div>
      ) : classes.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No class sections currently assigned to your profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.section_id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    {cls.grade_code}
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-1">
                    {cls.grade_name} — Section {cls.section_name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">{cls.academic_year_name}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                    cls.assignment_role === 'class_teacher'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {cls.assignment_role.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <DoorClosed className="w-4 h-4 text-slate-400" />
                  <span>Room: {cls.room_no || 'Unassigned'}</span>
                </div>
                {cls.capacity && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Capacity: {cls.capacity}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Assigned Subjects
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cls.subjects && cls.subjects.length > 0 ? (
                    cls.subjects.map((sub) => (
                      <span
                        key={sub.academic_year_grade_subject_id}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-medium"
                      >
                        {sub.subject_name} ({sub.subject_code})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No direct subjects (Class Teacher)
                    </span>
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
