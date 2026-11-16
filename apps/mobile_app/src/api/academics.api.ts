import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
  records: AttendanceRecord[];
}

export interface TimetablePeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  room: string;
  isBreak?: boolean;
}

export interface TimetableDay {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periods: TimetablePeriod[];
}

export interface HomeworkItem {
  id: string;
  title: string;
  subject: string;
  assignedDate: string;
  dueDate: string;
  description: string;
  status: 'pending' | 'submitted';
  submissionDate?: string;
}

export interface ExamItem {
  id: string;
  examName: string;
  subject: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  totalMarks: number;
  instructions?: string;
}

export interface ExamResultItem {
  id: string;
  examName: string;
  term: string;
  subject: string;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  remarks?: string;
}

export interface ReportCard {
  term: string;
  academicYear: string;
  overallGrade: string;
  gpa: number;
  attendancePercentage: number;
  results: ExamResultItem[];
  teacherRemarks?: string;
}

export const academicsApi = {
  /**
   * Fetch attendance summary and monthly timeline for student
   */
  async getAttendance(studentId: string, month?: string): Promise<AttendanceSummary> {
    try {
      const url = month
        ? `${ENDPOINTS.ACADEMICS.ATTENDANCE_SUMMARY(studentId)}?month=${month}`
        : ENDPOINTS.ACADEMICS.ATTENDANCE_SUMMARY(studentId);
      const res = await apiClient.get<any>(url);
      if (res?.data) return res.data;
      if (res?.percentage !== undefined) return res;
    } catch {
      // Graceful fallback to default empty attendance representation
    }
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      percentage: 0,
      records: [],
    };
  },

  /**
   * Fetch weekly timetable schedule
   */
  async getTimetable(studentId: string): Promise<TimetableDay[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.ACADEMICS.TIMETABLE_WEEK(studentId));
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Fetch homework assignments list
   */
  async getHomework(studentId: string): Promise<HomeworkItem[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.ACADEMICS.HOMEWORK(studentId));
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Fetch upcoming exams schedule
   */
  async getExams(studentId: string): Promise<ExamItem[]> {
    try {
      const res = await apiClient.get<any>(ENDPOINTS.ACADEMICS.EXAMS(studentId));
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch {
      // Graceful fallback
    }
    return [];
  },

  /**
   * Fetch exam results and term report cards
   */
  async getReportCard(studentId: string, term?: string): Promise<ReportCard | null> {
    try {
      const url = term
        ? `${ENDPOINTS.ACADEMICS.RESULTS(studentId)}?term=${term}`
        : ENDPOINTS.ACADEMICS.RESULTS(studentId);
      const res = await apiClient.get<any>(url);
      if (res?.data) return res.data;
      if (res?.overallGrade) return res;
    } catch {
      // Graceful fallback
    }
    return null;
  },
};
