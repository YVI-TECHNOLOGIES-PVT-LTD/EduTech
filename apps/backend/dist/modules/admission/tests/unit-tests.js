"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EvaluationDTO_1 = require("../dto/evaluation/EvaluationDTO");
const EnrollmentDTO_1 = require("../dto/enrollment/EnrollmentDTO");
const EnrollmentStateMachine_1 = require("../services/enrollment/state-machine/EnrollmentStateMachine");
const WeightCalculator_1 = require("../services/evaluation/WeightCalculator");
const TieBreaker_1 = require("../services/evaluation/TieBreaker");
const FeeAssignment_1 = require("../domain/enrollment/FeeAssignment");
const AdmissionNumberGenerator_1 = require("../services/enrollment/AdmissionNumberGenerator");
const ConfirmationRepository_1 = require("../repositories/enrollment/ConfirmationRepository");
const ApplicationRepository_1 = require("../repositories/application/ApplicationRepository");
const DocumentRepository_1 = require("../repositories/application/DocumentRepository");
const ExamRepository_1 = require("../repositories/evaluation/ExamRepository");
const InterviewRepository_1 = require("../repositories/evaluation/InterviewRepository");
const OfferRepository_1 = require("../repositories/evaluation/OfferRepository");
const EnrollmentRepository_1 = require("../repositories/enrollment/EnrollmentRepository");
const LeadRepository_1 = require("../repositories/crm/LeadRepository");
const BusinessRuleError_1 = require("../errors/BusinessRuleError");
class MockFeatureFlagRepository {
    constructor() {
        this.mockDb = new Map();
    }
    async findByKey(module, key, environment, tenantId) {
        const cacheKey = `${module}:${key}:${environment}:${tenantId || 'global'}`;
        return this.mockDb.has(cacheKey) ? { enabled: this.mockDb.get(cacheKey) } : null;
    }
    async save(module, key, enabled, environment, tenantId, description) {
        const cacheKey = `${module}:${key}:${environment}:${tenantId || 'global'}`;
        this.mockDb.set(cacheKey, enabled);
        return { enabled };
    }
    async findAll(environment, tenantId) {
        return Array.from(this.mockDb.entries()).map(([k, v]) => ({ key: k, enabled: v }));
    }
}
class MockLeadRepository extends LeadRepository_1.LeadRepository {
    constructor() {
        super(...arguments);
        this.mockLeads = new Map();
    }
    async findById(id) {
        return this.mockLeads.get(id) || null;
    }
}
class MockApplicationRepository extends ApplicationRepository_1.ApplicationRepository {
    constructor() {
        super(...arguments);
        this.mockAgeRules = new Map();
        this.mockWorkflowRules = new Map();
        this.mockApps = new Map();
        this.mockCurrentByDetails = null;
        this.mockCurrentByLead = null;
    }
    async getAgeRule(grade) {
        return this.mockAgeRules.get(grade) || null;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
    async findCurrentByLeadId(leadId) {
        return this.mockCurrentByLead;
    }
    async findCurrentByDetails(studentName, dateOfBirth, academicYearId) {
        return this.mockCurrentByDetails;
    }
}
class MockDocumentRepository extends DocumentRepository_1.DocumentRepository {
    constructor() {
        super(...arguments);
        this.mockDocs = new Map();
        this.mockWorkflowRules = new Map();
    }
    async findById(id) {
        return this.mockDocs.get(id) || null;
    }
    async findByChecksum(checksum) {
        return Array.from(this.mockDocs.values()).find(d => d.checksum === checksum) || null;
    }
    async save(doc) {
        this.mockDocs.set(doc.id, doc);
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
class MockExamRepository extends ExamRepository_1.ExamRepository {
    constructor() {
        super(...arguments);
        this.mockWorkflowRules = new Map();
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
class MockInterviewRepository extends InterviewRepository_1.InterviewRepository {
    constructor() {
        super(...arguments);
        this.mockWorkflowRules = new Map();
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
class MockOfferRepository extends OfferRepository_1.OfferRepository {
    constructor() {
        super(...arguments);
        this.mockWorkflowRules = new Map();
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
class MockEnrollmentRepository extends EnrollmentRepository_1.EnrollmentRepository {
    constructor() {
        super(...arguments);
        this.mockWorkflowRules = new Map();
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key) : false;
    }
}
class MockConfirmationRepository extends ConfirmationRepository_1.ConfirmationRepository {
    constructor() {
        super(...arguments);
        this.mockSeq = null;
    }
    async findSequence(schoolId) {
        return this.mockSeq;
    }
    async saveSequence(sequence) {
        this.mockSeq = sequence;
    }
}
class MockDocumentStorageProvider {
    constructor() {
        this.uploadedFiles = new Map();
        this.uploadCallCount = 0;
        this.deleteCallCount = 0;
    }
    async upload(bucket, path, fileBuffer, mimeType) {
        this.uploadCallCount++;
        this.uploadedFiles.set(`${bucket}:${path}`, fileBuffer);
        return path;
    }
    async download(bucket, path) {
        const file = this.uploadedFiles.get(`${bucket}:${path}`);
        if (!file)
            throw new Error('File not found');
        return file;
    }
    async delete(bucket, path) {
        this.deleteCallCount++;
        this.uploadedFiles.delete(`${bucket}:${path}`);
    }
    async exists(bucket, path) {
        return this.uploadedFiles.has(`${bucket}:${path}`);
    }
    async generateSignedUrl(bucket, path, expiresInSeconds) {
        return `https://supabase.co/storage/v1/object/sign/${bucket}/${path}?token=mocked-token-expires-${expiresInSeconds}`;
    }
}
function runTests() {
    console.log('--- Running Admissions Unit & Integration Tests (Sprint 5 & 6) ---');
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
    // SPRINT 5 TESTS
    // ==========================================
    try {
        const template = {
            name: 'Standard Aptitude',
            grade: 'Grade 1',
            duration: 120,
            total_marks: 100,
            passing_marks: 40
        };
        assert(EvaluationDTO_1.createExamTemplateSchema.safeParse(template).success === true, 'createExamTemplateSchema validates valid templates');
        const schedule = {
            template_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            room_name: 'Room 204',
            invigilator_name: 'Mr. Smith',
            exam_date: new Date().toISOString()
        };
        assert(EvaluationDTO_1.createExamScheduleSchema.safeParse(schedule).success === true, 'createExamScheduleSchema validates schedule configurations');
        const calc = new WeightCalculator_1.WeightCalculator();
        const score = calc.calculate(90, 80, { 'Exam': 60, 'Interview': 40 });
        assert(score === 86, `WeightCalculator computes weighted percentage averages correctly.`);
        const tie = new TieBreaker_1.TieBreaker();
        const c1 = {
            applicationId: 'app-1',
            finalScore: 85,
            examPercentage: 90,
            interviewPercentage: 80,
            dateOfBirth: new Date('2020-01-01'),
            applicationDate: new Date('2026-06-01')
        };
        const c2 = {
            applicationId: 'app-2',
            finalScore: 85,
            examPercentage: 80,
            interviewPercentage: 90,
            dateOfBirth: new Date('2020-01-01'),
            applicationDate: new Date('2026-06-01')
        };
        const result = tie.breakTie(c1, c2, ['Exam Score']);
        assert(result < 0, 'TieBreaker favors candidate with higher exam score');
        const c3 = {
            applicationId: 'app-3',
            finalScore: 85,
            examPercentage: 80,
            interviewPercentage: 80,
            dateOfBirth: new Date('2020-06-01'), // Younger
            applicationDate: new Date('2026-06-01')
        };
        const c4 = {
            applicationId: 'app-4',
            finalScore: 85,
            examPercentage: 80,
            interviewPercentage: 80,
            dateOfBirth: new Date('2020-01-01'), // Older
            applicationDate: new Date('2026-06-01')
        };
        const ageResult = tie.breakTie(c3, c4, ['Age']);
        assert(ageResult < 0, 'TieBreaker favors younger candidate DOB');
    }
    catch (e) {
        assert(false, 'Sprint 5 unit tests threw exception');
    }
    // ==========================================
    // SPRINT 6 TESTS
    // ==========================================
    // 1. DTO Schemas
    try {
        const assignFeeObj = {
            application_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            structure_id: '880b7888-f25a-49d7-b224-15c0fd0db490'
        };
        assert(EnrollmentDTO_1.assignFeeSchema.safeParse(assignFeeObj).success === true, 'assignFeeSchema validates valid structures');
        const collectPaymentObj = {
            application_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            amount: 5000,
            payment_mode: 'Online_Gateway',
            transaction_number: 'TXN-90210'
        };
        assert(EnrollmentDTO_1.collectPaymentSchema.safeParse(collectPaymentObj).success === true, 'collectPaymentSchema validates payment details');
    }
    catch (e) {
        assert(false, 'Sprint 6 DTO test exception');
    }
    // 2. Fee calculation logic
    try {
        const item = new FeeAssignment_1.FeeAssignment('assign-1', 'app-1', 'comp-1', 12000, // Total Amount
        2000, // Waived Amount
        4000, // Paid Amount
        new Date());
        // Outstanding should be 12000 - 2000 - 4000 = 6000
        assert(item.outstandingAmount === 6000, `FeeAssignment outstanding calculation is correct. Expected 6000, got ${item.outstandingAmount}`);
    }
    catch (e) {
        assert(false, 'FeeAssignment domain logic exception');
    }
    // 3. Admission Number sequence generation
    try {
        const mockConfirmRepo = new MockConfirmationRepository();
        const idGenerator = new AdmissionNumberGenerator_1.AdmissionNumberGenerator(mockConfirmRepo);
        // Sequence generation test
        idGenerator.generateNextNumber('school-1')
            .then(num1 => {
            assert(num1 === 'SCH-2026-000001', `AdmissionNumberGenerator outputs SCH-2026-000001 format. Got: ${num1}`);
            return idGenerator.generateNextNumber('school-1');
        })
            .then(num2 => {
            assert(num2 === 'SCH-2026-000002', `AdmissionNumberGenerator correctly increments pointer sequence. Got: ${num2}`);
        })
            .catch(() => assert(false, 'AdmissionNumberGenerator threw promise error'));
    }
    catch (e) {
        assert(false, 'AdmissionNumberGenerator sequence test exception');
    }
    // 4. Enrollment State Machine
    try {
        const mockEnrollRepo = new MockEnrollmentRepository();
        const sm = new EnrollmentStateMachine_1.EnrollmentStateMachine(mockEnrollRepo);
        // Validate valid path: PAYMENT_COMPLETED -> ADMISSION_CONFIRMED
        sm.validateTransition('PAYMENT_COMPLETED', 'ADMISSION_CONFIRMED', 'admin')
            .then(() => assert(true, 'EnrollmentStateMachine validates valid state path: PAYMENT_COMPLETED -> ADMISSION_CONFIRMED'))
            .catch(() => assert(false, 'EnrollmentStateMachine should approve valid path'));
        // Validate invalid path skipping
        sm.validateTransition('OFFER_ACCEPTED', 'ENROLLED', 'admin')
            .then(() => assert(false, 'EnrollmentStateMachine should reject invalid transition skipping steps'))
            .catch(err => {
            assert(err instanceof BusinessRuleError_1.BusinessRuleError, 'EnrollmentStateMachine rejects invalid transitions');
        });
    }
    catch (e) {
        assert(false, 'EnrollmentStateMachine test exception');
    }
    console.log(`\nAdmissions Sprint 5 & 6 Tests Finished: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}
runTests();
