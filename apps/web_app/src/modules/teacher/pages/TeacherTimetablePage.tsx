import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import { Clock, Calendar, AlertTriangle, RefreshCw, DoorClosed } from 'lucide-react';

interface TimetableEntry {
  timetable_entry_id: string;
  weekday: number;
  lesson_type: string;
  lesson_topic: string | null;
  notes: string | null;
  bell_schedule_periods?: {
    period_name: string;
    start_time: string;
    end_time: string;
    period_number: number;
  };
  sections?: {
    section_name: string;
    academic_year_grades?: {
      grades?: {
        grade_name: string;
      };
    };
  };
  academic_year_grade_subjects?: {
    subjects?: {
      subject_name: string;
      subject_code: string;
    };
  };
  classrooms?: {
    room_name: string;
    room_code: string;
  } | null;
}

const WEEKDAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

export const TeacherTimetablePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const staffId = searchParams.get('staff_id');
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimetable = async (weekday: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<any>('/v1/academic/teacher/timetable', {
        params: {
          weekday,
          ...(staffId ? { staff_id: staffId } : {}),
        },
      });
      setEntries(res.data?.data || res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable(selectedWeekday);
  }, [selectedWeekday]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Teaching Timetable
          </h1>
          <p className="text-sm text-slate-500">
            Official published period schedules and classroom allocations.
          </p>
        </div>
        <button
          onClick={() => fetchTimetable(selectedWeekday)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Weekday Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {WEEKDAYS.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedWeekday(day.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
              selectedWeekday === day.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {day.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading schedule...</div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No teaching periods scheduled on this weekday.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const period = entry.bell_schedule_periods;
            const subName = entry.academic_year_grade_subjects?.subjects?.subject_name || 'Subject';
            const subCode = entry.academic_year_grade_subjects?.subjects?.subject_code || '';
            const gradeName = entry.sections?.academic_year_grades?.grades?.grade_name || '';
            const secName = entry.sections?.section_name || '';
            const room = entry.classrooms?.room_name || entry.classrooms?.room_code;

            return (
              <div
                key={entry.timetable_entry_id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-teal-500 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-5">
                  <div className="w-20 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex-shrink-0">
                    <div className="text-xs font-extrabold text-slate-800">
                      {period?.period_name || `P${period?.period_number || ''}`}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {period?.start_time
                        ? String(period.start_time).substring(11, 16) ||
                          String(period.start_time).substring(0, 5)
                        : ''}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-base">
                      {subName}{' '}
                      {subCode && <span className="text-xs text-slate-400">({subCode})</span>}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-3">
                      <span className="font-semibold text-slate-800">
                        {gradeName} — Section {secName}
                      </span>
                      {room && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <DoorClosed className="w-3.5 h-3.5" /> Room {room}
                        </span>
                      )}
                    </div>
                    {entry.lesson_topic && (
                      <div className="text-xs text-teal-700 font-medium">
                        Topic: {entry.lesson_topic}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs text-slate-400 italic">Notes: {entry.notes}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-bold uppercase tracking-wider">
                    {entry.lesson_type}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
