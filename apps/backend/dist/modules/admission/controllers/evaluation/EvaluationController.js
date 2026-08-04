"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationController = void 0;
const PermissionError_1 = require("../../errors/PermissionError");
const ControllerErrorHandler_1 = require("../crm/ControllerErrorHandler");
const rbac_middleware_1 = require("../../../../rbac/rbac.middleware");
const admission_service_1 = require("../../admission.service");
class EvaluationController {
    constructor(examService, attendanceService, resultService, interviewService, interviewEvalService, meritService, offerService, evalService, appRepo, appService, flagService) {
        this.examService = examService;
        this.attendanceService = attendanceService;
        this.resultService = resultService;
        this.interviewService = interviewService;
        this.interviewEvalService = interviewEvalService;
        this.meritService = meritService;
        this.offerService = offerService;
        this.evalService = evalService;
        this.appRepo = appRepo;
        this.appService = appService;
        this.flagService = flagService;
        this.createTemplate = async (req, res) => {
            try {
                await this.verifyFlag(req, 'entrance_exam');
                const data = await this.examService.createTemplate(req.body);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.scheduleExam = async (req, res) => {
            try {
                await this.verifyFlag(req, 'entrance_exam');
                let schoolId = req.context?.user?.school_id || req.body.school_id;
                let academicYearId = req.headers['x-academic-year-id'] || req.body.academic_year_id;
                if (!schoolId || !academicYearId) {
                    const resolved = await admission_service_1.AdmissionService.resolveContext();
                    if (!schoolId)
                        schoolId = resolved.school_id;
                    if (!academicYearId)
                        academicYearId = resolved.academic_year_id || '';
                }
                const { template_id, room_name, invigilator_name, exam_date } = req.body;
                const data = await this.examService.scheduleExam(schoolId, academicYearId, template_id, room_name, invigilator_name, new Date(exam_date));
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.allocateCandidate = async (req, res) => {
            try {
                await this.verifyFlag(req, 'entrance_exam');
                const { session_id, application_id, seat_number, reporting_time } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.examService.allocateCandidate(session_id, application_id, seat_number, new Date(reporting_time), userId, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.recordAttendance = async (req, res) => {
            try {
                await this.verifyFlag(req, 'entrance_exam');
                const { session_id, application_id, attendance_status, remarks } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                await this.attendanceService.recordAttendance(session_id, application_id, attendance_status, remarks, userId, correlationId);
                res.json({ success: true, message: 'Attendance recorded successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.recordMarks = async (req, res) => {
            try {
                await this.verifyFlag(req, 'entrance_exam');
                const { candidate_id, subject_id, marks_obtained } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.resultService.recordMarks(candidate_id, subject_id, marks_obtained, userId, correlationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getExamResults = async (req, res) => {
            try {
                await this.verifyFlag(req, 'entrance_exam');
                const { id } = req.params;
                await this.enforceApplicationAccess(req, id);
                const data = await this.evalService.getSummary(id);
                res.json(data.exam?.results || []);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.scheduleInterview = async (req, res) => {
            try {
                await this.verifyFlag(req, 'interview');
                const { application_id, panel_id, interview_date, room_name } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.interviewService.scheduleInterview(application_id, panel_id, new Date(interview_date), room_name, userId, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.recordInterviewScore = async (req, res) => {
            try {
                await this.verifyFlag(req, 'interview');
                const { interview_id, scores } = req.body;
                const userId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'counselor';
                const correlationId = req.headers['x-correlation-id'];
                await this.interviewEvalService.recordScores(interview_id, scores, userId, role, correlationId);
                res.json({ success: true, message: 'Interview scores recorded successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.generateMeritList = async (req, res) => {
            try {
                await this.verifyFlag(req, 'merit_engine');
                let schoolId = req.context?.user?.school_id || req.body.school_id;
                let academicYearId = req.headers['x-academic-year-id'] || req.body.academic_year_id;
                if (!schoolId || !academicYearId) {
                    const resolved = await admission_service_1.AdmissionService.resolveContext();
                    if (!schoolId)
                        schoolId = resolved.school_id;
                    if (!academicYearId)
                        academicYearId = resolved.academic_year_id || '';
                }
                const intakeLimit = req.body.intake_limit || 20;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.meritService.calculateMeritList(schoolId, academicYearId, intakeLimit, userId, correlationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getMeritList = async (req, res) => {
            try {
                await this.verifyFlag(req, 'merit_engine');
                const { applicationId } = req.params;
                await this.enforceApplicationAccess(req, applicationId);
                const data = await this.evalService.getSummary(applicationId);
                res.json(data.merit || null);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.generateOffer = async (req, res) => {
            try {
                await this.verifyFlag(req, 'offer_management');
                const { application_id, template_id, expiry_days } = req.body;
                const userId = req.context?.user?.id || null;
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.offerService.generateOffer(application_id, template_id, expiry_days || 14, userId, correlationId);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.sendOffer = async (req, res) => {
            try {
                await this.verifyFlag(req, 'offer_management');
                // Mock action sending email dispatch
                res.json({ success: true, message: 'Offer letter dispatched successfully' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.acceptOffer = async (req, res) => {
            try {
                await this.verifyFlag(req, 'offer_management');
                const { application_id } = req.body;
                const userId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'parent';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.offerService.acceptOffer(application_id, role, userId, correlationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.rejectOffer = async (req, res) => {
            try {
                await this.verifyFlag(req, 'offer_management');
                const { application_id } = req.body;
                const userId = req.context?.user?.id || null;
                const role = req.context?.user?.roles?.[0] || 'parent';
                const correlationId = req.headers['x-correlation-id'];
                const data = await this.offerService.rejectOffer(application_id, role, userId, correlationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getTimeline = async (req, res) => {
            try {
                const { applicationId } = req.params;
                await this.enforceApplicationAccess(req, applicationId);
                const data = await this.appRepo.findTimeline(applicationId);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
    async enforceApplicationAccess(req, applicationId) {
        const user = req.context?.user;
        if (!user)
            throw new PermissionError_1.PermissionError('Unauthorized');
        const roles = (0, rbac_middleware_1.getEffectiveRoles)(user.roles);
        if (roles.includes('ADMIN') || roles.includes('ADMISSION_OFFICER') || roles.includes('COUNSELOR'))
            return;
        if (roles.includes('PARENT')) {
            await this.appService.assertParentCanAccess(applicationId, user.id, user.email);
        }
    }
    async verifyFlag(req, key) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        if (!await this.flagService.isEnabled('admission', key, envMode, schoolId)) {
            throw new PermissionError_1.PermissionError(`Feature Disabled: ${key}`);
        }
    }
}
exports.EvaluationController = EvaluationController;
