import { ImportStrategy, ValidationSummary, ExecutionSummary } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';
import * as crypto from 'crypto';

// Schema for a single row
const DriverRowSchema = z.object({
    full_name: z.string().min(1, "Full Name is required"),
    email: z.string().email("Invalid email format").transform(str => str.toLowerCase().trim()),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    license_no: z.string().min(5, "License Number is required").transform(str => str.trim().toUpperCase()),
    license_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry must be YYYY-MM-DD")
        .refine((date) => new Date(date) > new Date(), { message: "License has expired" })
});

export class DriverImportStrategy implements ImportStrategy {

    // Cache for Role ID
    private driverRoleId: string | null = null;

    async validate(rows: any[], schoolId: string): Promise<ValidationSummary> {
        const result: ValidationSummary = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };

        const normalizedRows = rows.map((r, i) => ({
            ...r,
            _originalIndex: i + 1,
            email: r.email ? String(r.email).toLowerCase().trim() : '',
            license_no: r.license_no ? String(r.license_no).trim().toUpperCase() : '',
            phone: r.phone ? String(r.phone).trim() : ''
        }));

        // 1. Bulk Prefetch
        const emails = normalizedRows.map(r => r.email).filter(Boolean);
        const phones = normalizedRows.map(r => r.phone).filter(Boolean);
        const licenses = normalizedRows.map(r => r.license_no).filter(Boolean);

        const existingEmails = new Set<string>();
        const existingPhones = new Set<string>();
        const existingLicenses = new Set<string>();

        // Check Emails in public.users (Broad check)
        if (emails.length > 0) {
            const { data } = await supabase.from('users').select('email').in('email', emails);
            if (data) data.forEach((u: any) => existingEmails.add(u.email));
        }

        // Check Phones/Licenses in transport_drivers
        if (phones.length > 0) {
            const { data } = await supabase.from('transport_drivers').select('phone').eq('school_id', schoolId).in('phone', phones);
            if (data) data.forEach((d: any) => existingPhones.add(d.phone));
        }
        if (licenses.length > 0) {
            const { data } = await supabase.from('transport_drivers').select('license_number').eq('school_id', schoolId).in('license_number', licenses);
            if (data) data.forEach((d: any) => existingLicenses.add(d.license_number));
        }

        const seenEmail = new Set<string>();
        const seenLicense = new Set<string>();

        // 2. Row Validation
        for (const row of normalizedRows) {
            const rowNum = row._originalIndex;
            const errors: any[] = [];
            const originalData = rows[rowNum - 1];

            const parsed = DriverRowSchema.safeParse(originalData);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({
                        row: rowNum,
                        column: err.path.join('.'),
                        message: err.message,
                        value: originalData[err.path[0] as string]
                    });
                });
            } else {
                // Logic Validation
                const { email, license_no, phone } = parsed.data;

                if (existingEmails.has(email) || seenEmail.has(email)) {
                    errors.push({ row: rowNum, column: 'email', message: `Email '${email}' already exists or duplicate in file`, value: email });
                }
                if (existingPhones.has(phone)) {
                    errors.push({ row: rowNum, column: 'phone', message: `Phone '${phone}' already taken`, value: phone });
                }
                if (existingLicenses.has(license_no) || seenLicense.has(license_no)) {
                    errors.push({ row: rowNum, column: 'license_no', message: `License '${license_no}' already exists or duplicate`, value: license_no });
                }

                seenEmail.add(email);
                seenLicense.add(license_no);
            }

            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: originalData });
            } else {
                result.validRows.push({ ...parsed.data, _rowNum: rowNum });
            }
        }

        result.isValid = result.failedRows.length === 0;
        return result;
    }

    async execute(validRows: any[], context: { schoolId: string; userId: string; jobId: string }): Promise<ExecutionSummary> {
        const result: ExecutionSummary = {
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            failedRows: []
        };

        // Fetch Role ID once
        if (!this.driverRoleId) {
            const { data } = await supabase.from('roles').select('id').eq('name', 'DRIVER').single();
            if (!data) throw new Error("Configuration Error: DRIVER role missing in system");
            this.driverRoleId = data.id;
        }

        // Sequential Execution with Compensation
        for (const row of validRows) {
            let authUserId: string | null = null;

            try {
                // A. Create Auth User
                const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!'; // Ensure complexity
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: row.email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: row.full_name,
                        school_id: context.schoolId
                    }
                });

                if (authError || !authData.user) {
                    throw new Error(`Auth creation failed: ${authError?.message}`);
                }
                authUserId = authData.user.id;

                // B. Ensure public.users (Trigger usually handles this, but we upsert to be sure before linking)
                // This prevents race conditions if the trigger is slow
                const { error: userError } = await supabase.from('users').upsert({
                    id: authUserId,
                    school_id: context.schoolId,
                    email: row.email,
                    full_name: row.full_name,
                    status: 'active'
                });

                if (userError) throw new Error(`Profile sync failed: ${userError.message}`);

                // C. Assign Role
                const { error: roleError } = await supabase.from('user_roles').insert({
                    user_id: authUserId,
                    role_id: this.driverRoleId
                });

                if (roleError) throw new Error(`Role assignment failed: ${roleError.message}`);

                // D. Insert Driver Profile
                // Note: license_expiry is validated but NOT persisted as per schema limitations
                const { error: driverError } = await supabase.from('transport_drivers').insert({
                    school_id: context.schoolId,
                    user_id: authUserId,
                    license_number: row.license_no,
                    phone: row.phone,
                    status: 'ACTIVE'
                });

                if (driverError) throw new Error(`Driver profile failed: ${driverError.message}`);

                result.successCount++;

            } catch (err: any) {
                // COMPENSATION: Delete Auth User if created
                if (authUserId) {
                    await supabase.auth.admin.deleteUser(authUserId).catch(e => console.error("Compensation failed", e));
                }

                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: [{ row: row._rowNum, message: err.message, value: 'EXECUTION_FAIL' }],
                    data: row
                });
            }
        }

        return result;
    }
}
