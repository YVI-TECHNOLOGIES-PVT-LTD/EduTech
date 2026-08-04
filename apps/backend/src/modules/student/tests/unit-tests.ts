import { createStudentSchema, promoteStudentSchema } from '../dto/StudentDTO';
import { markAttendanceSchema, submitLeaveSchema, attendanceCorrectionSchema } from '../dto/attendance/AttendanceDTO';
import { Student } from '../domain/Student';
import { StudentStateMachine } from '../services/state-machine/StudentStateMachine';
import { RollNumberGenerator } from '../services/generators/RollNumberGenerator';
import { SectionCapacityValidator } from '../services/validators/SectionCapacityValidator';
import { AllocationRepository } from '../repositories/AllocationRepository';
import { StudentRepository } from '../repositories/StudentRepository';
import { AttendanceRepository } from '../repositories/attendance/AttendanceRepository';
import { AttendanceStateMachine } from '../services/attendance/state-machine/AttendanceStateMachine';
import { LeaveStateMachine } from '../services/attendance/state-machine/LeaveStateMachine';
import { AttendancePercentageCalculator } from '../services/attendance/AttendancePercentageCalculator';
import { BusinessRuleError } from '../../admission/errors/BusinessRuleError';

class MockStudentRepository extends StudentRepository {
    public mockWorkflowRules = new Map<string, boolean>();

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

class MockAllocationRepository extends AllocationRepository {
    public mockSeq: any = null;
    public mockCount = 0;

    override async findSequence(
        schoolId: string,
        academicYearId: string,
        grade: string,
        sectionId: string
    ): Promise<any | null> {
        return this.mockSeq;
    }

    override async saveSequence(seq: any): Promise<void> {
        this.mockSeq = seq;
    }

    override async countSectionStudents(
        academicYearId: string,
        grade: string,
        sectionId: string
    ): Promise<number> {
        return this.mockCount;
    }
}

class MockAttendanceRepository extends AttendanceRepository {
    public mockWorkflowRules = new Map<string, boolean>();

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

function runTests() {
    console.log('--- Running SIS & AMS Unit & Integration Tests (Sprint 7 & 8) ---');
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, testName: string) => {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failed++;
        }
    };

    // ==========================================
    // SPRINT 7 TESTS
    // ==========================================
    try {
        const createObj = {
            admission_no: 'STU-2026-000001',
            first_name: 'Jane',
            last_name: 'Doe',
            school_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            academic_year_id: '880b7888-f25a-49d7-b224-15c0fd0db490'
        };
        assert(createStudentSchema.safeParse(createObj).success === true, 'createStudentSchema validates correct registrations');

        const promoteObj = {
            to_academic_year_id: '880b7888-f25a-49d7-b224-15c0fd0db490',
            to_grade: 'Grade 2',
            promotion_reason: 'Passed Grade 1 exams'
        };
        assert(promoteStudentSchema.safeParse(promoteObj).success === true, 'promoteStudentSchema validates promotion options');

        const mockRepo = new MockStudentRepository();
        const sm = new StudentStateMachine(mockRepo);
        sm.validateTransition('ACTIVE', 'PROMOTED', 'admin')
            .then(() => assert(true, 'StudentStateMachine validates valid transition: ACTIVE -> PROMOTED'))
            .catch(() => assert(false, 'StudentStateMachine should approve active to promoted'));

        const mockAlloc = new MockAllocationRepository();
        const generator = new RollNumberGenerator(mockAlloc);
        generator.generateNextRoll('school-1', 'year-1', 'Grade 1', 'section-1')
            .then(roll1 => {
                assert(roll1 === 1, `RollNumberGenerator starts sequence from 1. Got: ${roll1}`);
            })
            .catch(() => assert(false, 'RollNumberGenerator promise error'));
    } catch (e) {
        assert(false, 'Sprint 7 tests exception');
    }

    // ==========================================
    // SPRINT 8 TESTS
    // ==========================================

    // 1. Zod DTO schema validations
    try {
        const markObj = {
            student_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            status: 'PRESENT',
            remarks: 'Arrived on time'
        };
        assert(markAttendanceSchema.safeParse(markObj).success === true, 'markAttendanceSchema validates attendance markers');

        const leaveObj = {
            leave_type_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            reason: 'High fever'
        };
        assert(submitLeaveSchema.safeParse(leaveObj).success === true, 'submitLeaveSchema validates leave details');
    } catch (e) {
        assert(false, 'Sprint 8 DTO test exception');
    }

    // 2. Attendance % calculations
    try {
        const calc = new AttendancePercentageCalculator();
        const pct1 = calc.calculatePercentage(15, 20); // 75.00%
        assert(pct1 === 75, `AttendancePercentageCalculator calculates normal attendance percentage: 75.00%. Got: ${pct1}`);

        const pct2 = calc.calculatePercentage(0, 0); // 100.00%
        assert(pct2 === 100, `AttendancePercentageCalculator handles zero total days gracefully: 100.00%. Got: ${pct2}`);
    } catch (e) {
        assert(false, 'AttendancePercentageCalculator test exception');
    }

    // 3. State Machines validations
    try {
        const mockAttRepo = new MockAttendanceRepository();
        const attSM = new AttendanceStateMachine(mockAttRepo);

        attSM.validateTransition('PENDING', 'APPROVED', 'teacher')
            .then(() => assert(true, 'AttendanceStateMachine validates PENDING -> APPROVED correction request'))
            .catch(() => assert(false, 'AttendanceStateMachine should allow pending to approved'));

        const leaveSM = new LeaveStateMachine();
        assert(
            (() => {
                try {
                    leaveSM.validateTransition('SUBMITTED', 'APPROVED');
                    return true;
                } catch {
                    return false;
                }
            })() === true,
            'LeaveStateMachine validates SUBMITTED -> APPROVED transitions'
        );

        assert(
            (() => {
                try {
                    leaveSM.validateTransition('DRAFT', 'APPROVED'); // Invalid skipping SUBMITTED
                    return false;
                } catch (err) {
                    return err instanceof BusinessRuleError;
                }
            })() === true,
            'LeaveStateMachine rejects skipping steps'
        );
    } catch (e) {
        assert(false, 'AMS state machine test exception');
    }

    console.log(`\nSIS & AMS Tests Finished: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
