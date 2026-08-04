import { createApplicationSchema, saveDraftSchema, submitApplicationSchema } from '../dto/application/ApplicationDTO';
import { uploadDocumentSchema, verifyDocumentSchema, rejectDocumentSchema, correctionRequestSchema } from '../dto/application/DocumentDTO';
import { createExamTemplateSchema, createExamScheduleSchema, recordAttendanceSchema, recordMarksSchema, scheduleInterviewSchema, recordInterviewScoreSchema, generateMeritSchema, generateOfferSchema } from '../dto/evaluation/EvaluationDTO';
import { assignFeeSchema, collectPaymentSchema, feeWaiverSchema } from '../dto/enrollment/EnrollmentDTO';
import { FeatureFlagService } from '../services/FeatureFlagService';
import { IFeatureFlagRepository } from '../repositories/interfaces/IFeatureFlagRepository';
import { ApplicationStateMachine } from '../services/application/state-machine/ApplicationStateMachine';
import { DocumentStateMachine } from '../services/application/state-machine/DocumentStateMachine';
import { ExamStateMachine } from '../services/evaluation/state-machine/ExamStateMachine';
import { InterviewStateMachine } from '../services/evaluation/state-machine/InterviewStateMachine';
import { OfferStateMachine } from '../services/evaluation/state-machine/OfferStateMachine';
import { EnrollmentStateMachine } from '../services/enrollment/state-machine/EnrollmentStateMachine';
import { LeadValidator } from '../services/application/validators/LeadValidator';
import { AgeValidator } from '../services/application/validators/AgeValidator';
import { DuplicateValidator } from '../services/application/validators/DuplicateValidator';
import { MimeValidator } from '../services/application/validators/MimeValidator';
import { ExtensionValidator } from '../services/application/validators/ExtensionValidator';
import { FileSizeValidator } from '../services/application/validators/FileSizeValidator';
import { DuplicateDocumentValidator } from '../services/application/validators/DuplicateDocumentValidator';
import { NoOpVirusScanner, VirusScanValidator } from '../services/application/validators/VirusScanValidator';
import { WeightCalculator } from '../services/evaluation/WeightCalculator';
import { TieBreaker, CandidateMeritInput } from '../services/evaluation/TieBreaker';
import { RankGenerator } from '../services/evaluation/RankGenerator';
import { WaitlistGenerator } from '../services/evaluation/WaitlistGenerator';
import { FeeAssignment } from '../domain/enrollment/FeeAssignment';
import { AdmissionNumberGenerator } from '../services/enrollment/AdmissionNumberGenerator';
import { ConfirmationRepository } from '../repositories/enrollment/ConfirmationRepository';
import { AdmissionApplication } from '../domain/application/AdmissionApplication';
import { Document } from '../domain/Document';
import { DocumentVersion } from '../domain/DocumentVersion';
import { ApplicationRepository } from '../repositories/application/ApplicationRepository';
import { DocumentRepository } from '../repositories/application/DocumentRepository';
import { DocumentVersionRepository } from '../repositories/application/DocumentVersionRepository';
import { ExamRepository } from '../repositories/evaluation/ExamRepository';
import { InterviewRepository } from '../repositories/evaluation/InterviewRepository';
import { OfferRepository } from '../repositories/evaluation/OfferRepository';
import { EnrollmentRepository } from '../repositories/enrollment/EnrollmentRepository';
import { LeadRepository } from '../repositories/crm/LeadRepository';
import { AdmissionLead } from '../domain/AdmissionLead';
import { IDocumentStorageProvider } from '../storage/interfaces/IDocumentStorageProvider';
import { ChecksumService } from '../services/application/ChecksumService';
import { ValidationError } from '../errors/ValidationError';
import { ConflictError } from '../errors/ConflictError';
import { BusinessRuleError } from '../errors/BusinessRuleError';

class MockFeatureFlagRepository implements IFeatureFlagRepository {
    public mockDb = new Map<string, any>();

    async findByKey(module: string, key: string, environment: string, tenantId: string | null): Promise<any | null> {
        const cacheKey = `${module}:${key}:${environment}:${tenantId || 'global'}`;
        return this.mockDb.has(cacheKey) ? { enabled: this.mockDb.get(cacheKey) } : null;
    }

    async save(module: string, key: string, enabled: boolean, environment: string, tenantId: string | null, description?: string): Promise<any> {
        const cacheKey = `${module}:${key}:${environment}:${tenantId || 'global'}`;
        this.mockDb.set(cacheKey, enabled);
        return { enabled };
    }

    async findAll(environment: string, tenantId: string | null): Promise<any[]> {
        return Array.from(this.mockDb.entries()).map(([k, v]) => ({ key: k, enabled: v }));
    }
}

class MockLeadRepository extends LeadRepository {
    public mockLeads = new Map<string, AdmissionLead>();

    override async findById(id: string): Promise<AdmissionLead | null> {
        return this.mockLeads.get(id) || null;
    }
}

class MockApplicationRepository extends ApplicationRepository {
    public mockAgeRules = new Map<string, { min_age: number, max_age: number }>();
    public mockWorkflowRules = new Map<string, boolean>();
    public mockApps = new Map<string, AdmissionApplication>();
    public mockCurrentByDetails: AdmissionApplication | null = null;
    public mockCurrentByLead: AdmissionApplication | null = null;

    override async getAgeRule(grade: string) {
        return this.mockAgeRules.get(grade) || null;
    }

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string) {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }

    override async findCurrentByLeadId(leadId: string) {
        return this.mockCurrentByLead;
    }

    override async findCurrentByDetails(studentName: string, dateOfBirth: Date, academicYearId: string) {
        return this.mockCurrentByDetails;
    }
}

class MockDocumentRepository extends DocumentRepository {
    public mockDocs = new Map<string, Document>();
    public mockWorkflowRules = new Map<string, boolean>();

    override async findById(id: string): Promise<Document | null> {
        return this.mockDocs.get(id) || null;
    }

    override async findByChecksum(checksum: string): Promise<Document | null> {
        return Array.from(this.mockDocs.values()).find(d => d.checksum === checksum) || null;
    }

    override async save(doc: Document): Promise<void> {
        this.mockDocs.set(doc.id, doc);
    }

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

class MockExamRepository extends ExamRepository {
    public mockWorkflowRules = new Map<string, boolean>();

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

class MockInterviewRepository extends InterviewRepository {
    public mockWorkflowRules = new Map<string, boolean>();

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

class MockOfferRepository extends OfferRepository {
    public mockWorkflowRules = new Map<string, boolean>();

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

class MockEnrollmentRepository extends EnrollmentRepository {
    public mockWorkflowRules = new Map<string, boolean>();

    override async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const key = `${fromStatus}:${toStatus}:${role}`;
        return this.mockWorkflowRules.has(key) ? this.mockWorkflowRules.get(key)! : false;
    }
}

class MockConfirmationRepository extends ConfirmationRepository {
    public mockSeq: any = null;

    override async findSequence(schoolId: string): Promise<any | null> {
        return this.mockSeq;
    }

    override async saveSequence(sequence: any): Promise<void> {
        this.mockSeq = sequence;
    }
}

class MockDocumentStorageProvider implements IDocumentStorageProvider {
    public uploadedFiles = new Map<string, Buffer>();
    public uploadCallCount = 0;
    public deleteCallCount = 0;

    async upload(bucket: string, path: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
        this.uploadCallCount++;
        this.uploadedFiles.set(`${bucket}:${path}`, fileBuffer);
        return path;
    }

    async download(bucket: string, path: string): Promise<Buffer> {
        const file = this.uploadedFiles.get(`${bucket}:${path}`);
        if (!file) throw new Error('File not found');
        return file;
    }

    async delete(bucket: string, path: string): Promise<void> {
        this.deleteCallCount++;
        this.uploadedFiles.delete(`${bucket}:${path}`);
    }

    async exists(bucket: string, path: string): Promise<boolean> {
        return this.uploadedFiles.has(`${bucket}:${path}`);
    }

    async generateSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string> {
        return `https://supabase.co/storage/v1/object/sign/${bucket}/${path}?token=mocked-token-expires-${expiresInSeconds}`;
    }
}

function runTests() {
    console.log('--- Running Admissions Unit & Integration Tests (Sprint 5 & 6) ---');
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
        assert(createExamTemplateSchema.safeParse(template).success === true, 'createExamTemplateSchema validates valid templates');

        const schedule = {
            template_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            room_name: 'Room 204',
            invigilator_name: 'Mr. Smith',
            exam_date: new Date().toISOString()
        };
        assert(createExamScheduleSchema.safeParse(schedule).success === true, 'createExamScheduleSchema validates schedule configurations');

        const calc = new WeightCalculator();
        const score = calc.calculate(90, 80, { 'Exam': 60, 'Interview': 40 });
        assert(score === 86, `WeightCalculator computes weighted percentage averages correctly.`);

        const tie = new TieBreaker();
        const c1: CandidateMeritInput = {
            applicationId: 'app-1',
            finalScore: 85,
            examPercentage: 90,
            interviewPercentage: 80,
            dateOfBirth: new Date('2020-01-01'),
            applicationDate: new Date('2026-06-01')
        };
        const c2: CandidateMeritInput = {
            applicationId: 'app-2',
            finalScore: 85,
            examPercentage: 80,
            interviewPercentage: 90,
            dateOfBirth: new Date('2020-01-01'),
            applicationDate: new Date('2026-06-01')
        };
        const result = tie.breakTie(c1, c2, ['Exam Score']);
        assert(result < 0, 'TieBreaker favors candidate with higher exam score');

        const c3: CandidateMeritInput = {
            applicationId: 'app-3',
            finalScore: 85,
            examPercentage: 80,
            interviewPercentage: 80,
            dateOfBirth: new Date('2020-06-01'), // Younger
            applicationDate: new Date('2026-06-01')
        };
        const c4: CandidateMeritInput = {
            applicationId: 'app-4',
            finalScore: 85,
            examPercentage: 80,
            interviewPercentage: 80,
            dateOfBirth: new Date('2020-01-01'), // Older
            applicationDate: new Date('2026-06-01')
        };
        const ageResult = tie.breakTie(c3, c4, ['Age']);
        assert(ageResult < 0, 'TieBreaker favors younger candidate DOB');
    } catch (e) {
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
        assert(assignFeeSchema.safeParse(assignFeeObj).success === true, 'assignFeeSchema validates valid structures');

        const collectPaymentObj = {
            application_id: '990b7888-f25a-49d7-b224-15c0fd0db490',
            amount: 5000,
            payment_mode: 'Online_Gateway',
            transaction_number: 'TXN-90210'
        };
        assert(collectPaymentSchema.safeParse(collectPaymentObj).success === true, 'collectPaymentSchema validates payment details');
    } catch (e) {
        assert(false, 'Sprint 6 DTO test exception');
    }

    // 2. Fee calculation logic
    try {
        const item = new FeeAssignment(
            'assign-1',
            'app-1',
            'comp-1',
            12000, // Total Amount
            2000,  // Waived Amount
            4000,  // Paid Amount
            new Date()
        );

        // Outstanding should be 12000 - 2000 - 4000 = 6000
        assert(item.outstandingAmount === 6000, `FeeAssignment outstanding calculation is correct. Expected 6000, got ${item.outstandingAmount}`);
    } catch (e) {
        assert(false, 'FeeAssignment domain logic exception');
    }

    // 3. Admission Number sequence generation
    try {
        const mockConfirmRepo = new MockConfirmationRepository();
        const idGenerator = new AdmissionNumberGenerator(mockConfirmRepo);

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
    } catch (e) {
        assert(false, 'AdmissionNumberGenerator sequence test exception');
    }

    // 4. Enrollment State Machine
    try {
        const mockEnrollRepo = new MockEnrollmentRepository();
        const sm = new EnrollmentStateMachine(mockEnrollRepo);

        // Validate valid path: PAYMENT_COMPLETED -> ADMISSION_CONFIRMED
        sm.validateTransition('PAYMENT_COMPLETED', 'ADMISSION_CONFIRMED', 'admin')
            .then(() => assert(true, 'EnrollmentStateMachine validates valid state path: PAYMENT_COMPLETED -> ADMISSION_CONFIRMED'))
            .catch(() => assert(false, 'EnrollmentStateMachine should approve valid path'));

        // Validate invalid path skipping
        sm.validateTransition('OFFER_ACCEPTED', 'ENROLLED', 'admin')
            .then(() => assert(false, 'EnrollmentStateMachine should reject invalid transition skipping steps'))
            .catch(err => {
                assert(err instanceof BusinessRuleError, 'EnrollmentStateMachine rejects invalid transitions');
            });
    } catch (e) {
        assert(false, 'EnrollmentStateMachine test exception');
    }

    console.log(`\nAdmissions Sprint 5 & 6 Tests Finished: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
