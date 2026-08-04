import { Request, Response } from 'express';
import { ExamService } from '../../services/evaluation/ExamService';
import { AttendanceService } from '../../services/evaluation/AttendanceService';
import { ResultService } from '../../services/evaluation/ResultService';
import { InterviewService } from '../../services/evaluation/InterviewService';
import { InterviewEvaluationService } from '../../services/evaluation/InterviewEvaluationService';
import { MeritCalculationService } from '../../services/evaluation/MeritCalculationService';
import { OfferService } from '../../services/evaluation/OfferService';
import { EvaluationService } from '../../services/evaluation/EvaluationService';
import { FeatureFlagService } from '../../services/FeatureFlagService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { ApplicationService } from '../../services/application/ApplicationService';
import { PermissionError } from '../../errors/PermissionError';
import { handleControllerError } from '../crm/ControllerErrorHandler';
import { getEffectiveRoles } from '../../../../rbac/rbac.middleware';
import { AdmissionService } from '../../admission.service';

export class EvaluationController {
    constructor(
        private readonly examService: ExamService,
        private readonly attendanceService: AttendanceService,
        private readonly resultService: ResultService,
        private readonly interviewService: InterviewService,
        private readonly interviewEvalService: InterviewEvaluationService,
        private readonly meritService: MeritCalculationService,
        private readonly offerService: OfferService,
        private readonly evalService: EvaluationService,
        private readonly appRepo: ApplicationRepository,
        private readonly appService: ApplicationService,
        private readonly flagService: FeatureFlagService
    ) {}

    private async enforceApplicationAccess(req: Request, applicationId: string): Promise<void> {
        const user = req.context?.user;
        if (!user) throw new PermissionError('Unauthorized');
        const roles = getEffectiveRoles(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR')) return;
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
        }
    }

    private async verifyFlag(req: Request, key: string) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        if (!await this.flagService.isEnabled('admission', key, envMode, schoolId)) {
            throw new PermissionError(`Feature Disabled: ${key}`);
        }
    }

    public createTemplate = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'entrance_exam');
            const data = await this.examService.createTemplate(req.body);
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public scheduleExam = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'entrance_exam');
            let schoolId = req.context?.user?.school_id || req.body.school_id;
            let academicYearId = req.headers['x-academic-year-id'] as string || req.body.academic_year_id;

            if (!schoolId || !academicYearId) {
                const resolved = await AdmissionService.resolveContext();
                if (!schoolId) schoolId = resolved.school_id;
                if (!academicYearId) academicYearId = resolved.academic_year_id || '';
            }

            const { template_id, room_name, invigilator_name, exam_date } = req.body;

            const data = await this.examService.scheduleExam(
                schoolId,
                academicYearId,
                template_id,
                room_name,
                invigilator_name,
                new Date(exam_date)
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public allocateCandidate = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'entrance_exam');
            const { session_id, application_id, seat_number, reporting_time } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.examService.allocateCandidate(
                session_id,
                application_id,
                seat_number,
                new Date(reporting_time),
                userId,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public recordAttendance = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'entrance_exam');
            const { session_id, application_id, attendance_status, remarks } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            await this.attendanceService.recordAttendance(
                session_id,
                application_id,
                attendance_status,
                remarks,
                userId,
                correlationId
            );
            res.json({ success: true, message: 'Attendance recorded successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public recordMarks = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'entrance_exam');
            const { candidate_id, subject_id, marks_obtained } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.resultService.recordMarks(
                candidate_id,
                subject_id,
                marks_obtained,
                userId,
                correlationId
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getExamResults = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'entrance_exam');
            const { id } = req.params;
            await this.enforceApplicationAccess(req, id);
            const data = await this.evalService.getSummary(id);
            res.json(data.exam?.results || []);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public scheduleInterview = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'interview');
            const { application_id, panel_id, interview_date, room_name } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.interviewService.scheduleInterview(
                application_id,
                panel_id,
                new Date(interview_date),
                room_name,
                userId,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public recordInterviewScore = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'interview');
            const { interview_id, scores } = req.body;
            const userId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'counselor';
            const correlationId = req.headers['x-correlation-id'] as string;

            await this.interviewEvalService.recordScores(
                interview_id,
                scores,
                userId,
                role,
                correlationId
            );
            res.json({ success: true, message: 'Interview scores recorded successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public generateMeritList = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'merit_engine');
            let schoolId = req.context?.user?.school_id || req.body.school_id;
            let academicYearId = req.headers['x-academic-year-id'] as string || req.body.academic_year_id;

            if (!schoolId || !academicYearId) {
                const resolved = await AdmissionService.resolveContext();
                if (!schoolId) schoolId = resolved.school_id;
                if (!academicYearId) academicYearId = resolved.academic_year_id || '';
            }

            const intakeLimit = req.body.intake_limit || 20;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.meritService.calculateMeritList(
                schoolId,
                academicYearId,
                intakeLimit,
                userId,
                correlationId
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getMeritList = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'merit_engine');
            const { applicationId } = req.params;
            await this.enforceApplicationAccess(req, applicationId);
            const data = await this.evalService.getSummary(applicationId);
            res.json(data.merit || null);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public generateOffer = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'offer_management');
            const { application_id, template_id, expiry_days } = req.body;
            const userId = req.context?.user?.id || null;
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.offerService.generateOffer(
                application_id,
                template_id,
                expiry_days || 14,
                userId,
                correlationId
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public sendOffer = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'offer_management');
            // Mock action sending email dispatch
            res.json({ success: true, message: 'Offer letter dispatched successfully' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public acceptOffer = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'offer_management');
            const { application_id } = req.body;
            const userId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'parent';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.offerService.acceptOffer(
                application_id,
                role,
                userId,
                correlationId
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public rejectOffer = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'offer_management');
            const { application_id } = req.body;
            const userId = req.context?.user?.id || null;
            const role = req.context?.user?.roles?.[0] || 'parent';
            const correlationId = req.headers['x-correlation-id'] as string;

            const data = await this.offerService.rejectOffer(
                application_id,
                role,
                userId,
                correlationId
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getTimeline = async (req: Request, res: Response) => {
        try {
            const { applicationId } = req.params;
            await this.enforceApplicationAccess(req, applicationId);
            const data = await this.appRepo.findTimeline(applicationId);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
