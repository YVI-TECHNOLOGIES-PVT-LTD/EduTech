"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionService = void 0;
const supabase_1 = require("../../config/supabase");
const utils_1 = require("../../utils");
const crypto_utils_1 = require("../../auth/crypto.utils");
const prismaClient_1 = __importDefault(require("../../lib/prismaClient"));
class AdmissionService {
    static async resolveContext(academicYearName) {
        const org = (await prismaClient_1.default.organizations.findFirst({
            where: { status: 'active' },
            select: { org_id: true },
        })) ||
            (await prismaClient_1.default.organizations.findFirst({
                select: { org_id: true },
            }));
        if (!org || !org.org_id) {
            throw new Error('No active organization found in database.');
        }
        const orgId = org.org_id;
        const year = (await prismaClient_1.default.academic_years.findFirst({
            where: {
                org_id: orgId,
                ...(academicYearName ? { academic_year_name: academicYearName } : {}),
                status: {
                    in: ['admissions_open', 'open', 'planning'],
                },
            },
            orderBy: { start_date: 'desc' },
            select: { academic_year_id: true },
        })) ||
            (await prismaClient_1.default.academic_years.findFirst({
                where: {
                    org_id: orgId,
                    status: {
                        in: ['admissions_open', 'open', 'planning'],
                    },
                },
                orderBy: { start_date: 'desc' },
                select: { academic_year_id: true },
            })) ||
            (await prismaClient_1.default.academic_years.findFirst({
                where: { org_id: orgId },
                orderBy: { start_date: 'desc' },
                select: { academic_year_id: true },
            }));
        if (!year || !year.academic_year_id) {
            throw new Error(`No eligible academic year found for organization ${orgId}.`);
        }
        return {
            school_id: orgId,
            academic_year_id: year.academic_year_id,
        };
    }
    static async getLeadDashboard(schoolId) {
        const { data: leads, error } = await supabase_1.supabase
            .from('leads')
            .select('id, status, ai_score, created_at')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        const totalLeads = leads?.length || 0;
        const newLeads = leads?.filter((l) => l.status === 'NEW').length || 0;
        const converted = leads?.filter((l) => l.status === 'CONVERTED').length || 0;
        const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
        const highIntentLeads = leads?.filter((l) => (l.ai_score || 0) >= 70).length || 0;
        return {
            totalLeads,
            newLeads,
            converted,
            conversionRate: Number(conversionRate.toFixed(1)),
            highIntentLeads,
        };
    }
    static async getLeadPipeline(schoolId) {
        const { data: leads, error } = await supabase_1.supabase
            .from('leads')
            .select('status')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        const pipelineMap = {
            NEW: 0,
            CONTACTED: 0,
            CAMPUS_VISIT_SCHEDULED: 0,
            CAMPUS_VISITED: 0,
            APPLICATION_SUBMITTED: 0,
            CONVERTED: 0,
            LOST: 0,
        };
        leads?.forEach((l) => {
            if (pipelineMap[l.status] !== undefined) {
                pipelineMap[l.status]++;
            }
        });
        return Object.entries(pipelineMap).map(([stage, count]) => ({ stage, count }));
    }
    static async createPublicApplication(data) {
        let userId = null;
        if (data.parent_password && data.parent_email) {
            const cleanEmail = data.parent_email.trim().toLowerCase();
            const existingUser = await prismaClient_1.default.users.findFirst({
                where: { email: cleanEmail },
            });
            if (existingUser) {
                throw new Error('A user with this email already exists. Please login to apply.');
            }
            const passwordHash = await crypto_utils_1.NativePassword.hash(data.parent_password);
            const newUser = await prismaClient_1.default.users.create({
                data: {
                    org_id: data.school_id,
                    first_name: data.parent_name,
                    email: cleanEmail,
                    phone: data.parent_phone || '',
                    password_hash: passwordHash,
                    status: 'active',
                },
            });
            userId = newUser.user_id;
            const parentRole = await prismaClient_1.default.roles.findFirst({
                where: { role_name: 'PARENT' },
            });
            if (parentRole) {
                await prismaClient_1.default.user_roles.create({
                    data: {
                        user_id: userId,
                        role_id: parentRole.role_id,
                    },
                });
            }
            const existingParent = await prismaClient_1.default.parents.findUnique({
                where: { user_id: userId },
            });
            if (!existingParent) {
                const pParts = (data.parent_name || '').trim().split(' ');
                await prismaClient_1.default.parents.create({
                    data: {
                        org_id: data.school_id,
                        user_id: userId,
                        first_name: pParts[0] || 'Parent',
                        last_name: pParts.slice(1).join(' ') || undefined,
                        phone: data.parent_phone || '9999999999',
                        email: cleanEmail,
                    },
                });
            }
        }
        else {
            throw new Error('Email and Password are required for application submission.');
        }
        const { data: app, error } = await supabase_1.supabase
            .from('admissions')
            .insert({
            school_id: data.school_id,
            applicant_user_id: userId,
            student_first_name: data.student_name,
            student_dob: data.student_dob || null,
            gender: data.gender || 'other',
            grade_applying_for: data.grade_applying_for,
            academic_year_id: data.academic_year_id,
            parent_name: data.parent_name,
            parent_email: data.parent_email,
            parent_phone: data.parent_phone,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw error;
        return app;
    }
    static async createLead(schoolId, leadData) {
        const aiScore = (0, utils_1.calculateAIScore)(leadData);
        const { data, error } = await supabase_1.supabase
            .from('leads')
            .insert({
            school_id: schoolId,
            ...leadData,
            ai_score: aiScore,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async createApplication(schoolId, appData) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .insert({
            school_id: schoolId,
            ...appData,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async updateApplication(id, userId, data) {
        const { data: res, error } = await supabase_1.supabase
            .from('admissions')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return res;
    }
    static async submitApplication(id, userId) {
        const { data: res, error } = await supabase_1.supabase
            .from('admissions')
            .update({ status: 'submitted', submitted_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return res;
    }
    static async getApplications(filters, page = 1, limit = 10, search) {
        let query = supabase_1.supabase.from('admissions').select('*', { count: 'exact' });
        if (filters.school_id)
            query = query.eq('school_id', filters.school_id);
        if (filters.status)
            query = query.eq('status', filters.status);
        if (filters.userId)
            query = query.eq('applicant_user_id', filters.userId);
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to).order('created_at', { ascending: false });
        const { data, count, error } = await query;
        if (error)
            throw error;
        return {
            data: data || [],
            meta: {
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
            },
        };
    }
    static async getStats(schoolId) {
        const { data: apps, error } = await supabase_1.supabase
            .from('admissions')
            .select('status')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        const total = apps?.length || 0;
        const submitted = apps?.filter((a) => a.status === 'submitted').length || 0;
        const approved = apps?.filter((a) => a.status === 'approved').length || 0;
        const enrolled = apps?.filter((a) => a.status === 'enrolled').length || 0;
        const rejected = apps?.filter((a) => a.status === 'rejected').length || 0;
        return { total, submitted, approved, enrolled, rejected };
    }
    static async getApplicationById(id) {
        const { data, error } = await supabase_1.supabase.from('admissions').select('*').eq('id', id).single();
        if (error)
            throw error;
        return data;
    }
    static async reviewApplication(id, officerId, remark) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            status: 'under_review',
            reviewed_by: officerId,
            review_remark: remark,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async recommendApplication(id, officerId, remark) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            status: 'recommended',
            recommended_by: officerId,
            recommend_remark: remark,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async approveApplication(id, hoiId, remark) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            status: 'approved',
            approved_by: hoiId,
            approval_remark: remark,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async rejectApplication(id, userId, reason) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            status: 'rejected',
            rejected_by: userId,
            rejection_reason: reason,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async enrolApplicant(id, adminId) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            status: 'enrolled',
            enrolled_by: adminId,
            enrolled_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async decideLogin(id, adminId, status, reason) {
        const admission = await this.getApplicationById(id);
        if (admission?.applicant_user_id) {
            await prismaClient_1.default.users.update({
                where: { user_id: admission.applicant_user_id },
                data: { status: status === 'APPROVED' ? 'active' : 'suspended' },
            });
        }
        return { success: true, status, reason };
    }
    static async verifyDocuments(id, officerId, remark) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            docs_verified: true,
            docs_verified_by: officerId,
            docs_remark: remark,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async enablePayment(id, userId, amount) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            payment_enabled: true,
            payment_amount: amount,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async submitPayment(id, userId, details) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            payment_status: 'submitted',
            payment_mode: details.mode,
            payment_reference: details.reference,
            payment_proof_url: details.proof_url,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async verifyPayment(id, userId, status, remarks) {
        const { data, error } = await supabase_1.supabase
            .from('admissions')
            .update({
            payment_status: status,
            payment_verified_by: userId,
            payment_remarks: remarks,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async uploadDocument(id, type, url) {
        const { data, error } = await supabase_1.supabase
            .from('admission_documents')
            .insert({
            admission_id: id,
            document_type: type,
            document_url: url,
            created_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    static async initializeBilling(admissionId, userId, fee_structure_ids) {
        return {
            success: true,
            admissionId,
            fee_structure_ids,
            initializedBy: userId,
            timestamp: new Date().toISOString(),
        };
    }
}
exports.AdmissionService = AdmissionService;
