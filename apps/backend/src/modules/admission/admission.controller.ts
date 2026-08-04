import { Request, Response } from 'express';
import { AdmissionService } from './admission.service';
import { z } from 'zod';
import { supabase } from '../../config/supabase';

const createAdmissionSchema = z.object({
    student_name: z.string().min(1, 'Student name is required'),
    grade_applied_for: z.string().min(1, 'Grade is required'),
    parent_name: z.string().optional().nullable(),
    parent_email: z.string().email().optional().nullable().or(z.literal('')),
    parent_phone: z.string().optional().nullable(),
    mother_name: z.string().optional().nullable(),
    mother_email: z.string().email().optional().nullable().or(z.literal('')),
    mother_phone: z.string().optional().nullable(),
    father_name: z.string().optional().nullable(),
    father_email: z.string().email().optional().nullable().or(z.literal('')),
    father_phone: z.string().optional().nullable(),
    academic_year_id: z.string().uuid().optional().nullable(),
    school_id: z.string().uuid().optional().nullable(),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    gender: z.string().min(1, 'Gender is required'),
    address: z.string().optional().nullable(),
    previous_school: z.string().optional().nullable(),
    last_grade_completed: z.string().optional().nullable(),
    parent_password: z.string().optional().nullable(),
    
    // CRM Unified Walk-in Inquiry Fields
    board: z.string().optional().nullable(),
    quota: z.string().optional().nullable(),
    fee_structure_id: z.string().uuid().optional().nullable().or(z.literal('')),
    transport_route_id: z.string().uuid().optional().nullable().or(z.literal('')),
    hostel_room_type: z.string().optional().nullable(),
    religion: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    blood_group: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    relationship: z.string().optional().nullable(),
    occupation: z.string().optional().nullable(),
});

export class AdmissionController {
    static async create(req: Request, res: Response) {
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
            const context = (req as any).context;
            const applicant_user_id = context?.user?.id || null;

            // 3. RESOLVE IDs (Trusted backend resolution)
            const { school_id, academic_year_id } = await AdmissionService.resolveContext();

            // 4. STATUS & SECURITY
            let status = 'draft';
            if (applicant_user_id && req.body.status === 'submitted') {
                status = 'submitted';
            } else if (!applicant_user_id) {
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

            const data = await AdmissionService.createApplication(applicant_user_id, finalData);
            res.status(201).json(data);
        } catch (error: any) {
            console.error('[ADMISSION CREATE ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async publicApply(req: Request, res: Response) {
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
            const { school_id, academic_year_id } = await AdmissionService.resolveContext();

            const finalData = {
                ...req.body,
                school_id: req.body.school_id || school_id,
                academic_year_id: req.body.academic_year_id || academic_year_id
            };

            const data = await AdmissionService.createPublicApplication(finalData);
            res.status(201).json(data);
        } catch (error: any) {
            console.error('[PUBLIC APPLY ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const data = await AdmissionService.updateApplication(req.params.id, userId, req.body);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async submit(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const data = await AdmissionService.submitApplication(req.params.id, userId);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async list(req: Request, res: Response) {
        try {
            const { status, school_id, page, limit, search } = req.query;
            const userId = (req as any).context.user.id;
            const roles = (req as any).context.user.roles || [];

            let filters: any = {
                status,
                school_id: school_id || (req as any).context.user.school_id
            };

            // If parent, only show own
            if (roles.includes('PARENT') && !roles.includes('ADMIN')) {
                filters.userId = userId;
            }

            const result = await AdmissionService.getApplications(
                filters,
                Number(page) || 1,
                Number(limit) || 10,
                search as string
            );
            res.json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getStats(req: Request, res: Response) {
        try {
            const { school_id } = req.query;
            const stats = await AdmissionService.getStats(school_id as string || (req as any).context.user.school_id);
            res.json(stats);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const data = await AdmissionService.getApplicationById(req.params.id);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async review(req: Request, res: Response) {
        try {
            const officerId = (req as any).context.user.id;
            const { remark } = req.body;
            const data = await AdmissionService.reviewApplication(req.params.id, officerId, remark);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async recommend(req: Request, res: Response) {
        try {
            const officerId = (req as any).context.user.id;
            const { remark } = req.body;
            const data = await AdmissionService.recommendApplication(req.params.id, officerId, remark);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async approve(req: Request, res: Response) {
        try {
            const hoiId = (req as any).context.user.id;
            const { remark } = req.body;
            const data = await AdmissionService.approveApplication(req.params.id, hoiId, remark);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async reject(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const { reason } = req.body;
            const data = await AdmissionService.rejectApplication(req.params.id, userId, reason);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async enrol(req: Request, res: Response) {
        try {
            const adminId = (req as any).context.user.id;

            // Re-fetch admission to check login status
            const admission = await AdmissionService.getApplicationById(req.params.id);
            if (admission.applicant_user_id) {
                const { data: user } = await supabase.from('users').select('login_status').eq('id', admission.applicant_user_id).single();
                if (user?.login_status !== 'APPROVED') {
                    return res.status(400).json({ error: "Cannot enrol applicant whose login access is not APPROVED" });
                }
            }

            const data = await AdmissionService.enrolApplicant(req.params.id, adminId);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async decideLogin(req: Request, res: Response) {
        try {
            const adminId = (req as any).context.user.id;
            const { status, reason } = req.body;

            if (!['APPROVED', 'REJECTED', 'BLOCKED'].includes(status)) {
                return res.status(400).json({ error: "Invalid status" });
            }

            if (!reason && status !== 'APPROVED') {
                return res.status(400).json({ error: "Reason is mandatory for rejection or blocking" });
            }

            const data = await AdmissionService.decideLogin(req.params.id, adminId, status, reason || 'Login approved by admin');
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async verifyDocs(req: Request, res: Response) {
        try {
            const officerId = (req as any).context.user.id;
            const { remark } = req.body;
            const data = await AdmissionService.verifyDocuments(req.params.id, officerId, remark);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async initiatePayment(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const { amount } = req.body;
            if (!amount) return res.status(400).json({ error: "Amount is required" });

            const data = await AdmissionService.enablePayment(req.params.id, userId, amount);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async makePayment(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const { mode, reference, proof_url } = req.body;

            if (!mode || !reference) {
                return res.status(400).json({ error: "Payment mode and reference are required" });
            }

            const data = await AdmissionService.submitPayment(req.params.id, userId, { mode, reference, proof_url });
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async verifyFee(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const { status, remarks } = req.body; // status: 'verified' | 'correction'

            if (!['verified', 'correction'].includes(status)) {
                return res.status(400).json({ error: "Invalid status. Must be 'verified' or 'correction'" });
            }

            const data = await AdmissionService.verifyPayment(req.params.id, userId, status, remarks);
            res.json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async uploadDoc(req: Request, res: Response) {
        try {
            const { type, url } = req.body;
            const data = await AdmissionService.uploadDocument(req.params.id, type, url);
            res.status(201).json(data);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async initializeBilling(req: Request, res: Response) {
        try {
            const userId = (req as any).context.user.id;
            const admissionId = req.params.id;
            const { fee_structure_ids } = req.body;

            if (!fee_structure_ids || !Array.isArray(fee_structure_ids)) {
                return res.status(400).json({ error: "fee_structure_ids array is required" });
            }

            const data = await AdmissionService.initializeBilling(admissionId, userId, fee_structure_ids);
            res.json(data);
        } catch (error: any) {
            console.error('[ADMISSION BILLING ERROR]', error);
            res.status(400).json({ error: error.message });
        }
    }
}

