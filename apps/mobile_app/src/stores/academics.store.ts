import { create } from 'zustand';
import {
  academicsApi,
  AttendanceSummary,
  TimetableDay,
  HomeworkItem,
  ExamItem,
  ReportCard,
} from '../api/academics.api';

export type AcademicsTab = 'attendance' | 'timetable' | 'homework' | 'exams';

interface AcademicsState {
  activeTab: AcademicsTab;
  selectedDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  homeworkFilter: 'all' | 'pending' | 'submitted';
  attendance: AttendanceSummary | null;
  timetable: TimetableDay[];
  homework: HomeworkItem[];
  exams: ExamItem[];
  reportCard: ReportCard | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;

  setActiveTab: (tab: AcademicsTab) => void;
  setSelectedDay: (
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday',
  ) => void;
  setHomeworkFilter: (filter: 'all' | 'pending' | 'submitted') => void;
  fetchStudentAcademics: (studentId: string) => Promise<void>;
  markHomeworkSubmitted: (homeworkId: string) => void;
  clear: () => void;
}

const getCurrentDayOfWeek = ():
  'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' => {
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Monday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayIndex = new Date().getDay();
  return days[dayIndex] || 'Monday';
};

export const useAcademicsStore = create<AcademicsState>((set, get) => ({
  activeTab: 'attendance',
  selectedDay: getCurrentDayOfWeek(),
  homeworkFilter: 'all',
  attendance: null,
  timetable: [],
  homework: [],
  exams: [],
  reportCard: null,
  isLoading: false,
  isError: false,
  errorMessage: null,

  setActiveTab: (activeTab: AcademicsTab) => set({ activeTab }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  setHomeworkFilter: (homeworkFilter) => set({ homeworkFilter }),

  fetchStudentAcademics: async (studentId: string) => {
    if (!studentId) return;
    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const [att, tt, hw, ex, rep] = await Promise.all([
        academicsApi.getAttendance(studentId),
        academicsApi.getTimetable(studentId),
        academicsApi.getHomework(studentId),
        academicsApi.getExams(studentId),
        academicsApi.getReportCard(studentId),
      ]);

      set({
        attendance: att,
        timetable: tt,
        homework: hw,
        exams: ex,
        reportCard: rep,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        isError: true,
        errorMessage: err?.message || 'Failed to fetch academic records',
      });
    }
  },

  markHomeworkSubmitted: (homeworkId: string) => {
    const { homework } = get();
    const updated = homework.map((hw) =>
      hw.id === homeworkId
        ? {
            ...hw,
            status: 'submitted' as const,
            submissionDate: new Date().toISOString().split('T')[0],
          }
        : hw,
    );
    set({ homework: updated });
  },

  clear: () => {
    set({
      activeTab: 'attendance',
      selectedDay: 'Monday',
      homeworkFilter: 'all',
      attendance: null,
      timetable: [],
      homework: [],
      exams: [],
      reportCard: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
    });
  },
}));
