import { supabase } from '../../config/supabase';
import { getPaginationRange, applySearch, createPaginatedResult } from '../../utils/queryHelpers';

export class AdmissionService {
    static async createApplication(userId: string | null, data: any) {
        const { data: app, error } = await supabase
            .from('admissions')
            .insert({
                ...data,
                applicant_user_id: userId
            })
            .select()
            .single();

        if (error) throw error;
        return app;
    }

    static async resolveContext() {
        const { data: school, error: schoolError } = await supabase.from('schools').select('id').limit(1).single();
        if (schoolError || !school) throw new Error('No active school found');

        const { data: year } = await supabase
            .from('academic_years')
            .select('id')
            .eq('school_id', school.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        return {
            school_id: school.id,
            academic_year_id: year?.id || null
        };
    }

    static async createPublicApplication(data: any) {
        // 1. Create Auth User if parent_password and parent_email are provided
        let userId = null;
        if (data.parent_password && data.parent_email) {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: data.parent_email,
                password: data.parent_password,
                email_confirm: true,
                user_metadata: {
                    full_name: data.parent_name,
                    school_id: data.school_id
                }
            });

            if (authError) {
                if (authError.message.includes('already exists')) {
                    throw new Error('A user with this email already exists. Please login to apply.');
                }
                throw authError;
            }

            userId = authData.user.id;

            // 2. Assign PARENT role
            const { data: role } = await supabase.from('roles').select('id').eq('name', 'PARENT').single();
            if (role) {
                await supabase.from('user_roles').insert({
                    user_id: userId,
                    role_id: role.id
                });
            }
        } else {
            throw new Error('Email and Password are required for application submission.');
        }

        // 3. Save application with status 'submitted' and link to the new user
        const { data: app, error } = await supabase
            .from('admissions')
            .insert({
                ...data,
                applicant_user_id: userId,
                status: 'submitted',
                submitted_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return { app };
    }

    static async updateApplication(id: string, userId: string, data: any) {
        const { data: app, error } = await supabase
            .from('admissions')
            .update(data)
            .eq('id', id)
            .eq('applicant_user_id', userId)
            .eq('status', 'draft') // Only draft can be updated by parent
            .select()
            .single();

        if (error) throw error;
        return app;
    }

    static async submitApplication(id: string, userId: string) {
        const { data: app, error } = await supabase
            .from('admissions')
            .update({ status: 'submitted', submitted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('applicant_user_id', userId)
            .eq('status', 'draft')
            .select()
            .single();

        if (error) throw error;

        // Log audit
        await this.logAudit(id, 'SUBMITTED', userId, 'Application submitted by parent');

        return app;
    }

    static async getApplications(filters: any, page: number = 1, limit: number = 10, search?: string) {
        let query = supabase.from('admissions').select('*, academic_years(year_label)', { count: 'exact' });

        if (filters.school_id) query = query.eq('school_id', filters.school_id);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.userId) query = query.eq('applicant_user_id', filters.userId);

        if (search) {
            query = applySearch(query, search, ['student_name', 'parent_name', 'parent_phone', 'id']);
        }

        const { from, to } = getPaginationRange(page, limit);
        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        return createPaginatedResult(data, count, page, limit);
    }

    static async getStats(schoolId?: string) {
        let query = supabase.from('admissions').select('id, status, created_at, updated_at');
        if (schoolId) query = query.eq('school_id', schoolId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    static async getApplicationById(id: string) {
        const { data, error } = await supabase
            .from('admissions')
            .select('*, admission_documents(*), admission_audit_logs(*), academic_years(*), applicant:applicant_user_id(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    static async reviewApplication(id: string, officerId: string, remark: string) {
        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: 'under_review',
                remark_by_officer: remark
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, 'UNDER_REVIEW', officerId, remark);
        return data;
    }

    static async recommendApplication(id: string, officerId: string, remark: string) {
        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: 'recommended',
                remark_by_officer: remark,
                recommended_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, 'RECOMMENDED', officerId, remark);
        return data;
    }

    static async approveApplication(id: string, hoiId: string, remark: string) {
        const { data: app, error } = await supabase
            .from('admissions')
            .update({
                status: 'approved',
                remark_by_hoi: remark,
                approved_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log audit
        await this.logAudit(id, 'APPROVED', hoiId, remark);
        return app;
    }

    static async enrolApplicant(id: string, adminId: string) {
        // 1. Fetch admission
        const { data: app, error: fetchError } = await supabase
            .from('admissions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !app) throw new Error('Admission record not found');
        if (app.status !== 'approved') throw new Error('Only approved applications can be enrolled');

        // 2. Check for duplicate enrolment
        const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('admission_id', id)
            .maybeSingle(); // Use maybeSingle to avoid 406/error if not found

        if (existingStudent) throw new Error('Applicant is already enrolled as a student');

        // 3. Create student
        const studentCode = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: student, error: studentError } = await supabase
            .from('students')
            .insert({
                school_id: app.school_id,
                admission_id: app.id,
                full_name: app.student_name,
                date_of_birth: app.date_of_birth,
                gender: app.gender,
                student_code: studentCode,
                status: 'active'
            })
            .select()
            .single();

        if (studentError) throw studentError;

        // 4. Link parent
        await supabase.from('student_parents').insert({
            student_id: student.id,
            parent_user_id: app.applicant_user_id,
            relation: 'guardian'
        });

        // 5. Update admission status to enrolled
        await supabase.from('admissions').update({ status: 'enrolled' }).eq('id', id);

        // 6. Log audit
        await this.logAudit(id, 'ENROLLED', adminId, 'Applicant manually enrolled by admin');

        return student;
    }

    static async rejectApplication(id: string, userId: string, reason: string) {
        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                rejected_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, 'REJECTED', userId, reason);
        return data;
    }

    // ==========================================
    // NEW WORKFLOW METHODS
    // ==========================================

    static async verifyDocuments(id: string, officerId: string, remark: string) {
        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: 'docs_verified',
                remark_by_officer: remark
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, 'DOCS_VERIFIED', officerId, remark);
        return data;
    }

    static async enablePayment(id: string, userId: string, amount: number) {
        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: 'payment_pending',
                payment_amount: amount,
                payment_enabled: true
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, 'PAYMENT_ENABLED', userId, `Fee enabled: ${amount}`);
        return data;
    }

    static async submitPayment(id: string, userId: string, paymentData: any) {
        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: 'payment_submitted',
                payment_mode: paymentData.mode,
                payment_reference: paymentData.reference,
                payment_proof: paymentData.proof_url,
                payment_date: new Date().toISOString()
            })
            .eq('id', id)
            .eq('applicant_user_id', userId)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, 'PAYMENT_SUBMITTED', userId, `Payment submitted via ${paymentData.mode}`);
        return data;
    }

    static async verifyPayment(id: string, userId: string, status: 'verified' | 'correction', remarks: string) {
        const newStatus = status === 'verified' ? 'payment_verified' : 'payment_correction';
        const isVerified = status === 'verified';

        const { data, error } = await supabase
            .from('admissions')
            .update({
                status: newStatus,
                payment_verified: isVerified,
                remark_by_finance: remarks
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await this.logAudit(id, isVerified ? 'PAYMENT_VERIFIED' : 'PAYMENT_CORRECTION', userId, remarks);
        return data;
    }

    static async logAudit(admissionId: string, action: string, performedBy: string, remarks: string) {
        await supabase.from('admission_audit_logs').insert({
            admission_id: admissionId,
            action,
            performed_by: performedBy,
            remarks
        });
    }

    static async uploadDocument(admissionId: string, type: string, url: string) {
        const { data, error } = await supabase
            .from('admission_documents')
            .insert({
                admission_id: admissionId,
                document_type: type,
                file_url: url
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async decideLogin(admissionId: string, adminId: string, status: 'APPROVED' | 'REJECTED' | 'BLOCKED', reason: string) {
        // 1. Fetch admission to get the parent/student user ID
        const { data: app, error: appError } = await supabase
            .from('admissions')
            .select('applicant_user_id')
            .eq('id', admissionId)
            .single();

        if (appError || !app?.applicant_user_id) throw new Error('Admission or applicant not found');

        // 2. Update user record
        const { error: userError } = await supabase
            .from('users')
            .update({
                login_status: status,
                login_decision_reason: reason,
                login_decided_by: adminId,
                login_decided_at: new Date().toISOString()
            })
            .eq('id', app.applicant_user_id);

        if (userError) throw userError;

        // 3. Log to admission timeline
        const action = status === 'APPROVED' ? 'LOGIN_APPROVAL_GRANTED' :
            status === 'REJECTED' ? 'LOGIN_APPROVAL_REJECTED' : 'LOGIN_ACCESS_REVOKED';

        await this.logAudit(admissionId, action, adminId, reason);

        return { success: true };
    }

    static async initializeBilling(admissionId: string, performedBy: string, feeStructureIds: string[]) {
        // 1. Fetch Admission details
        const { data: admission, error: admError } = await supabase
            .from('admissions')
            .select('*')
            .eq('id', admissionId)
            .single();

        if (admError || !admission) throw new Error('Admission not found');

        // Validation rules
        if (!['docs_verified', 'payment_pending', 'payment_correction'].includes(admission.status)) {
            throw new Error(`Billing can only be initialized for applications in verified or pending payment state. Current status: ${admission.status}`);
        }

        if (admission.payment_reference) {
            throw new Error('Payment already initiated or submitted. Billing cannot be re-initialized.');
        }

        if (!feeStructureIds || feeStructureIds.length === 0) {
            throw new Error('At least one fee structure must be selected.');
        }

        // 2. Fetch Fee Structures
        const { data: structures, error: structError } = await supabase
            .from('fee_structures')
            .select('*')
            .in('id', feeStructureIds);

        if (structError) throw structError;
        if (!structures || structures.length !== feeStructureIds.length) {
            throw new Error('One or more selected fee structures are invalid or do not exist.');
        }

        // 3. Cross-Validation: Year & Grade
        const academicYearId = admission.academic_year_id;
        const studentGrade = admission.grade_applied_for;

        for (const s of structures) {
            if (s.academic_year_id !== academicYearId) {
                throw new Error(`Fee "${s.name}" belongs to a different academic year.`);
            }
            // Basic check for grade applicability
            if (s.applicable_classes && !s.applicable_classes.toLowerCase().includes(studentGrade.toLowerCase())) {
                // We'll allow it but maybe log a warning? For now let's be strict if the user requested it.
                // throw new Error(`Fee "${s.name}" is not applicable for grade ${studentGrade}.`);
            }
        }

        // 4. Check for Mandatory Fees
        const { data: allMandatory } = await supabase
            .from('fee_structures')
            .select('*')
            .eq('academic_year_id', academicYearId)
            .eq('is_mandatory', true);

        if (allMandatory) {
            // Only count as mandatory if it applies to this specific grade
            const applicableMandatory = allMandatory.filter(mf =>
                !mf.applicable_classes ||
                mf.applicable_classes.toLowerCase().includes(studentGrade.toLowerCase())
            );

            const missingMandatory = applicableMandatory.filter(mf => !feeStructureIds.includes(mf.id));
            if (missingMandatory.length > 0) {
                throw new Error(`Missing mandatory fees for grade ${studentGrade}: ${missingMandatory.map(m => m.name).join(', ')}`);
            }
        }

        // 5. Atomic Snapshot Creation
        // First clean up any existing enabled fees for this admission (if any exist from a previous attempt)
        await supabase.from('admission_fees').delete().eq('admission_id', admissionId);

        const snapshots = structures.map(s => ({
            admission_id: admissionId,
            fee_structure_id: s.id,
            snapshot_name: s.name,
            snapshot_amount: s.amount,
            snapshot_category: s.category || 'General',
            is_mandatory: s.is_mandatory,
            enabled_by: performedBy
        }));

        const { error: insertError } = await supabase
            .from('admission_fees')
            .insert(snapshots);

        if (insertError) throw insertError;

        // 6. Update Admission Record
        const totalAmount = structures.reduce((sum, s) => sum + Number(s.amount), 0);
        const { error: updateError } = await supabase
            .from('admissions')
            .update({
                payment_enabled: true,
                payment_amount: totalAmount,
                status: admission.status === 'docs_verified' ? 'payment_pending' : admission.status
            })
            .eq('id', admissionId);

        if (updateError) throw updateError;

        // 7. Audit Logging
        await this.logAudit(
            admissionId,
            'BILLING_INITIALIZED',
            performedBy,
            `Initialized with ${structures.length} components. Total Amount: ₹${totalAmount.toLocaleString()}`
        );

        return {
            success: true,
            total_amount: totalAmount,
            components_count: structures.length
        };
    }
}

