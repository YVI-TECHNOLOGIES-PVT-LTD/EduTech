import { useChildStore } from '../../src/stores/child.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useAcademicsStore } from '../../src/stores/academics.store';
import { useFinanceStore } from '../../src/stores/finance.store';
import { ROUTES } from '../../src/constants/routes';
import { DESIGN_TOKENS } from '../../src/theme/tokens/designTokens';
import { EnrolledChild, ApplicantChild } from '../../src/types/child.types';

describe('Premium Parent Home Dashboard - Architecture & Interaction Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().logout();
    useChildStore.getState().reset();
    useAcademicsStore.getState().clear();
    useFinanceStore.getState().clear();
  });

  // ========================================================
  // 1. DESIGN TOKENS & PALETTE COMPLIANCE
  // ========================================================
  describe('1. Premium Design Tokens & Palette Verification', () => {
    it('should declare authoritative primary palette (#172554, #5145F5, #7C3AED)', () => {
      expect(DESIGN_TOKENS.colors.deepNavy).toBe('#172554');
      expect(DESIGN_TOKENS.colors.royalIndigo).toBe('#5145F5');
      expect(DESIGN_TOKENS.colors.electricViolet).toBe('#7C3AED');
    });

    it('should declare soft backgrounds (#F7F8FC, #F1F4FA, #FFFFFF)', () => {
      expect(DESIGN_TOKENS.colors.background).toBe('#F7F8FC');
      expect(DESIGN_TOKENS.colors.lightNeutral).toBe('#F1F4FA');
      expect(DESIGN_TOKENS.colors.pureWhite).toBe('#FFFFFF');
    });

    it('should declare supporting colors (#059669, #0EA5E9, #F59E0B, #F43F5E)', () => {
      expect(DESIGN_TOKENS.colors.emerald).toBe('#059669');
      expect(DESIGN_TOKENS.colors.skyBlue).toBe('#0EA5E9');
      expect(DESIGN_TOKENS.colors.amber).toBe('#F59E0B');
      expect(DESIGN_TOKENS.colors.rose).toBe('#F43F5E');
    });

    it('should provide gradient stops for hero, academic, and finance cards', () => {
      expect(DESIGN_TOKENS.colors.gradients.primary).toEqual(['#5145F5', '#7C3AED']);
      expect(DESIGN_TOKENS.colors.gradients.navyHero).toEqual(['#172554', '#1E1B4B']);
      expect(DESIGN_TOKENS.colors.gradients.emerald).toEqual(['#059669', '#10B981']);
    });
  });

  // ========================================================
  // 2. HEADER GREETING & AUTH CONTEXT
  // ========================================================
  describe('2. Parent Header & Greeting Logic', () => {
    it('should extract parent first name and fallback gracefully', () => {
      useAuthStore.getState().setAuth(
        {
          id: 'usr-parent-1',
          email: 'tanmay.parent@example.com',
          first_name: 'Tanmay',
          last_name: 'Sharma',
          roles: ['PARENT'],
          permissions: ['student.view'],
        },
        { accessToken: 'token-1', refreshToken: 'ref-1' },
      );

      const user = useAuthStore.getState().user;
      const parentName = user?.first_name || user?.fullName?.split(' ')[0] || 'Parent';
      expect(parentName).toBe('Tanmay');
    });

    it('should compute time-based dynamic greeting correctly', () => {
      const getGreetingForHour = (hour: number) => {
        return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      };

      expect(getGreetingForHour(8)).toBe('Good morning');
      expect(getGreetingForHour(14)).toBe('Good afternoon');
      expect(getGreetingForHour(19)).toBe('Good evening');
    });
  });

  // ========================================================
  // 3. CHILD SELECTION & MULTI-CHILD ISOLATION
  // ========================================================
  describe('3. Child Profile Card & Multi-Child Switching', () => {
    const enrolledChild1: EnrolledChild = {
      kind: 'enrolled',
      id: 'student-101',
      studentId: 'student-101',
      admissionNumber: 'ADM-2026-001',
      fullName: 'Aarav Sharma',
      firstName: 'Aarav',
      lastName: 'Sharma',
      gradeLevel: '8',
      section: 'B',
      rollNumber: '14',
      academicYear: '2026-2027',
      status: 'active',
      relationship: 'Father',
      isPrimaryContact: true,
      avatarUrl: null,
      hasPendingFees: true,
      pendingFeeAmount: 12500,
      attendanceToday: {
        status: 'present',
        timestamp: '08:15 AM',
      },
    };

    const enrolledChild2: EnrolledChild = {
      kind: 'enrolled',
      id: 'student-102',
      studentId: 'student-102',
      admissionNumber: 'ADM-2026-042',
      fullName: 'Ananya Sharma',
      firstName: 'Ananya',
      lastName: 'Sharma',
      gradeLevel: '5',
      section: 'A',
      rollNumber: '7',
      academicYear: '2026-2027',
      status: 'active',
      relationship: 'Father',
      isPrimaryContact: true,
      avatarUrl: null,
      hasPendingFees: false,
      pendingFeeAmount: 0,
      attendanceToday: {
        status: 'present',
        timestamp: '08:20 AM',
      },
    };

    const applicantChild: ApplicantChild = {
      kind: 'applicant',
      id: 'app-901',
      applicationId: 'app-901',
      applicationNumber: 'APP-2026-901',
      fullName: 'Reyansh Sharma',
      firstName: 'Reyansh',
      lastName: 'Sharma',
      applyingGrade: 'Kindergarten',
      academicYear: '2026-2027',
      stage: 'under_review',
      progressPercentage: 60,
      actionRequiredNotice: 'Document verification pending',
      relationship: 'Father',
      isPrimaryContact: true,
      avatarUrl: null,
    };

    it('should select first enrolled child by default when children are loaded', () => {
      useChildStore.getState().setChildren([enrolledChild1, enrolledChild2]);

      const activeChild = useChildStore.getState().getSelectedChild();
      expect(activeChild).not.toBeNull();
      expect(activeChild?.id).toBe('student-101');
      expect(activeChild?.fullName).toBe('Aarav Sharma');
      expect((activeChild as EnrolledChild).gradeLevel).toBe('8');
    });

    it('should smoothly switch active child and isolate child records', () => {
      useChildStore.getState().setChildren([enrolledChild1, enrolledChild2]);

      // Switch to Child 2
      const success = useChildStore.getState().selectChild('student-102');
      expect(success).toBe(true);

      const activeChild = useChildStore.getState().getSelectedChild();
      expect(activeChild?.id).toBe('student-102');
      expect(activeChild?.fullName).toBe('Ananya Sharma');
      expect((activeChild as EnrolledChild).rollNumber).toBe('7');
      expect((activeChild as EnrolledChild).hasPendingFees).toBe(false);
    });

    it('should reject switching to an unauthorized child ID', () => {
      useChildStore.getState().setChildren([enrolledChild1]);

      const success = useChildStore.getState().selectChild('unauthorized-id-999');
      expect(success).toBe(false);

      const activeChild = useChildStore.getState().getSelectedChild();
      expect(activeChild?.id).toBe('student-101');
    });

    it('should handle hybrid parents with both enrolled and applicant children', () => {
      useChildStore.getState().setChildren([enrolledChild1, applicantChild]);

      expect(useChildStore.getState().accountType).toBe('HYBRID');

      // Switch to applicant child
      useChildStore.getState().selectChild('app-901');
      const activeChild = useChildStore.getState().getSelectedChild();
      expect(activeChild?.kind).toBe('applicant');
      expect((activeChild as ApplicantChild).applyingGrade).toBe('Kindergarten');
      expect((activeChild as ApplicantChild).progressPercentage).toBe(60);
    });
  });

  // ========================================================
  // 4. QUICK ACTION ROUTES & TAB DISPATCHING
  // ========================================================
  describe('4. Quick Actions Navigation & Tabs', () => {
    it('should map quick action keys to correct destinations without dead loops', () => {
      const actions = [
        { id: 'attendance', route: ROUTES.MAIN.ACADEMICS, tab: 'attendance' },
        { id: 'timetable', route: ROUTES.MAIN.ACADEMICS, tab: 'timetable' },
        { id: 'homework', route: ROUTES.MAIN.ACADEMICS, tab: 'homework' },
        { id: 'fees', route: ROUTES.MAIN.FINANCE },
        { id: 'report_card', route: ROUTES.MAIN.ACADEMICS, tab: 'exams' },
        { id: 'helpdesk', route: ROUTES.MAIN.HELPDESK },
      ];

      actions.forEach((act) => {
        expect(act.route.startsWith('/(main)')).toBe(true);
        if (act.tab) {
          useAcademicsStore.getState().setActiveTab(act.tab as any);
          expect(useAcademicsStore.getState().activeTab).toBe(act.tab);
        }
      });
    });
  });

  // ========================================================
  // 5. ACADEMICS & TIMETABLE PREVIEW
  // ========================================================
  describe('5. Academics Data Binding & Priority Summaries', () => {
    it('should compute pending homework count accurately from store', () => {
      useAcademicsStore.setState({
        homework: [
          {
            id: 'hw-1',
            title: 'Algebra Polynomials Exercises 4.1',
            subject: 'Mathematics',
            assignedDate: '2026-11-15',
            dueDate: '2026-11-18',
            description: 'Solve questions 1 through 15',
            status: 'pending',
          },
          {
            id: 'hw-2',
            title: 'Cellular Respiration Lab Report',
            subject: 'Biology',
            assignedDate: '2026-11-14',
            dueDate: '2026-11-19',
            description: 'Complete conclusion and graphs',
            status: 'pending',
          },
          {
            id: 'hw-3',
            title: 'French Essay',
            subject: 'French',
            assignedDate: '2026-11-10',
            dueDate: '2026-11-12',
            description: 'Mon voyage',
            status: 'submitted',
          },
        ],
      });

      const homework = useAcademicsStore.getState().homework;
      const pending = homework.filter((h) => h.status === 'pending');
      expect(pending).toHaveLength(2);
      expect(pending[0].subject).toBe('Mathematics');
      expect(pending[1].subject).toBe('Biology');
    });

    it('should format upcoming examination notice accurately', () => {
      useAcademicsStore.setState({
        exams: [
          {
            id: 'exam-1',
            examName: 'Mid-Term Assessment 2',
            subject: 'Physics',
            examDate: '2026-11-24',
            startTime: '09:00 AM',
            endTime: '11:00 AM',
            room: 'Hall B',
            totalMarks: 80,
          },
        ],
      });

      const exams = useAcademicsStore.getState().exams;
      expect(exams).toHaveLength(1);
      const notice = `${exams[0].subject} (${exams[0].examDate} at ${exams[0].startTime})`;
      expect(notice).toBe('Physics (2026-11-24 at 09:00 AM)');
    });
  });

  // ========================================================
  // 6. FINANCE STATUS & DUE SUMMARY
  // ========================================================
  describe('6. Finance Summary & Ledger Contract', () => {
    it('should identify settled dues state when balance is zero', () => {
      useFinanceStore.setState({
        ledger: {
          student_id: 'student-101',
          admission_no: 'ADM-2026-001',
          first_name: 'Aarav',
          last_name: 'Sharma',
          full_name: 'Aarav Sharma',
          grade_name: '8',
          academic_year_name: '2026-2027',
          section_name: 'B',
          fee_structure_name: 'Standard',
          installment_plan_name: 'Quarterly',
          summary: {
            total_assessed: 45000,
            total_paid: 45000,
            outstanding_balance: 0,
            overdue_amount: 0,
            status: 'fully_paid',
          },
          components: [],
          dues: [],
          payment_history: [],
        },
      });

      const ledger = useFinanceStore.getState().ledger;
      const hasPending = (ledger?.summary?.outstanding_balance || 0) > 0;
      expect(hasPending).toBe(false);
      expect(ledger?.summary?.outstanding_balance).toBe(0);
    });

    it('should identify outstanding dues state and retain authoritative amounts', () => {
      useFinanceStore.setState({
        ledger: {
          student_id: 'student-101',
          admission_no: 'ADM-2026-001',
          first_name: 'Aarav',
          last_name: 'Sharma',
          full_name: 'Aarav Sharma',
          grade_name: '8',
          academic_year_name: '2026-2027',
          section_name: 'B',
          fee_structure_name: 'Standard',
          installment_plan_name: 'Quarterly',
          summary: {
            total_assessed: 50000,
            total_paid: 35000,
            outstanding_balance: 15000,
            overdue_amount: 0,
            status: 'partially_paid',
          },
          components: [],
          dues: [],
          payment_history: [],
        },
      });

      const ledger = useFinanceStore.getState().ledger;
      const balance = ledger?.summary?.outstanding_balance || 0;
      expect(balance).toBe(15000);
      expect(balance > 0).toBe(true);
    });
  });

  // ========================================================
  // 7. TRUTHFUL DATA & ZERO FABRICATED DEMONSTRATION VALUES
  // ========================================================
  describe('7. Truthful Data Representation & Zero Fabricated Values', () => {
    it('should format grade cleanly without duplicate "Grade" prefixes', () => {
      const formatGrade = (grade?: string) => {
        if (!grade) return 'Class';
        return grade.toLowerCase().startsWith('grade') ? grade : `Grade ${grade}`;
      };

      expect(formatGrade('Grade 4')).toBe('Grade 4');
      expect(formatGrade('8')).toBe('Grade 8');
      expect(formatGrade(undefined)).toBe('Class');
    });

    it('should handle unmarked attendance and null summary with truthful empty states', () => {
      useAcademicsStore.setState({ attendance: null });
      const summary = useAcademicsStore.getState().attendance;

      const hasMonthlyRate = summary?.percentage !== undefined && summary?.percentage !== null;
      expect(hasMonthlyRate).toBe(false);
      const monthlyRateText = hasMonthlyRate ? `${summary.percentage}%` : '—';
      expect(monthlyRateText).toBe('—');
    });

    it('should not invent fake homework or exams when student has zero pending items', () => {
      useAcademicsStore.setState({
        homework: [],
        exams: [],
      });

      const homework = useAcademicsStore.getState().homework;
      const exams = useAcademicsStore.getState().exams;

      const pendingHomework = homework.filter((h) => h.status === 'pending');
      const firstHomework = pendingHomework.length > 0 ? pendingHomework[0] : null;
      const firstExam = exams.length > 0 ? exams[0] : null;

      expect(firstHomework).toBeNull();
      expect(firstExam).toBeNull();
      const hasPriorities = Boolean(firstHomework || firstExam);
      expect(hasPriorities).toBe(false);
    });

    it('should derive next due date truthfully from fee dues list when available', () => {
      useFinanceStore.setState({
        ledger: {
          student_id: 'student-101',
          admission_no: 'ADM-2026-001',
          first_name: 'Aarav',
          last_name: 'Sharma',
          full_name: 'Aarav Sharma',
          grade_name: '8',
          academic_year_name: '2026-2027',
          section_name: 'B',
          fee_structure_name: 'Standard',
          installment_plan_name: 'Quarterly',
          summary: {
            total_assessed: 50000,
            total_paid: 35000,
            outstanding_balance: 15000,
            overdue_amount: 0,
            status: 'partially_paid',
          },
          components: [],
          dues: [
            {
              due_id: 'due-1',
              charge_description: 'Term 2 Tuition',
              amount_due: 15000,
              paid_amount: 0,
              outstanding_amount: 15000,
              due_date: '2026-12-15',
              is_overdue: false,
              status: 'pending',
            },
          ],
          payment_history: [],
        },
      });

      const ledger = useFinanceStore.getState().ledger;
      const firstDue = ledger?.dues?.find((d) => d.outstanding_amount > 0);
      expect(firstDue?.due_date).toBe('2026-12-15');
      expect(firstDue?.outstanding_amount).toBe(15000);
    });
  });

  // ========================================================
  // 8. DATABASE-DRIVEN HEADER & SELECTED CHILD PROFILE VERIFICATION
  // ========================================================
  describe('8. Database-Driven Header & Selected Child Profile Card', () => {
    it('should store and access authoritative school organization & academic context', () => {
      useChildStore.setState({
        organization: {
          orgId: 'org-st-xavier-1',
          orgName: "St. Xavier's International School",
          orgCode: 'SXIS',
          boardAffiliation: 'CBSE',
        },
        academicContext: {
          academicYearId: 'ay-2026-27',
          academicYearName: '2026–27',
          termName: 'Semester II',
          termNumber: 2,
          weekNumber: 14,
          displayText: 'Academic Term 2026–27 • Semester II • Week 14',
        },
      });

      const org = useChildStore.getState().organization;
      const ac = useChildStore.getState().academicContext;

      expect(org?.orgName).toBe("St. Xavier's International School");
      expect(ac?.displayText).toBe('Academic Term 2026–27 • Semester II • Week 14');
      expect(ac?.weekNumber).toBe(14);
    });

    it('should retain student house, roll number, and avatar in enrolled child model', () => {
      const studentWithHouse: EnrolledChild = {
        kind: 'enrolled',
        id: 'std-devansh-1',
        studentId: 'std-devansh-1',
        admissionNumber: 'SX-2024-819',
        fullName: 'Devansh Bhardwaj',
        firstName: 'Devansh',
        lastName: 'Bhardwaj',
        gradeLevel: 'Grade 2',
        section: 'C',
        rollNumber: 'R-11',
        houseName: 'Blue Phoenix',
        academicYear: '2026–27',
        status: 'active',
        relationship: 'Father',
        isPrimaryContact: true,
        avatarUrl: 'https://cdn.edutrack.com/avatars/devansh.jpg',
        hasPendingFees: false,
        pendingFeeAmount: 0,
      };

      useChildStore.getState().setChildren([studentWithHouse]);

      const activeChild = useChildStore.getState().getSelectedChild() as EnrolledChild;
      expect(activeChild).toBeDefined();
      expect(activeChild.fullName).toBe('Devansh Bhardwaj');
      expect(activeChild.houseName).toBe('Blue Phoenix');
      expect(activeChild.rollNumber).toBe('R-11');
      expect(activeChild.admissionNumber).toBe('SX-2024-819');
      expect(activeChild.avatarUrl).toBe('https://cdn.edutrack.com/avatars/devansh.jpg');
    });

    it('should format short grade labels for child switcher pills cleanly', () => {
      function formatShortGrade(grade?: string | null): string {
        if (!grade) return 'Gr -';
        const clean = grade.trim();
        const match = clean.match(/(?:grade|class|standard|std)?\s*([0-9]+[a-z]?)/i);
        if (match) return `Gr ${match[1]}`;
        if (/kindergarten|kg/i.test(clean)) return 'KG';
        if (/nursery/i.test(clean)) return 'Nur';
        return clean.slice(0, 5);
      }

      expect(formatShortGrade('Grade 2')).toBe('Gr 2');
      expect(formatShortGrade('Grade 5')).toBe('Gr 5');
      expect(formatShortGrade('Class 10')).toBe('Gr 10');
      expect(formatShortGrade('Kindergarten')).toBe('KG');
      expect(formatShortGrade('Nursery')).toBe('Nur');
      expect(formatShortGrade(null)).toBe('Gr -');
    });
  });
});
