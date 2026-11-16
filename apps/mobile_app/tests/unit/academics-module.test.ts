import { useAcademicsStore } from '../../src/stores/academics.store';
import { academicsApi } from '../../src/api/academics.api';

jest.mock('../../src/api/academics.api');

describe('Academics Module & Store Test Suite', () => {
  beforeEach(() => {
    useAcademicsStore.getState().clear();
    jest.clearAllMocks();
  });

  describe('1. Tab Navigation & Filter Controls', () => {
    it('should initialize with attendance tab as default', () => {
      const state = useAcademicsStore.getState();
      expect(state.activeTab).toBe('attendance');
      expect(state.homeworkFilter).toBe('all');
    });

    it('should switch between academic tabs correctly', () => {
      const { setActiveTab } = useAcademicsStore.getState();

      setActiveTab('timetable');
      expect(useAcademicsStore.getState().activeTab).toBe('timetable');

      setActiveTab('homework');
      expect(useAcademicsStore.getState().activeTab).toBe('homework');

      setActiveTab('exams');
      expect(useAcademicsStore.getState().activeTab).toBe('exams');
    });

    it('should switch selected day of week for timetable', () => {
      const { setSelectedDay } = useAcademicsStore.getState();

      setSelectedDay('Wednesday');
      expect(useAcademicsStore.getState().selectedDay).toBe('Wednesday');

      setSelectedDay('Friday');
      expect(useAcademicsStore.getState().selectedDay).toBe('Friday');
    });

    it('should update homework filter correctly', () => {
      const { setHomeworkFilter } = useAcademicsStore.getState();

      setHomeworkFilter('pending');
      expect(useAcademicsStore.getState().homeworkFilter).toBe('pending');

      setHomeworkFilter('submitted');
      expect(useAcademicsStore.getState().homeworkFilter).toBe('submitted');
    });
  });

  describe('2. Academic Data Fetching & State Hydration', () => {
    it('should fetch and populate student academics from API', async () => {
      const mockAttendance = {
        totalDays: 20,
        presentDays: 19,
        absentDays: 1,
        lateDays: 0,
        percentage: 95,
        records: [{ date: '2026-11-01', status: 'present' as const }],
      };

      const mockTimetable = [
        {
          day: 'Monday' as const,
          periods: [
            {
              periodNumber: 1,
              startTime: '08:30 AM',
              endTime: '09:15 AM',
              subject: 'Mathematics',
              teacherName: 'Dr. Rao',
              room: 'Room 101',
            },
          ],
        },
      ];

      const mockHomework = [
        {
          id: 'hw-1',
          title: 'Algebra Worksheet',
          subject: 'Mathematics',
          assignedDate: '2026-11-01',
          dueDate: '2026-11-03',
          description: 'Complete problems 1 through 15',
          status: 'pending' as const,
        },
      ];

      const mockExams = [
        {
          id: 'ex-1',
          examName: 'Midterm Assessment',
          subject: 'Science',
          examDate: '2026-11-15',
          startTime: '09:00 AM',
          endTime: '11:00 AM',
          room: 'Hall A',
          totalMarks: 100,
        },
      ];

      const mockReport = {
        term: 'Term 1 Evaluation',
        academicYear: '2026-2027',
        overallGrade: 'A+',
        gpa: 3.9,
        attendancePercentage: 95,
        results: [
          {
            id: 'res-1',
            examName: 'Term 1 Exam',
            term: 'Term 1',
            subject: 'Mathematics',
            marksObtained: 94,
            totalMarks: 100,
            grade: 'A+',
          },
        ],
      };

      (academicsApi.getAttendance as jest.Mock).mockResolvedValue(mockAttendance);
      (academicsApi.getTimetable as jest.Mock).mockResolvedValue(mockTimetable);
      (academicsApi.getHomework as jest.Mock).mockResolvedValue(mockHomework);
      (academicsApi.getExams as jest.Mock).mockResolvedValue(mockExams);
      (academicsApi.getReportCard as jest.Mock).mockResolvedValue(mockReport);

      await useAcademicsStore.getState().fetchStudentAcademics('student-uuid-1');

      const state = useAcademicsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.attendance?.percentage).toBe(95);
      expect(state.timetable).toHaveLength(1);
      expect(state.homework).toHaveLength(1);
      expect(state.exams).toHaveLength(1);
      expect(state.reportCard?.overallGrade).toBe('A+');
    });

    it('should handle API errors gracefully without throwing', async () => {
      (academicsApi.getAttendance as jest.Mock).mockRejectedValue(new Error('Network offline'));
      (academicsApi.getTimetable as jest.Mock).mockRejectedValue(new Error('Network offline'));
      (academicsApi.getHomework as jest.Mock).mockRejectedValue(new Error('Network offline'));
      (academicsApi.getExams as jest.Mock).mockRejectedValue(new Error('Network offline'));
      (academicsApi.getReportCard as jest.Mock).mockRejectedValue(new Error('Network offline'));

      await useAcademicsStore.getState().fetchStudentAcademics('student-uuid-1');

      const state = useAcademicsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isError).toBe(true);
      expect(state.errorMessage).toBe('Network offline');
    });
  });

  describe('3. Homework Submission Interaction', () => {
    it('should mark a pending homework item as submitted', () => {
      useAcademicsStore.setState({
        homework: [
          {
            id: 'hw-100',
            title: 'Chemistry Lab Report',
            subject: 'Chemistry',
            assignedDate: '2026-11-01',
            dueDate: '2026-11-05',
            description: 'Titration analysis',
            status: 'pending',
          },
        ],
      });

      useAcademicsStore.getState().markHomeworkSubmitted('hw-100');

      const updatedHw = useAcademicsStore.getState().homework.find((h) => h.id === 'hw-100');
      expect(updatedHw?.status).toBe('submitted');
      expect(updatedHw?.submissionDate).toBeDefined();
    });
  });

  describe('4. State Cleanup', () => {
    it('should clear all store state on clear() call', () => {
      useAcademicsStore.setState({
        activeTab: 'exams',
        homeworkFilter: 'submitted',
        isError: true,
      });

      useAcademicsStore.getState().clear();

      const state = useAcademicsStore.getState();
      expect(state.activeTab).toBe('attendance');
      expect(state.homeworkFilter).toBe('all');
      expect(state.isError).toBe(false);
    });
  });
});
