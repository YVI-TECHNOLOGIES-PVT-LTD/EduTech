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

      setHomeworkFilter('completed');
      expect(useAcademicsStore.getState().homeworkFilter).toBe('completed');

      setHomeworkFilter('overdue');
      expect(useAcademicsStore.getState().homeworkFilter).toBe('overdue');
    });
  });

  describe('2. Demand-Based Tab Loading & Student Cache Isolation', () => {
    it('should fetch ONLY the active tab when loadActiveTabOnly is called', async () => {
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
              breakName: undefined,
              topic: 'Calculus Introduction',
              status: 'ongoing' as const,
            },
          ],
        },
      ];

      (academicsApi.getTimetable as jest.Mock).mockResolvedValue(mockTimetable);

      useAcademicsStore.setState({ activeTab: 'timetable' });
      await useAcademicsStore.getState().loadActiveTabOnly('student-uuid-demand');

      // Assert that ONLY getTimetable was called, not attendance, homework, exams, etc.
      expect(academicsApi.getTimetable).toHaveBeenCalledWith('student-uuid-demand');
      expect(academicsApi.getAttendance).not.toHaveBeenCalled();
      expect(academicsApi.getHomework).not.toHaveBeenCalled();
      expect(academicsApi.getExams).not.toHaveBeenCalled();

      const state = useAcademicsStore.getState();
      expect(state.timetable).toHaveLength(1);
      expect(state.timetable[0].periods[0].topic).toBe('Calculus Introduction');
      expect(state.timetable[0].periods[0].status).toBe('ongoing');
    });

    it('should isolate cached data per student during child switching', async () => {
      const mockChild1Att = {
        totalDays: 20,
        presentDays: 20,
        absentDays: 0,
        lateDays: 0,
        percentage: 100,
        records: [],
      };
      const mockChild2Att = {
        totalDays: 20,
        presentDays: 16,
        absentDays: 4,
        lateDays: 0,
        percentage: 80,
        records: [],
      };

      (academicsApi.getAttendance as jest.Mock)
        .mockResolvedValueOnce(mockChild1Att)
        .mockResolvedValueOnce(mockChild2Att);

      // Fetch Child 1 attendance
      await useAcademicsStore.getState().fetchAttendance('child-1');
      expect(useAcademicsStore.getState().attendance?.percentage).toBe(100);

      // Fetch Child 2 attendance
      await useAcademicsStore.getState().fetchAttendance('child-2');
      expect(useAcademicsStore.getState().attendance?.percentage).toBe(80);

      // Switch back to Child 1 from cache without making a new network request
      (academicsApi.getAttendance as jest.Mock).mockClear();
      await useAcademicsStore.getState().loadActiveTabOnly('child-1');
      expect(useAcademicsStore.getState().attendance?.percentage).toBe(100);
      expect(academicsApi.getAttendance).not.toHaveBeenCalled();
    });
  });

  describe('3. Academic Data Fetching & State Hydration', () => {
    it('should fetch and populate student academics from API with rich details', async () => {
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
              breakName: undefined,
              topic: 'Polynomial Expressions',
              status: 'upcoming' as const,
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
          teacherName: 'Ms. Clara Davis',
          score: '18/20',
          teacherRemark: 'Great working shown on quadratic proofs',
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
          duration: '2 Hours',
          syllabus: 'Chapters 1 to 5: Mechanics and Thermodynamics',
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
      expect(state.timetable[0].periods[0].topic).toBe('Polynomial Expressions');
      expect(state.timetable[0].periods[0].status).toBe('upcoming');
      expect(state.homework).toHaveLength(1);
      expect(state.homework[0].teacherName).toBe('Ms. Clara Davis');
      expect(state.homework[0].score).toBe('18/20');
      expect(state.homework[0].teacherRemark).toBe('Great working shown on quadratic proofs');
      expect(state.exams).toHaveLength(1);
      expect(state.exams[0].duration).toBe('2 Hours');
      expect(state.exams[0].syllabus).toBe('Chapters 1 to 5: Mechanics and Thermodynamics');
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

  describe('4. Homework Submission Interaction', () => {
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

  describe('5. State Cleanup', () => {
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
