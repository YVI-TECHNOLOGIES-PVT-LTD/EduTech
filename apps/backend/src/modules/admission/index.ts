import { AdmissionRepository } from './repositories/AdmissionRepository';
import { EnquiryRepository } from './repositories/crm/EnquiryRepository';
import { LeadRepository } from './repositories/crm/LeadRepository';
import { VisitorRepository } from './repositories/crm/VisitorRepository';
import { FollowUpRepository } from './repositories/crm/FollowUpRepository';
import { FeatureFlagRepository } from './repositories/FeatureFlagRepository';
import { ApplicationRepository } from './repositories/application/ApplicationRepository';
import { DocumentRepository } from './repositories/application/DocumentRepository';
import { DocumentVersionRepository } from './repositories/application/DocumentVersionRepository';
import { DocumentChecklistRepository } from './repositories/application/DocumentChecklistRepository';
import { DocumentTypeRepository } from './repositories/application/DocumentTypeRepository';
import { ExamRepository } from './repositories/evaluation/ExamRepository';
import { InterviewRepository } from './repositories/evaluation/InterviewRepository';
import { MeritRepository } from './repositories/evaluation/MeritRepository';
import { OfferRepository } from './repositories/evaluation/OfferRepository';
import { EvaluationRepository } from './repositories/evaluation/EvaluationRepository';

import { FeeRepository } from './repositories/enrollment/FeeRepository';
import { PaymentRepository } from './repositories/enrollment/PaymentRepository';
import { ConfirmationRepository } from './repositories/enrollment/ConfirmationRepository';
import { EnrollmentRepository } from './repositories/enrollment/EnrollmentRepository';
import { StudentProvisionRepository } from './repositories/enrollment/StudentProvisionRepository';
import { AtomicProvisionRepository } from './repositories/enrollment/AtomicProvisionRepository';

import { FeatureFlagService } from './services/FeatureFlagService';
import { AuditService } from './services/AuditService';
import { AdmissionCRMTransactionService } from './services/crm/AdmissionCRMTransactionService';
import { EnquiryService } from './services/crm/EnquiryService';
import { LeadService } from './services/crm/LeadService';
import { CounselorAssignmentService } from './services/crm/CounselorAssignmentService';
import { FollowUpService } from './services/crm/FollowUpService';
import { VisitorService } from './services/crm/VisitorService';

import { ApplicationStateMachine } from './services/application/state-machine/ApplicationStateMachine';
import { LeadValidator } from './services/application/validators/LeadValidator';
import { AgeValidator } from './services/application/validators/AgeValidator';
import { DuplicateValidator } from './services/application/validators/DuplicateValidator';
import { WorkflowValidator } from './services/application/validators/WorkflowValidator';
import { AcademicValidator } from './services/application/validators/AcademicValidator';
import { ApplicationValidationService } from './services/application/ApplicationValidationService';
import { ApplicationWorkflowService } from './services/application/ApplicationWorkflowService';
import { ApplicationWorkflowOrchestrator } from './services/application/ApplicationWorkflowOrchestrator';
import { DraftService } from './services/application/DraftService';
import { ApplicationService } from './services/application/ApplicationService';
import { PublicApplicationService } from './services/application/PublicApplicationService';
import { ApplicationProgressService } from './services/application/ApplicationProgressService';

import { SupabaseStorageProvider } from './storage/providers/SupabaseStorageProvider';
import { DocumentStateMachine } from './services/application/state-machine/DocumentStateMachine';
import { MimeValidator } from './services/application/validators/MimeValidator';
import { ExtensionValidator } from './services/application/validators/ExtensionValidator';
import { FileSizeValidator } from './services/application/validators/FileSizeValidator';
import { DuplicateDocumentValidator } from './services/application/validators/DuplicateDocumentValidator';
import { NoOpVirusScanner, VirusScanValidator } from './services/application/validators/VirusScanValidator';
import { DocumentValidationService } from './services/application/DocumentValidationService';
import { ChecksumService } from './services/application/ChecksumService';
import { SignedUrlService } from './services/application/SignedUrlService';
import { DocumentUploadService } from './services/application/DocumentUploadService';
import { DocumentDownloadService } from './services/application/DocumentDownloadService';
import { DocumentVerificationService } from './services/application/DocumentVerificationService';
import { DocumentChecklistService } from './services/application/DocumentChecklistService';
import { DocumentVersionService } from './services/application/DocumentVersionService';
import { DocumentService } from './services/application/DocumentService';

import { ExamStateMachine } from './services/evaluation/state-machine/ExamStateMachine';
import { InterviewStateMachine } from './services/evaluation/state-machine/InterviewStateMachine';
import { OfferStateMachine } from './services/evaluation/state-machine/OfferStateMachine';

import { ApplicationValidator as EvalApplicationValidator } from './services/evaluation/validators/ApplicationValidator';
import { DocumentValidator as EvalDocumentValidator } from './services/evaluation/validators/DocumentValidator';
import { ExamValidator } from './services/evaluation/validators/ExamValidator';
import { InterviewValidator } from './services/evaluation/validators/InterviewValidator';
import { MeritValidator } from './services/evaluation/validators/MeritValidator';

import { ExamService } from './services/evaluation/ExamService';
import { AttendanceService } from './services/evaluation/AttendanceService';
import { ResultService } from './services/evaluation/ResultService';
import { InterviewService } from './services/evaluation/InterviewService';
import { InterviewEvaluationService } from './services/evaluation/InterviewEvaluationService';
import { WeightCalculator } from './services/evaluation/WeightCalculator';
import { TieBreaker } from './services/evaluation/TieBreaker';
import { RankGenerator } from './services/evaluation/RankGenerator';
import { WaitlistGenerator } from './services/evaluation/WaitlistGenerator';
import { MeritCalculationService } from './services/evaluation/MeritCalculationService';
import { OfferService } from './services/evaluation/OfferService';
import { EvaluationService } from './services/evaluation/EvaluationService';

import { EnrollmentStateMachine } from './services/enrollment/state-machine/EnrollmentStateMachine';
import { OfferValidator } from './services/enrollment/validators/OfferValidator';
import { FeeValidator } from './services/enrollment/validators/FeeValidator';
import { PaymentValidator } from './services/enrollment/validators/PaymentValidator';
import { ReceiptValidator } from './services/enrollment/validators/ReceiptValidator';
import { ConfirmationValidator } from './services/enrollment/validators/ConfirmationValidator';
import { StudentProvisionValidator } from './services/enrollment/validators/StudentProvisionValidator';
import { EnrollmentValidator } from './services/enrollment/validators/EnrollmentValidator';
import { EnrollmentValidationCoordinator } from './services/enrollment/validators/EnrollmentValidationCoordinator';

import { StudentMasterProvisioner } from './services/enrollment/provisioning/StudentMasterProvisioner';
import { AcademicProvisioner } from './services/enrollment/provisioning/AcademicProvisioner';
import { ParentProvisioner } from './services/enrollment/provisioning/ParentProvisioner';
import { UserProvisioner } from './services/enrollment/provisioning/UserProvisioner';
import { TransportProvisioner } from './services/enrollment/provisioning/TransportProvisioner';
import { HostelProvisioner } from './services/enrollment/provisioning/HostelProvisioner';
import { LibraryProvisioner } from './services/enrollment/provisioning/LibraryProvisioner';
import { IDCardProvisioner } from './services/enrollment/provisioning/IDCardProvisioner';

import { FeeStructureService } from './services/enrollment/FeeStructureService';
import { FeeAssignmentService } from './services/enrollment/FeeAssignmentService';
import { FeeCalculationService } from './services/enrollment/FeeCalculationService';
import { FeeWaiverService } from './services/enrollment/FeeWaiverService';
import { PaymentService } from './services/enrollment/PaymentService';
import { ReceiptService } from './services/enrollment/ReceiptService';
import { PaymentVerificationService } from './services/enrollment/PaymentVerificationService';
import { AdmissionNumberGenerator } from './services/enrollment/AdmissionNumberGenerator';
import { AdmissionConfirmationService } from './services/enrollment/AdmissionConfirmationService';
import { StudentProvisionService } from './services/enrollment/StudentProvisionService';
import { EnrollmentService } from './services/enrollment/EnrollmentService';
import { EnrollmentTimelineService } from './services/enrollment/EnrollmentTimelineService';

import { EnquiryController } from './controllers/crm/EnquiryController';
import { LeadController } from './controllers/crm/LeadController';
import { FollowUpController } from './controllers/crm/FollowUpController';
import { VisitorController } from './controllers/crm/VisitorController';
import { ApplicationController } from './controllers/application/ApplicationController';
import { PublicApplicationController } from './controllers/application/PublicApplicationController';
import { DocumentController } from './controllers/application/DocumentController';
import { EvaluationController } from './controllers/evaluation/EvaluationController';
import { EnrollmentController } from './controllers/enrollment/EnrollmentController';

// ==========================================
// 1. REPOSITORIES SINGLETONS
// ==========================================
export const admissionRepository = new AdmissionRepository();
export const enquiryRepository = new EnquiryRepository();
export const leadRepository = new LeadRepository();
export const visitorRepository = new VisitorRepository();
export const followUpRepository = new FollowUpRepository();
export const featureFlagRepository = new FeatureFlagRepository();
export const applicationRepository = new ApplicationRepository();
export const documentRepository = new DocumentRepository();
export const documentVersionRepository = new DocumentVersionRepository();
export const documentChecklistRepository = new DocumentChecklistRepository();
export const documentTypeRepository = new DocumentTypeRepository();
export const examRepository = new ExamRepository();
export const interviewRepository = new InterviewRepository();
export const meritRepository = new MeritRepository();
export const offerRepository = new OfferRepository();
export const evaluationRepository = new EvaluationRepository();

export const feeRepository = new FeeRepository();
export const paymentRepository = new PaymentRepository();
export const confirmationRepository = new ConfirmationRepository();
export const enrollmentRepository = new EnrollmentRepository();
export const studentProvisionRepository = new StudentProvisionRepository();
export const atomicProvisionRepository = new AtomicProvisionRepository();

// ==========================================
// 2. STORAGE PROVIDER SINGLETONS
// ==========================================
export const documentStorageProvider = new SupabaseStorageProvider();

// ==========================================
// 3. SERVICES SINGLETONS
// ==========================================
export const auditService = new AuditService();
export const featureFlagService = new FeatureFlagService(featureFlagRepository);
export const transactionService = new AdmissionCRMTransactionService(enquiryRepository);

export const leadService = new LeadService(leadRepository, enquiryRepository, applicationRepository, auditService);
export const counselorAssignmentService = new CounselorAssignmentService(leadRepository, auditService, enquiryRepository, transactionService);
export const followUpService = new FollowUpService(followUpRepository, leadRepository, auditService);
export const visitorService = new VisitorService(visitorRepository, auditService);

// Application Pipeline Validators & Coordinator
export const applicationStateMachine = new ApplicationStateMachine(applicationRepository);
export const leadValidator = new LeadValidator(leadRepository);
export const ageValidator = new AgeValidator(applicationRepository);
export const duplicateValidator = new DuplicateValidator(applicationRepository);
export const workflowValidator = new WorkflowValidator(applicationStateMachine);
export const academicValidator = new AcademicValidator();

export const applicationValidationService = new ApplicationValidationService(
    leadValidator,
    ageValidator,
    duplicateValidator,
    workflowValidator,
    academicValidator
);

export const applicationWorkflowService = new ApplicationWorkflowService(
    applicationRepository,
    applicationValidationService,
    auditService
);

export const applicationWorkflowOrchestrator = new ApplicationWorkflowOrchestrator(
    applicationWorkflowService,
    applicationRepository,
    documentRepository,
    documentChecklistRepository,
    documentTypeRepository,
    interviewRepository,
    examRepository,
    feeRepository,
    paymentRepository,
    auditService
);

export const draftService = new DraftService(applicationRepository, auditService);

export const applicationService = new ApplicationService(
    applicationRepository,
    applicationValidationService,
    applicationWorkflowService,
    auditService,
    applicationWorkflowOrchestrator
);

export const applicationProgressService = new ApplicationProgressService(
    applicationRepository,
    documentRepository,
    documentChecklistRepository,
    documentTypeRepository,
    interviewRepository,
    examRepository,
    feeRepository,
    paymentRepository
);

export const enquiryService = new EnquiryService(
    enquiryRepository,
    transactionService,
    auditService,
    leadRepository,
    applicationRepository,
    applicationService
);

export const publicApplicationService = new PublicApplicationService(
    enquiryService,
    counselorAssignmentService,
    applicationService,
    applicationRepository,
    auditService
);

// Document Pipeline Validators & Coordinator
export const documentStateMachine = new DocumentStateMachine(documentRepository);
export const mimeValidator = new MimeValidator();
export const extensionValidator = new ExtensionValidator();
export const fileSizeValidator = new FileSizeValidator();
export const duplicateDocumentValidator = new DuplicateDocumentValidator(documentRepository);
export const noOpVirusScanner = new NoOpVirusScanner();
export const virusScanValidator = new VirusScanValidator(noOpVirusScanner);

export const documentValidationService = new DocumentValidationService(
    applicationRepository,
    documentTypeRepository,
    mimeValidator,
    extensionValidator,
    fileSizeValidator,
    duplicateDocumentValidator,
    virusScanValidator
);

export const checksumService = new ChecksumService();
export const signedUrlService = new SignedUrlService(documentStorageProvider);

export const documentUploadService = new DocumentUploadService(
    documentRepository,
    documentVersionRepository,
    applicationRepository,
    documentValidationService,
    documentStorageProvider,
    checksumService,
    auditService,
    applicationWorkflowOrchestrator
);

export const documentDownloadService = new DocumentDownloadService(
    documentRepository,
    signedUrlService,
    auditService
);

export const documentVerificationService = new DocumentVerificationService(
    documentRepository,
    documentTypeRepository,
    applicationRepository,
    documentStateMachine,
    auditService,
    applicationWorkflowOrchestrator
);

export const documentChecklistService = new DocumentChecklistService(documentChecklistRepository);
export const documentVersionService = new DocumentVersionService(documentVersionRepository, documentRepository);
export const documentService = new DocumentService(documentRepository);

// Sprint 5 State Machines & Validators
export const examStateMachine = new ExamStateMachine(examRepository);
export const interviewStateMachine = new InterviewStateMachine(interviewRepository);
export const offerStateMachine = new OfferStateMachine(offerRepository);

export const evalApplicationValidator = new EvalApplicationValidator(applicationRepository);
export const evalDocumentValidator = new EvalDocumentValidator(documentRepository, documentChecklistRepository, applicationRepository);
export const examValidator = new ExamValidator(evalApplicationValidator, evalDocumentValidator, interviewRepository);
export const interviewValidator = new InterviewValidator(applicationRepository, interviewRepository);
export const meritValidator = new MeritValidator(examRepository, interviewRepository);

// Sprint 5 Evaluation Services
export const examService = new ExamService(examRepository, applicationRepository, examValidator, auditService);
export const attendanceService = new AttendanceService(examRepository, applicationRepository, auditService);
export const resultService = new ResultService(
    examRepository,
    applicationRepository,
    auditService,
    applicationWorkflowOrchestrator
);
export const interviewService = new InterviewService(
    interviewRepository,
    applicationRepository,
    interviewValidator,
    auditService,
    applicationWorkflowOrchestrator
);
export const interviewEvaluationService = new InterviewEvaluationService(
    interviewRepository,
    applicationRepository,
    interviewStateMachine,
    auditService,
    applicationWorkflowOrchestrator
);
export const weightCalculator = new WeightCalculator();
export const tieBreaker = new TieBreaker();
export const rankGenerator = new RankGenerator(tieBreaker);
export const waitlistGenerator = new WaitlistGenerator();
export const meritCalculationService = new MeritCalculationService(
    meritRepository,
    examRepository,
    interviewRepository,
    applicationRepository,
    meritValidator,
    weightCalculator,
    rankGenerator,
    waitlistGenerator,
    auditService
);
export const offerService = new OfferService(offerRepository, applicationRepository, offerStateMachine, auditService);
export const evaluationService = new EvaluationService(evaluationRepository);

// Sprint 6 State Machine & Validators
export const enrollmentStateMachine = new EnrollmentStateMachine(enrollmentRepository);

export const offerValidator = new OfferValidator(offerRepository, applicationRepository);
export const feeValidator = new FeeValidator(feeRepository, paymentRepository);
export const paymentValidator = new PaymentValidator(feeRepository, paymentRepository);
export const receiptValidator = new ReceiptValidator(paymentRepository);
export const confirmationValidator = new ConfirmationValidator(confirmationRepository);
export const studentProvisionValidator = new StudentProvisionValidator(studentProvisionRepository);
export const enrollmentValidator = new EnrollmentValidator(applicationRepository);

export const enrollmentValidationCoordinator = new EnrollmentValidationCoordinator(
    offerValidator,
    feeValidator,
    paymentValidator,
    receiptValidator,
    confirmationValidator,
    studentProvisionValidator,
    enrollmentValidator
);

// Sprint 6 Provisioners
export const studentMasterProvisioner = new StudentMasterProvisioner();
export const academicProvisioner = new AcademicProvisioner();
export const parentProvisioner = new ParentProvisioner();
export const userProvisioner = new UserProvisioner();
export const transportProvisioner = new TransportProvisioner();
export const hostelProvisioner = new HostelProvisioner();
export const libraryProvisioner = new LibraryProvisioner();
export const idCardProvisioner = new IDCardProvisioner();

// Sprint 6 Enrollment Services
export const feeStructureService = new FeeStructureService(feeRepository);
export const feeAssignmentService = new FeeAssignmentService(feeRepository, auditService);
export const feeCalculationService = new FeeCalculationService(feeRepository);
export const feeWaiverService = new FeeWaiverService(feeRepository, auditService);
export const paymentService = new PaymentService(
    paymentRepository,
    feeRepository,
    applicationRepository,
    auditService,
    applicationWorkflowOrchestrator
);
export const receiptService = new ReceiptService(paymentRepository);
export const paymentVerificationService = new PaymentVerificationService(paymentRepository, paymentService, auditService);
export const admissionNumberGenerator = new AdmissionNumberGenerator(confirmationRepository);
export const admissionConfirmationService = new AdmissionConfirmationService(
    confirmationRepository,
    applicationRepository,
    enrollmentValidationCoordinator,
    admissionNumberGenerator,
    enrollmentStateMachine,
    auditService
);
export const studentProvisionService = new StudentProvisionService(
    studentProvisionRepository,
    atomicProvisionRepository,
    applicationRepository,
    auditService
);
export const enrollmentService = new EnrollmentService(
    enrollmentRepository,
    confirmationRepository,
    applicationRepository,
    enrollmentValidationCoordinator,
    studentProvisionService,
    enrollmentStateMachine,
    auditService,
    applicationWorkflowOrchestrator
);
export const enrollmentTimelineService = new EnrollmentTimelineService(enrollmentRepository);

// ==========================================
// 4. CONTROLLERS SINGLETONS
// ==========================================
export const enquiryController = new EnquiryController(enquiryService, featureFlagService);
export const leadController = new LeadController(leadService, counselorAssignmentService, featureFlagService);
export const followupController = new FollowUpController(followUpService, featureFlagService);
export const visitorController = new VisitorController(visitorService, featureFlagService);
export const applicationController = new ApplicationController(
    applicationService,
    draftService,
    applicationWorkflowService,
    applicationProgressService,
    applicationWorkflowOrchestrator,
    featureFlagService,
    publicApplicationService
);
export const publicApplicationController = new PublicApplicationController(publicApplicationService);
export const documentController = new DocumentController(
    documentService,
    documentUploadService,
    documentDownloadService,
    documentVerificationService,
    documentChecklistService,
    documentVersionService,
    featureFlagService,
    applicationService
);
export const evaluationController = new EvaluationController(
    examService,
    attendanceService,
    resultService,
    interviewService,
    interviewEvaluationService,
    meritCalculationService,
    offerService,
    evaluationService,
    applicationRepository,
    applicationService,
    featureFlagService
);
export const enrollmentController = new EnrollmentController(
    feeAssignmentService,
    feeCalculationService,
    feeWaiverService,
    paymentService,
    receiptService,
    paymentVerificationService,
    admissionConfirmationService,
    enrollmentService,
    enrollmentTimelineService,
    confirmationRepository,
    featureFlagService,
    applicationService
);
