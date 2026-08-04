import { StudentRepository } from './repositories/StudentRepository';
import { AcademicRepository } from './repositories/AcademicRepository';
import { AllocationRepository } from './repositories/AllocationRepository';
import { PromotionRepository } from './repositories/PromotionRepository';
import { TransferRepository } from './repositories/TransferRepository';
import { IdentityRepository } from './repositories/IdentityRepository';

import { AttendanceRepository } from './repositories/attendance/AttendanceRepository';
import { LeaveRepository } from './repositories/attendance/LeaveRepository';
import { HolidayRepository } from './repositories/attendance/HolidayRepository';
import { ReportRepository } from './repositories/attendance/ReportRepository';
import { BiometricRepository } from './repositories/attendance/BiometricRepository';

import { StudentValidator } from './services/validators/StudentValidator';
import { AcademicValidator } from './services/validators/AcademicValidator';
import { SectionCapacityValidator } from './services/validators/SectionCapacityValidator';
import { PromotionValidator } from './services/validators/PromotionValidator';
import { TransferValidator } from './services/validators/TransferValidator';
import { IdentityValidator } from './services/validators/IdentityValidator';
import { StudentValidationCoordinator } from './services/validators/StudentValidationCoordinator';

import { AttendanceValidator } from './services/attendance/validators/AttendanceValidator';
import { SessionValidator } from './services/attendance/validators/SessionValidator';
import { LeaveValidator } from './services/attendance/validators/LeaveValidator';
import { HolidayValidator } from './services/attendance/validators/HolidayValidator';
import { CorrectionValidator } from './services/attendance/validators/CorrectionValidator';
import { BiometricValidator } from './services/attendance/validators/BiometricValidator';
import { AttendanceValidationCoordinator } from './services/attendance/validators/AttendanceValidationCoordinator';

import { StudentStateMachine } from './services/state-machine/StudentStateMachine';
import { AttendanceStateMachine } from './services/attendance/state-machine/AttendanceStateMachine';
import { LeaveStateMachine } from './services/attendance/state-machine/LeaveStateMachine';

import { RollNumberGenerator } from './services/generators/RollNumberGenerator';
import { AttendancePercentageCalculator } from './services/attendance/AttendancePercentageCalculator';

import { StudentService } from './services/StudentService';
import { StudentProfileService } from './services/StudentProfileService';
import { StudentAcademicService } from './services/StudentAcademicService';
import { ClassAllocationService } from './services/ClassAllocationService';
import { PromotionService } from './services/PromotionService';
import { TransferService } from './services/TransferService';
import { IdentityCardService } from './services/IdentityCardService';
import { BarcodeService } from './services/BarcodeService';
import { StudentTimelineService } from './services/StudentTimelineService';

import { AttendanceService } from './services/attendance/AttendanceService';
import { AttendanceSessionService } from './services/attendance/AttendanceSessionService';
import { PeriodAttendanceService } from './services/attendance/PeriodAttendanceService';
import { LeaveService } from './services/attendance/LeaveService';
import { LeaveApprovalService } from './services/attendance/LeaveApprovalService';
import { AttendanceCorrectionService } from './services/attendance/AttendanceCorrectionService';
import { AttendanceSummaryService } from './services/attendance/AttendanceSummaryService';
import { AttendanceReportService } from './services/attendance/AttendanceReportService';
import { AttendanceDashboardService } from './services/attendance/AttendanceDashboardService';
import { HolidayService } from './services/attendance/HolidayService';
import { WorkingDayService } from './services/attendance/WorkingDayService';
import { BiometricSyncService } from './services/attendance/BiometricSyncService';
import { AttendanceTimelineService } from './services/attendance/AttendanceTimelineService';
import { AttendanceCoordinatorService } from './services/attendance/AttendanceCoordinatorService';

import { StudentController } from './controllers/student/StudentController';
import { AttendanceController } from './controllers/attendance/AttendanceController';
import { auditService, featureFlagService } from '../admission/index';

// 1. Repositories
export const studentRepository = new StudentRepository();
export const academicRepository = new AcademicRepository();
export const allocationRepository = new AllocationRepository();
export const promotionRepository = new PromotionRepository();
export const transferRepository = new TransferRepository();
export const identityRepository = new IdentityRepository();

export const attendanceRepository = new AttendanceRepository();
export const leaveRepository = new LeaveRepository();
export const holidayRepository = new HolidayRepository();
export const reportRepository = new ReportRepository();
export const biometricRepository = new BiometricRepository();

// 2. Validators
export const studentValidator = new StudentValidator(studentRepository);
export const academicValidator = new AcademicValidator(academicRepository);
export const sectionCapacityValidator = new SectionCapacityValidator(allocationRepository);
export const promotionValidator = new PromotionValidator(studentRepository);
export const transferValidator = new TransferValidator(studentRepository);
export const identityValidator = new IdentityValidator(studentRepository);

export const studentValidationCoordinator = new StudentValidationCoordinator(
    studentValidator,
    academicValidator,
    sectionCapacityValidator,
    promotionValidator,
    transferValidator,
    identityValidator
);

export const attendanceValidator = new AttendanceValidator(attendanceRepository);
export const sessionValidator = new SessionValidator();
export const leaveValidator = new LeaveValidator(leaveRepository);
export const holidayValidator = new HolidayValidator(holidayRepository);
export const correctionValidator = new CorrectionValidator();
export const biometricValidator = new BiometricValidator();

export const attendanceValidationCoordinator = new AttendanceValidationCoordinator(
    studentValidator,
    attendanceValidator,
    sessionValidator,
    leaveValidator,
    holidayValidator,
    correctionValidator,
    biometricValidator
);

// 3. Workflow & generators
export const studentStateMachine = new StudentStateMachine(studentRepository);
export const attendanceStateMachine = new AttendanceStateMachine(attendanceRepository);
export const leaveStateMachine = new LeaveStateMachine();

export const rollNumberGenerator = new RollNumberGenerator(allocationRepository);
export const attendancePercentageCalculator = new AttendancePercentageCalculator();

// 4. Services
export const studentService = new StudentService(studentRepository, auditService);
export const studentProfileService = new StudentProfileService(studentRepository, auditService);
export const studentAcademicService = new StudentAcademicService(academicRepository);
export const classAllocationService = new ClassAllocationService(
    allocationRepository,
    studentRepository,
    studentValidationCoordinator,
    rollNumberGenerator,
    auditService
);
export const promotionService = new PromotionService(
    promotionRepository,
    studentRepository,
    allocationRepository,
    studentValidationCoordinator,
    studentStateMachine,
    auditService
);
export const transferService = new TransferService(
    transferRepository,
    studentRepository,
    studentValidationCoordinator,
    studentStateMachine,
    auditService
);
export const identityCardService = new IdentityCardService(
    identityRepository,
    studentRepository,
    studentValidationCoordinator,
    auditService
);
export const barcodeService = new BarcodeService(identityRepository);
export const studentTimelineService = new StudentTimelineService(studentRepository);

export const attendanceSessionService = new AttendanceSessionService(attendanceRepository);
export const attendanceService = new AttendanceService(
    attendanceRepository,
    studentRepository,
    attendanceValidationCoordinator,
    auditService
);
export const periodAttendanceService = new PeriodAttendanceService(attendanceRepository, studentRepository);
export const leaveService = new LeaveService(
    leaveRepository,
    attendanceValidationCoordinator,
    auditService
);
export const leaveApprovalService = new LeaveApprovalService(
    leaveRepository,
    leaveStateMachine,
    auditService
);
export const attendanceCorrectionService = new AttendanceCorrectionService(
    attendanceRepository,
    attendanceStateMachine,
    auditService
);
export const attendanceSummaryService = new AttendanceSummaryService(
    reportRepository,
    holidayRepository,
    studentRepository,
    attendancePercentageCalculator
);
export const attendanceReportService = new AttendanceReportService(reportRepository);
export const attendanceDashboardService = new AttendanceDashboardService(reportRepository);
export const holidayService = new HolidayService(holidayRepository);
export const workingDayService = new WorkingDayService(holidayRepository);
export const biometricSyncService = new BiometricSyncService(
    biometricRepository,
    attendanceService,
    studentRepository,
    attendanceSessionService
);
export const attendanceTimelineService = new AttendanceTimelineService(attendanceRepository);
export const attendanceCoordinatorService = new AttendanceCoordinatorService();

// 5. Controllers
export const studentController = new StudentController(
    studentService,
    studentProfileService,
    classAllocationService,
    promotionService,
    transferService,
    identityCardService,
    barcodeService,
    studentTimelineService,
    allocationRepository,
    featureFlagService
);

export const attendanceController = new AttendanceController(
    attendanceService,
    attendanceSessionService,
    periodAttendanceService,
    leaveService,
    leaveApprovalService,
    attendanceCorrectionService,
    holidayService,
    workingDayService,
    biometricSyncService,
    attendanceSummaryService,
    attendanceTimelineService,
    attendanceReportService,
    featureFlagService
);
