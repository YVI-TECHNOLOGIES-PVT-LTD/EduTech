import { Request, Response } from 'express';
import { StudentService } from '../../services/StudentService';
import { StudentProfileService } from '../../services/StudentProfileService';
import { ClassAllocationService } from '../../services/ClassAllocationService';
import { PromotionService } from '../../services/PromotionService';
import { TransferService } from '../../services/TransferService';
import { IdentityCardService } from '../../services/IdentityCardService';
import { BarcodeService } from '../../services/BarcodeService';
import { StudentTimelineService } from '../../services/StudentTimelineService';
import { FeatureFlagService } from '../../../admission/services/FeatureFlagService';
import { AllocationRepository } from '../../repositories/AllocationRepository';
import { PermissionError } from '../../../admission/errors/PermissionError';
import { handleControllerError } from '../../../admission/controllers/crm/ControllerErrorHandler';

export class StudentController {
    constructor(
        private readonly studentService: StudentService,
        private readonly profileService: StudentProfileService,
        private readonly allocationService: ClassAllocationService,
        private readonly promotionService: PromotionService,
        private readonly transferService: TransferService,
        private readonly idCardService: IdentityCardService,
        private readonly barcodeService: BarcodeService,
        private readonly timelineService: StudentTimelineService,
        private readonly allocRepo: AllocationRepository,
        private readonly flagService: FeatureFlagService
    ) {}

    private async verifyFlag(req: Request, key: string) {
        const schoolId = req.context?.user?.school_id || null;
        const envMode = process.env.NODE_ENV || 'development';
        // FeatureFlagService expects module parameter. We pass 'student' module.
        if (!await this.flagService.isEnabled('student', key, envMode, schoolId)) {
            throw new PermissionError(`Feature Disabled: ${key}`);
        }
    }

    public createStudent = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_management');
            const data = await this.studentService.createStudent(
                req.body,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public listStudents = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_management');
            const schoolId = req.context?.user?.school_id || null;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = req.query.search as string;
            const status = req.query.status as string;
            const grade = req.query.grade as string;
            const section = req.query.section as string;
            const academicYear = req.query.academic_year as string;

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
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getStudent = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_management');
            const { id } = req.params;
            const data = await this.studentService.getStudent(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public updateProfile = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_profile');
            const { id } = req.params;
            const data = await this.profileService.updateProfile(
                id,
                req.body,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public addParent = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_guardian');
            const { id } = req.params;
            const data = await this.profileService.addParent(
                id,
                req.body,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public allocateClass = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_management');
            const { id } = req.params;
            const { academic_year_id, grade, section_id, roll_number } = req.body;
            const data = await this.allocationService.allocateClass(
                id,
                academic_year_id,
                grade,
                section_id,
                roll_number,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public promoteStudent = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_promotion');
            const { id } = req.params;
            const { to_academic_year_id, to_grade, to_section_id, promotion_reason } = req.body;
            const data = await this.promotionService.promoteStudent(
                id,
                to_academic_year_id,
                to_grade,
                to_section_id || null,
                promotion_reason,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public requestTransfer = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_transfer');
            const { id } = req.params;
            const { destination_school, reason } = req.body;
            const data = await this.transferService.requestTransfer(
                id,
                destination_school,
                reason,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public approveTransfer = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_transfer');
            const { id } = req.params; // request ID
            await this.transferService.approveTransfer(
                id,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.json({ success: true, message: 'Transfer request approved and TC generated.' });
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public generateIdCard = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_identity');
            const { id } = req.params;
            const data = await this.idCardService.generateIdCard(
                id,
                req.context?.user?.id || null,
                req.headers['x-correlation-id'] as string
            );
            res.status(201).json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getBarcode = async (req: Request, res: Response) => {
        try {
            await this.verifyFlag(req, 'student_identity');
            const { id } = req.params;
            const data = await this.barcodeService.getBarcode(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getTimeline = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.timelineService.getTimeline(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };

    public getHistory = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const data = await this.allocRepo.findHistory(id);
            res.json(data);
        } catch (err) {
            handleControllerError(res, err);
        }
    };
}
