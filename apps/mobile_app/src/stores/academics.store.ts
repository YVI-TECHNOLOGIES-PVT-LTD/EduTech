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

export interface StudentAcademicsCache {
  attendance: AttendanceSummary | null;
  timetable: TimetableDay[];
  homework: HomeworkItem[];
  exams: ExamItem[];
  reportCard: ReportCard | null;
  cachedAt: number;
}

interface AcademicsState {
  activeTab: AcademicsTab;
  selectedDay: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  homeworkFilter: 'all' | 'pending' | 'submitted';
  currentStudentId: string | null;
  attendance: AttendanceSummary | null;
  timetable: TimetableDay[];
  homework: HomeworkItem[];
  exams: ExamItem[];
  reportCard: ReportCard | null;
  isLoading: boolean;
  tabLoading: {
    attendance: boolean;
    timetable: boolean;
    homework: boolean;
    exams: boolean;
    reportCard: boolean;
  };
  isError: boolean;
  errorMessage: string | null;
  studentCache: Record<string, StudentAcademicsCache>;

  setActiveTab: (tab: AcademicsTab) => void;
  setSelectedDay: (
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday',
  ) => void;
  setHomeworkFilter: (filter: 'all' | 'pending' | 'submitted') => void;
  fetchStudentAcademics: (studentId: string, force?: boolean) => Promise<void>;
  fetchAttendance: (studentId: string, force?: boolean) => Promise<void>;
  fetchTimetable: (studentId: string, force?: boolean) => Promise<void>;
  fetchHomework: (studentId: string, force?: boolean) => Promise<void>;
  fetchExams: (studentId: string, force?: boolean) => Promise<void>;
  fetchReportCard: (studentId: string, term?: string, force?: boolean) => Promise<void>;
  loadActiveTabOnly: (studentId: string, force?: boolean) => Promise<void>;
  markHomeworkSubmitted: (homeworkId: string) => void;
  clear: () => void;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes in-memory cache

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
  currentStudentId: null,
  attendance: null,
  timetable: [],
  homework: [],
  exams: [],
  reportCard: null,
  isLoading: false,
  tabLoading: {
    attendance: false,
    timetable: false,
    homework: false,
    exams: false,
    reportCard: false,
  },
  isError: false,
  errorMessage: null,
  studentCache: {},

  setActiveTab: (activeTab: AcademicsTab) => {
    set({ activeTab });
    const { currentStudentId } = get();
    if (currentStudentId) {
      get().loadActiveTabOnly(currentStudentId);
    }
  },
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  setHomeworkFilter: (homeworkFilter) => set({ homeworkFilter }),

  loadActiveTabOnly: async (studentId: string, force = false) => {
    if (!studentId) return;
    const { activeTab, currentStudentId, studentCache } = get();

    // Hydrate cached data for new student immediately
    if (currentStudentId !== studentId) {
      const cached = studentCache[studentId];
      set({
        currentStudentId: studentId,
        attendance: cached?.attendance || null,
        timetable: cached?.timetable || [],
        homework: cached?.homework || [],
        exams: cached?.exams || [],
        reportCard: cached?.reportCard || null,
      });
    }

    // Demand-driven: Fetch ONLY the active tab's endpoint
    switch (activeTab) {
      case 'attendance':
        await get().fetchAttendance(studentId, force);
        break;
      case 'timetable':
        await get().fetchTimetable(studentId, force);
        break;
      case 'homework':
        await get().fetchHomework(studentId, force);
        break;
      case 'exams':
        await get().fetchExams(studentId, force);
        break;
    }
  },

  fetchStudentAcademics: async (studentId: string, force = false) => {
    if (!studentId) return;

    const { studentCache, currentStudentId } = get();
    const cached = studentCache[studentId];
    const isCacheFresh = cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;

    // Fast path: Return cached child academics immediately if fresh and not forced
    if (!force && isCacheFresh) {
      set({
        currentStudentId: studentId,
        attendance: cached.attendance,
        timetable: cached.timetable,
        homework: cached.homework,
        exams: cached.exams,
        reportCard: cached.reportCard,
        isLoading: false,
        isError: false,
        errorMessage: null,
      });
      return;
    }

    // If switching student without fresh cache, clear old child's data immediately to avoid flash
    if (currentStudentId !== studentId) {
      set({
        currentStudentId: studentId,
        attendance: cached?.attendance || null,
        timetable: cached?.timetable || [],
        homework: cached?.homework || [],
        exams: cached?.exams || [],
        reportCard: cached?.reportCard || null,
      });
    }

    set({ isLoading: true, isError: false, errorMessage: null });
    try {
      const [att, tt, hw, ex, rep] = await Promise.all([
        academicsApi.getAttendance(studentId),
        academicsApi.getTimetable(studentId),
        academicsApi.getHomework(studentId),
        academicsApi.getExams(studentId),
        academicsApi.getReportCard(studentId),
      ]);

      const freshEntry: StudentAcademicsCache = {
        attendance: att,
        timetable: tt,
        homework: hw,
        exams: ex,
        reportCard: rep,
        cachedAt: Date.now(),
      };

      set((state) => ({
        attendance: att,
        timetable: tt,
        homework: hw,
        exams: ex,
        reportCard: rep,
        isLoading: false,
        studentCache: {
          ...state.studentCache,
          [studentId]: freshEntry,
        },
      }));
    } catch (err: any) {
      set({
        isLoading: false,
        isError: true,
        errorMessage: err?.message || 'Failed to fetch academic records',
      });
    }
  },

  fetchAttendance: async (studentId: string, force = false) => {
    if (!studentId) return;
    const { studentCache, attendance, currentStudentId, tabLoading } = get();
    const isCached =
      !force &&
      currentStudentId === studentId &&
      attendance !== null &&
      studentCache[studentId]?.attendance;
    if (isCached) return;

    set({ tabLoading: { ...tabLoading, attendance: true } });
    try {
      const att = await academicsApi.getAttendance(studentId);
      set((state) => ({
        currentStudentId: studentId,
        attendance: att,
        tabLoading: { ...state.tabLoading, attendance: false },
        studentCache: {
          ...state.studentCache,
          [studentId]: {
            ...(state.studentCache[studentId] || {
              timetable: [],
              homework: [],
              exams: [],
              reportCard: null,
            }),
            attendance: att,
            cachedAt: Date.now(),
          },
        },
      }));
    } catch (err: any) {
      set((state) => ({
        tabLoading: { ...state.tabLoading, attendance: false },
        isError: true,
        errorMessage: err?.message || 'Failed to fetch attendance',
      }));
    }
  },

  fetchTimetable: async (studentId: string, force = false) => {
    if (!studentId) return;
    const { timetable, currentStudentId, tabLoading, studentCache } = get();
    const isCached =
      !force &&
      currentStudentId === studentId &&
      timetable.length > 0 &&
      studentCache[studentId]?.timetable;
    if (isCached) return;

    set({ tabLoading: { ...tabLoading, timetable: true } });
    try {
      const tt = await academicsApi.getTimetable(studentId);
      set((state) => ({
        currentStudentId: studentId,
        timetable: tt,
        tabLoading: { ...state.tabLoading, timetable: false },
        studentCache: {
          ...state.studentCache,
          [studentId]: {
            ...(state.studentCache[studentId] || {
              attendance: null,
              homework: [],
              exams: [],
              reportCard: null,
            }),
            timetable: tt,
            cachedAt: Date.now(),
          },
        },
      }));
    } catch (err: any) {
      set((state) => ({
        tabLoading: { ...state.tabLoading, timetable: false },
        isError: true,
        errorMessage: err?.message || 'Failed to fetch timetable',
      }));
    }
  },

  fetchHomework: async (studentId: string, force = false) => {
    if (!studentId) return;
    const { homework, currentStudentId, tabLoading, studentCache } = get();
    const isCached =
      !force &&
      currentStudentId === studentId &&
      homework.length > 0 &&
      studentCache[studentId]?.homework;
    if (isCached) return;

    set({ tabLoading: { ...tabLoading, homework: true } });
    try {
      const hw = await academicsApi.getHomework(studentId);
      set((state) => ({
        currentStudentId: studentId,
        homework: hw,
        tabLoading: { ...state.tabLoading, homework: false },
        studentCache: {
          ...state.studentCache,
          [studentId]: {
            ...(state.studentCache[studentId] || {
              attendance: null,
              timetable: [],
              exams: [],
              reportCard: null,
            }),
            homework: hw,
            cachedAt: Date.now(),
          },
        },
      }));
    } catch (err: any) {
      set((state) => ({
        tabLoading: { ...state.tabLoading, homework: false },
        isError: true,
        errorMessage: err?.message || 'Failed to fetch homework',
      }));
    }
  },

  fetchExams: async (studentId: string, force = false) => {
    if (!studentId) return;
    const { exams, currentStudentId, tabLoading, studentCache } = get();
    const isCached =
      !force &&
      currentStudentId === studentId &&
      exams.length > 0 &&
      studentCache[studentId]?.exams;
    if (isCached) return;

    set({ tabLoading: { ...tabLoading, exams: true } });
    try {
      const ex = await academicsApi.getExams(studentId);
      set((state) => ({
        currentStudentId: studentId,
        exams: ex,
        tabLoading: { ...state.tabLoading, exams: false },
        studentCache: {
          ...state.studentCache,
          [studentId]: {
            ...(state.studentCache[studentId] || {
              attendance: null,
              timetable: [],
              homework: [],
              reportCard: null,
            }),
            exams: ex,
            cachedAt: Date.now(),
          },
        },
      }));
    } catch (err: any) {
      set((state) => ({
        tabLoading: { ...state.tabLoading, exams: false },
        isError: true,
        errorMessage: err?.message || 'Failed to fetch exams',
      }));
    }
  },

  fetchReportCard: async (studentId: string, term?: string, force = false) => {
    if (!studentId) return;
    const { reportCard, currentStudentId, tabLoading, studentCache } = get();
    const isCached =
      !force &&
      currentStudentId === studentId &&
      reportCard !== null &&
      studentCache[studentId]?.reportCard;
    if (isCached) return;

    set({ tabLoading: { ...tabLoading, reportCard: true } });
    try {
      const rep = await academicsApi.getReportCard(studentId, term);
      set((state) => ({
        currentStudentId: studentId,
        reportCard: rep,
        tabLoading: { ...state.tabLoading, reportCard: false },
        studentCache: {
          ...state.studentCache,
          [studentId]: {
            ...(state.studentCache[studentId] || {
              attendance: null,
              timetable: [],
              homework: [],
              exams: [],
            }),
            reportCard: rep,
            cachedAt: Date.now(),
          },
        },
      }));
    } catch (err: any) {
      set((state) => ({
        tabLoading: { ...state.tabLoading, reportCard: false },
        isError: true,
        errorMessage: err?.message || 'Failed to fetch report card',
      }));
    }
  },

  markHomeworkSubmitted: (homeworkId: string) => {
    const { homework, currentStudentId, studentCache } = get();
    const updated = homework.map((hw) =>
      hw.id === homeworkId
        ? {
            ...hw,
            status: 'submitted' as const,
            submissionDate: new Date().toISOString().split('T')[0],
          }
        : hw,
    );
    set({
      homework: updated,
      ...(currentStudentId && studentCache[currentStudentId]
        ? {
            studentCache: {
              ...studentCache,
              [currentStudentId]: {
                ...studentCache[currentStudentId],
                homework: updated,
              },
            },
          }
        : {}),
    });
  },

  clear: () => {
    set({
      activeTab: 'attendance',
      selectedDay: 'Monday',
      homeworkFilter: 'all',
      currentStudentId: null,
      attendance: null,
      timetable: [],
      homework: [],
      exams: [],
      reportCard: null,
      isLoading: false,
      isError: false,
      errorMessage: null,
      studentCache: {},
    });
  },
}));
