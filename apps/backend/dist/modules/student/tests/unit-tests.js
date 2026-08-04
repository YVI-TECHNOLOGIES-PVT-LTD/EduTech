"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const StudentDTO_1 = require("../dto/StudentDTO");
const AttendanceDTO_1 = require("../dto/attendance/AttendanceDTO");
const StudentStateMachine_1 = require("../services/state-machine/StudentStateMachine");
const RollNumberGenerator_1 = require("../services/generators/RollNumberGenerator");
const AllocationRepository_1 = require("../repositories/AllocationRepository");
const StudentRepository_1 = require("../repositories/StudentRepository");
const AttendanceRepository_1 = require("../repositories/attendance/AttendanceRepository");
const AttendanceStateMachine_1 = require("../services/attendance/state-machine/AttendanceStateMachine");
const LeaveStateMachine_1 = require("../services/attendance/state-machine/LeaveStateMachine");
const AttendancePercentageCalculator_1 = require("../services/attendance/AttendancePercentageCalculator");
const BusinessRuleError_1 = require("../../admission/errors/BusinessRuleError");
class MockStudentRepository extends StudentRepository_1.StudentRepository {
    constructor() {
        super(...arguments);
        this.mockWorkflowRules = new Map();
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
class MockAllocationRepository extends AllocationRepository_1.AllocationRepository {
    constructor() {
        super(...arguments);
        this.mockSeq = null;
        this.mockCount = 0;
    }
    async findSequence(schoolId, academicYearId, grade, sectionId) {
        return this.mockSeq;
    }
    async saveSequence(seq) {
        this.mockSeq = seq;
    }
    async countSectionStudents(academicYearId, grade, sectionId) {
        return this.mockCount;
    }
}
class MockAttendanceRepository extends AttendanceRepository_1.AttendanceRepository {
    constructor() {
        super(...arguments);
        this.mockWorkflowRules = new Map();
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
function runTests() {
    console.log('--- Running SIS & AMS Unit & Integration Tests (Sprint 7 & 8) ---');
    let passed = 0;
    let failed = 0;
    const assert = (condition, testName) => {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        }
        else {
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
        assert(StudentDTO_1.createStudentSchema.safeParse(createObj).success === true, 'createStudentSchema validates correct registrations');
        const promoteObj = {
            to_academic_year_id: '880b7888-f25a-49d7-b224-15c0fd0db490',
            to_grade: 'Grade 2',
            promotion_reason: 'Passed Grade 1 exams'
        };
        assert(StudentDTO_1.promoteStudentSchema.safeParse(promoteObj).success === true, 'promoteStudentSchema validates promotion options');
        const mockRepo = new MockStudentRepository();
        const sm = new StudentStateMachine_1.StudentStateMachine(mockRepo);
        sm.validateTransition('ACTIVE', 'PROMOTED', 'admin')
            .then(() => assert(true, 'StudentStateMachine validates valid transition: ACTIVE -> PROMOTED'))
            .catch(() => assert(false, 'StudentStateMachine should approve active to promoted'));
        const mockAlloc = new MockAllocationRepository();
        const generator = new RollNumberGenerator_1.RollNumberGenerator(mockAlloc);
        generator.generateNextRoll('school-1', 'year-1', 'Grade 1', 'section-1')
            .then(roll1 => {
            assert(roll1 === 1, `RollNumberGenerator starts sequence from 1. Got: ${roll1}`);
        })
            .catch(() => assert(false, 'RollNumberGenerator promise error'));
    }
    catch (e) {
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
        assert(AttendanceDTO_1.markAttendanceSchema.safeParse(markObj).success === true, 'markAttendanceSchema validates attendance markers');
        const leaveObj = {
            leave_type_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            start_date: new Date().toISOString(),
            end_date: new Date().toISOString(),
            reason: 'High fever'
        };
        assert(AttendanceDTO_1.submitLeaveSchema.safeParse(leaveObj).success === true, 'submitLeaveSchema validates leave details');
    }
    catch (e) {
        assert(false, 'Sprint 8 DTO test exception');
    }
    // 2. Attendance % calculations
    try {
        const calc = new AttendancePercentageCalculator_1.AttendancePercentageCalculator();
        const pct1 = calc.calculatePercentage(15, 20); // 75.00%
        assert(pct1 === 75, `AttendancePercentageCalculator calculates normal attendance percentage: 75.00%. Got: ${pct1}`);
        const pct2 = calc.calculatePercentage(0, 0); // 100.00%
        assert(pct2 === 100, `AttendancePercentageCalculator handles zero total days gracefully: 100.00%. Got: ${pct2}`);
    }
    catch (e) {
        assert(false, 'AttendancePercentageCalculator test exception');
    }
    // 3. State Machines validations
    try {
        const mockAttRepo = new MockAttendanceRepository();
        const attSM = new AttendanceStateMachine_1.AttendanceStateMachine(mockAttRepo);
        attSM.validateTransition('PENDING', 'APPROVED', 'teacher')
            .then(() => assert(true, 'AttendanceStateMachine validates PENDING -> APPROVED correction request'))
            .catch(() => assert(false, 'AttendanceStateMachine should allow pending to approved'));
        const leaveSM = new LeaveStateMachine_1.LeaveStateMachine();
        assert((() => {
            try {
                leaveSM.validateTransition('SUBMITTED', 'APPROVED');
                return true;
            }
            catch {
                return false;
            }
        })() === true, 'LeaveStateMachine validates SUBMITTED -> APPROVED transitions');
        assert((() => {
            try {
                leaveSM.validateTransition('DRAFT', 'APPROVED'); // Invalid skipping SUBMITTED
                return false;
            }
            catch (err) {
                return err instanceof BusinessRuleError_1.BusinessRuleError;
            }
        })() === true, 'LeaveStateMachine rejects skipping steps');
    }
    catch (e) {
        assert(false, 'AMS state machine test exception');
    }
    console.log(`\nSIS & AMS Tests Finished: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}
runTests();
