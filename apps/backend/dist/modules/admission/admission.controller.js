"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionController = void 0;
const admission_service_1 = require("./admission.service");
const zod_1 = require("zod");
const supabase_1 = require("../../config/supabase");
const createAdmissionSchema = zod_1.z.object({
    student_name: zod_1.z.string().min(1, 'Student name is required'),
    grade_applied_for: zod_1.z.string().min(1, 'Grade is required'),
    parent_name: zod_1.z.string().optional().nullable(),
    parent_email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    parent_phone: zod_1.z.string().optional().nullable(),
    mother_name: zod_1.z.string().optional().nullable(),
    mother_email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    mother_phone: zod_1.z.string().optional().nullable(),
    father_name: zod_1.z.string().optional().nullable(),
    father_email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    father_phone: zod_1.z.string().optional().nullable(),
    academic_year_id: zod_1.z.string().uuid().optional().nullable(),
    school_id: zod_1.z.string().uuid().optional().nullable(),
    date_of_birth: zod_1.z.string().min(1, 'Date of birth is required'),
    gender: zod_1.z.string().min(1, 'Gender is required'),
    address: zod_1.z.string().optional().nullable(),
    previous_school: zod_1.z.string().optional().nullable(),
    last_grade_completed: zod_1.z.string().optional().nullable(),
    parent_password: zod_1.z.string().optional().nullable(),
    // CRM Unified Walk-in Inquiry Fields
    board: zod_1.z.string().optional().nullable(),
    quota: zod_1.z.string().optional().nullable(),
    fee_structure_id: zod_1.z.string().uuid().optional().nullable().or(zod_1.z.literal('')),
    transport_route_id: zod_1.z.string().uuid().optional().nullable().or(zod_1.z.literal('')),
    hostel_room_type: zod_1.z.string().optional().nullable(),
    religion: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional().nullable(),
    blood_group: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().nullable(),
    state: zod_1.z.string().optional().nullable(),
    city: zod_1.z.string().optional().nullable(),
    relationship: zod_1.z.string().optional().nullable(),
    occupation: zod_1.z.string().optional().nullable(),
});
class AdmissionController {
    static async create(req, res) {
        try {
            // 1. VALIDATION
            const validatedData = createAdmissionSchema.safeParse(req.body);
            if (!validatedData.success) {
                const errors = validatedData.error.errors.map(err => err.message).join(', ');
                console.error('[ADMISSION CREATE VALIDATION ERROR]', validatedData.error.format());
                return res.status(400).json({ error: `Validation failed: ${errors}` });
            }
            const { academic_year_id: payloadYear, school_id: payloadSchool, ...formData } = validatedData.data;
            // 2. AUTH CONTEXT
            const context = req.context;
            const applicant_user_id = context?.user?.id || null;
            // 3. RESOLVE IDs (Trusted backend resolution)
            const { school_id, academic_year_id } = await admission_service_1.AdmissionService.resolveContext();
            // 4. STATUS & SECURITY
            let status = 'draft';
            if (applicant_user_id && req.body.status === 'submitted') {
                status = 'submitted';
            }
            else if (!applicant_user_id) {
                status = 'draft'; // Force draft for public users
            }
            const finalData = {
                ...formData,
                school_id,
                academic_year_id: payloadYear || academic_year_id,
                status,
                applicant_user_id,
                submitted_at: status === 'submitted' ? new Date().toISOString() : null
            };
            const data = await admission_service_1.AdmissionService.createApplication(applicant_user_id, finalData);
            res.status(201).json(data);
        }
        catch (error) {
            console.error('[ADMISSION CREATE ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }
    static async publicApply(req, res) {
        try {
            // 1. VALIDATION
            const validatedData = createAdmissionSchema.safeParse(req.body);
            if (!validatedData.success) {
                const errors = validatedData.error.errors.map(err => err.message).join(', ');
                return res.status(400).json({ error: `Validation failed: ${errors}` });
            }
            // 2. PASSWORD CHECK (Mandatory for public)
            if (!req.body.parent_password) {
                return res.status(400).json({ error: 'Password is required for account registration' });
            }
            // 3. RESOLVE IDs (Trusted backend resolution)
            const { school_id, academic_year_id } = await admission_service_1.AdmissionService.resolveContext();
            const finalData = {
                ...req.body,
                school_id: req.body.school_id || school_id,
                academic_year_id: req.body.academic_year_id || academic_year_id
            };
            const data = await admission_service_1.AdmissionService.createPublicApplication(finalData);
            res.status(201).json(data);
        }
        catch (error) {
            console.error('[PUBLIC APPLY ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const userId = req.context.user.id;
            const data = await admission_service_1.AdmissionService.updateApplication(req.params.id, userId, req.body);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async submit(req, res) {
        try {
            const userId = req.context.user.id;
            const data = await admission_service_1.AdmissionService.submitApplication(req.params.id, userId);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async list(req, res) {
        try {
            const { status, school_id, page, limit, search } = req.query;
            const userId = req.context.user.id;
            const roles = req.context.user.roles || [];
            let filters = {
                status,
                school_id: school_id || req.context.user.school_id
            };
            // If parent, only show own
            if (roles.includes('PARENT') && !roles.includes('ADMIN')) {
                filters.userId = userId;
            }
            const result = await admission_service_1.AdmissionService.getApplications(filters, Number(page) || 1, Number(limit) || 10, search);
            res.json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getStats(req, res) {
        try {
            const { school_id } = req.query;
            const stats = await admission_service_1.AdmissionService.getStats(school_id || req.context.user.school_id);
            res.json(stats);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async getById(req, res) {
        try {
            const data = await admission_service_1.AdmissionService.getApplicationById(req.params.id);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async review(req, res) {
        try {
            const officerId = req.context.user.id;
            const { remark } = req.body;
            const data = await admission_service_1.AdmissionService.reviewApplication(req.params.id, officerId, remark);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async recommend(req, res) {
        try {
            const officerId = req.context.user.id;
            const { remark } = req.body;
            const data = await admission_service_1.AdmissionService.recommendApplication(req.params.id, officerId, remark);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async approve(req, res) {
        try {
            const hoiId = req.context.user.id;
            const { remark } = req.body;
            const data = await admission_service_1.AdmissionService.approveApplication(req.params.id, hoiId, remark);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async reject(req, res) {
        try {
            const userId = req.context.user.id;
            const { reason } = req.body;
            const data = await admission_service_1.AdmissionService.rejectApplication(req.params.id, userId, reason);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async enrol(req, res) {
        try {
            const adminId = req.context.user.id;
            // Re-fetch admission to check login status
            const admission = await admission_service_1.AdmissionService.getApplicationById(req.params.id);
            if (admission.applicant_user_id) {
                const { data: user } = await supabase_1.supabase.from('users').select('login_status').eq('id', admission.applicant_user_id).single();
                if (user?.login_status !== 'APPROVED') {
                    return res.status(400).json({ error: "Cannot enrol applicant whose login access is not APPROVED" });
                }
            }
            const data = await admission_service_1.AdmissionService.enrolApplicant(req.params.id, adminId);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async decideLogin(req, res) {
        try {
            const adminId = req.context.user.id;
            const { status, reason } = req.body;
            if (!['APPROVED', 'REJECTED', 'BLOCKED'].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }
            if (!reason && status !== 'APPROVED') {
                return res.status(400).json({ error: "Reason is mandatory for rejection or blocking" });
            }
            const data = await admission_service_1.AdmissionService.decideLogin(req.params.id, adminId, status, reason || 'Login approved by admin');
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async verifyDocs(req, res) {
        try {
            const officerId = req.context.user.id;
            const { remark } = req.body;
            const data = await admission_service_1.AdmissionService.verifyDocuments(req.params.id, officerId, remark);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async initiatePayment(req, res) {
        try {
            const userId = req.context.user.id;
            const { amount } = req.body;
            if (!amount)
                return res.status(400).json({ error: "Amount is required" });
            const data = await admission_service_1.AdmissionService.enablePayment(req.params.id, userId, amount);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async makePayment(req, res) {
        try {
            const userId = req.context.user.id;
            const { mode, reference, proof_url } = req.body;
            if (!mode || !reference) {
                return res.status(400).json({ error: "Payment mode and reference are required" });
            }
            const data = await admission_service_1.AdmissionService.submitPayment(req.params.id, userId, { mode, reference, proof_url });
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async verifyFee(req, res) {
        try {
            const userId = req.context.user.id;
            const { status, remarks } = req.body; // status: 'verified' | 'correction'
            if (!['verified', 'correction'].includes(status)) {
                return res.status(400).json({ error: "Invalid status. Must be 'verified' or 'correction'" });
            }
            const data = await admission_service_1.AdmissionService.verifyPayment(req.params.id, userId, status, remarks);
            res.json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async uploadDoc(req, res) {
        try {
            const { type, url } = req.body;
            const data = await admission_service_1.AdmissionService.uploadDocument(req.params.id, type, url);
            res.status(201).json(data);
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async initializeBilling(req, res) {
        try {
            const userId = req.context.user.id;
            const admissionId = req.params.id;
            const { fee_structure_ids } = req.body;
            if (!fee_structure_ids || !Array.isArray(fee_structure_ids)) {
                return res.status(400).json({ error: "fee_structure_ids array is required" });
            }
            const data = await admission_service_1.AdmissionService.initializeBilling(admissionId, userId, fee_structure_ids);
            res.json(data);
        }
        catch (error) {
            console.error('[ADMISSION BILLING ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }
}
exports.AdmissionController = AdmissionController;
