import { useQuery } from '@tanstack/react-query';
import {
  academicsApi,
  AttendanceSummary,
  TimetableDay,
  HomeworkItem,
  ExamItem,
  ReportCard,
} from '../../../api/academics.api';
import { QUERY_KEYS } from '../../../api/query-keys';

/**
 * On-demand query hook for student attendance
 */
export function useStudentAttendance(studentId?: string, month?: string) {
  return useQuery<AttendanceSummary, Error>({
    queryKey: QUERY_KEYS.academics.attendance(studentId || '', month),
    queryFn: () => academicsApi.getAttendance(studentId!, month),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

/**
 * On-demand query hook for student weekly timetable
 */
export function useStudentTimetable(studentId?: string) {
  return useQuery<TimetableDay[], Error>({
    queryKey: QUERY_KEYS.academics.timetable(studentId || ''),
    queryFn: () => academicsApi.getTimetable(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

/**
 * On-demand query hook for student homework
 */
export function useStudentHomework(studentId?: string) {
  return useQuery<HomeworkItem[], Error>({
    queryKey: QUERY_KEYS.academics.homework(studentId || ''),
    queryFn: () => academicsApi.getHomework(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  });
}

/**
 * On-demand query hook for student upcoming exams
 */
export function useStudentExams(studentId?: string) {
  return useQuery<ExamItem[], Error>({
    queryKey: QUERY_KEYS.academics.exams(studentId || ''),
    queryFn: () => academicsApi.getExams(studentId!),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * On-demand query hook for student report card / exam results
 */
export function useStudentReportCard(studentId?: string, term?: string) {
  return useQuery<ReportCard | null, Error>({
    queryKey: QUERY_KEYS.academics.reportCard(studentId || '', term),
    queryFn: () => academicsApi.getReportCard(studentId!, term),
    enabled: Boolean(studentId),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}
