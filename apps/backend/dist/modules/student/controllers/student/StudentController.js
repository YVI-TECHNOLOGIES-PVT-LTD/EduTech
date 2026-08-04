"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentController = void 0;
const PermissionError_1 = require("../../../admission/errors/PermissionError");
const ControllerErrorHandler_1 = require("../../../admission/controllers/crm/ControllerErrorHandler");
class StudentController {
    constructor(studentService, profileService, allocationService, promotionService, transferService, idCardService, barcodeService, timelineService, allocRepo, flagService) {
        this.studentService = studentService;
        this.profileService = profileService;
        this.allocationService = allocationService;
        this.promotionService = promotionService;
        this.transferService = transferService;
        this.idCardService = idCardService;
        this.barcodeService = barcodeService;
        this.timelineService = timelineService;
        this.allocRepo = allocRepo;
        this.flagService = flagService;
        this.createStudent = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_management');
                const data = await this.studentService.createStudent(req.body, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.listStudents = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_management');
                const schoolId = req.context?.user?.school_id || null;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const search = req.query.search;
                const status = req.query.status;
                const grade = req.query.grade;
                const section = req.query.section;
                const academicYear = req.query.academic_year;
                const { data, total } = await this.studentService.listStudents({
                    page,
                    limit,
                    search,
                    status,
                    grade,
                    section,
                    academic_year: academicYear,
                    school_id: schoolId
                });
                res.json({
                    data,
                    meta: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getStudent = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_management');
                const { id } = req.params;
                const data = await this.studentService.getStudent(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.updateProfile = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_profile');
                const { id } = req.params;
                const data = await this.profileService.updateProfile(id, req.body, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.addParent = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_guardian');
                const { id } = req.params;
                const data = await this.profileService.addParent(id, req.body, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.allocateClass = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_management');
                const { id } = req.params;
                const { academic_year_id, grade, section_id, roll_number } = req.body;
                const data = await this.allocationService.allocateClass(id, academic_year_id, grade, section_id, roll_number, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.promoteStudent = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_promotion');
                const { id } = req.params;
                const { to_academic_year_id, to_grade, to_section_id, promotion_reason } = req.body;
                const data = await this.promotionService.promoteStudent(id, to_academic_year_id, to_grade, to_section_id || null, promotion_reason, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.requestTransfer = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_transfer');
                const { id } = req.params;
                const { destination_school, reason } = req.body;
                const data = await this.transferService.requestTransfer(id, destination_school, reason, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.approveTransfer = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_transfer');
                const { id } = req.params; // request ID
                await this.transferService.approveTransfer(id, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.json({ success: true, message: 'Transfer request approved and TC generated.' });
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.generateIdCard = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_identity');
                const { id } = req.params;
                const data = await this.idCardService.generateIdCard(id, req.context?.user?.id || null, req.headers['x-correlation-id']);
                res.status(201).json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getBarcode = async (req, res) => {
            try {
                await this.verifyFlag(req, 'student_identity');
                const { id } = req.params;
                const data = await this.barcodeService.getBarcode(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getTimeline = async (req, res) => {
            try {
                const { id } = req.params;
                const data = await this.timelineService.getTimeline(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
        this.getHistory = async (req, res) => {
            try {
                const { id } = req.params;
                const data = await this.allocRepo.findHistory(id);
                res.json(data);
            }
            catch (err) {
                (0, ControllerErrorHandler_1.handleControllerError)(res, err);
            }
        };
    }
    async verifyFlag(req, key) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        // FeatureFlagService expects module parameter. We pass 'student' module.
        if (!await this.flagService.isEnabled('student', key, envMode, schoolId)) {
            throw new PermissionError_1.PermissionError(`Feature Disabled: ${key}`);
        }
    }
}
exports.StudentController = StudentController;
