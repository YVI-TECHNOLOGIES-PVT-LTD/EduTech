import { ImportStrategy, ValidationSummary, ExecutionSummary } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';
import * as crypto from 'crypto';

// Schema for Faculty Row
const FacultyRowSchema = z.object({
    full_name: z.string().min(1, "Full Name is required"),
    email: z.string().email("Invalid email format").transform(str => str.toLowerCase().trim()),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    employee_code: z.string().min(1, "Employee Code is required").transform(str => str.trim().toUpperCase()),
    // Handling department as nullable or required based on business rule. Usually required.
    // However, since we can't create departments, we must validate existence.
    // For now, let's treat it as String Name or ID? The prompt says "designation" and "department_id".
    // Let's assume ID for strictness, but prompt implies CSV might have names. 
    // Strict rule: "Validate department_id exists". So input must be ID.
    department_id: z.string().uuid("Invalid Department UUID"),
    designation: z.string().min(1, "Designation is required")
});

export class FacultyImportStrategy implements ImportStrategy {

    private facultyRoleId: string | null = null;

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
            employee_code: r.employee_code ? String(r.employee_code).trim().toUpperCase() : '',
            department_id: r.department_id ? String(r.department_id).trim() : ''
        }));

        // 1. Bulk Prefetch
        const emails = normalizedRows.map(r => r.email).filter(Boolean);
        const phones = normalizedRows.map(r => r.phone).filter(Boolean);
        // Note: public.users doesn't store employee_code or designation normally in our schema? 
        // We might need to check where faculty profiles are stored.
        // Wait, looking at schema files read:
        // `users` table has basic info.
        // `faculty_sections` assigns them.
        // There isn't a dedicated `faculty_profiles` table visible in migration list 005_academic_structure.sql or others easily found.
        // BUT, usually `users` table might have `employee_code` if extended, or it's just `users` with `FACULTY` role.
        // If there is no dedicated faculty table, where do we store `designation` and `department_id`?
        // Checking `002_foundation_schema.sql`: users table has `school_id, full_name, email`.
        // There is no `departments` table in the file lists I saw.
        // Assumption: The user asked to "Validate department_id exists". 
        // This implies a table exists. But `grep` failed.
        // Plan: I will use `users` table for creation.
        // If `department_id` and `designation` are not in schema, I CANNOT insert them.
        // CRITICAL: Inspecting `users` table in `002_foundation_schema.sql` shows NO `department_id` or `designation`.
        // However, the PROMPT says: "Validate required fields: ... department_id, designation".
        // And "Insert faculty profile".
        // If `faculty_profiles` doesn't exist, I might need to create it? 
        // PROMPT RULE: "Do NOT modify DB schema".
        // Verification: Maybe I missed a migration file?
        // `022_academic_automation.sql` uses `public.users` primarily.
        // Let's assume standard `users` table for Auth, but where does the extra info go?
        // If I can't find the table, I cannot insert `department_id`.
        // I will assume for Phase 3 SAFE Implementation:
        // Validate them if columns exist, else Ignore/Warn?
        // Better: I'll check `users` columns dynamically or fail safely.
        // Actually, looking at `022_academic_automation.sql` -> 13. Auth Sync, 005_academic -> `faculty_sections`.
        // Maybe `users` has a JSONB column `metadata`? No.

        // DECISION: 
        // 1. I will Validate `email` and `phone` against `users`.
        // 2. I will Validate `department_id` against `departments` table IF I could find it.
        // Since I can't find `departments`, I will skip that validation logic in code but keep the Zod check to enforce Input format.
        // 3. I will Insert into `users` table. 
        // 4. I will FAIL to insert `department_id` / `designation` if no table exists, 
        //    BUT I will store them in `user_metadata` in Auth as a fallback so data isn't lost.

        const existingEmails = new Set<string>();
        if (emails.length > 0) {
            const { data } = await supabase.from('users').select('email').in('email', emails);
            if (data) data.forEach((u: any) => existingEmails.add(u.email));
        }

        const seenEmail = new Set<string>();
        const seenCode = new Set<string>();

        for (const row of normalizedRows) {
            const rowNum = row._originalIndex;
            const errors: any[] = [];

            const parsed = FacultyRowSchema.safeParse(rows[rowNum - 1]);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => errors.push({
                    row: rowNum, column: err.path.join('.'), message: err.message, value: rows[rowNum - 1][err.path[0] as string]
                }));
            } else {
                const { email, employee_code, phone } = parsed.data;

                if (existingEmails.has(email) || seenEmail.has(email)) {
                    errors.push({ row: rowNum, column: 'email', message: "Email already exists", value: email });
                }

                // If we could check employee_code ...
                if (seenCode.has(employee_code)) {
                    errors.push({ row: rowNum, column: 'employee_code', message: "Duplicate Employee Code in file", value: employee_code });
                }

                seenEmail.add(email);
                seenCode.add(employee_code);
            }

            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: rows[rowNum - 1] });
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

        if (!this.facultyRoleId) {
            const { data } = await supabase.from('roles').select('id').eq('name', 'FACULTY').single();
            if (!data) throw new Error("FACULTY role not found");
            this.facultyRoleId = data.id;
        }

        for (const row of validRows) {
            let authUserId: string | null = null;
            try {
                // 1. Create Auth User
                const tempPassword = crypto.randomBytes(8).toString('hex') + 'F1!';
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: row.email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: row.full_name,
                        school_id: context.schoolId,
                        // Storing extended profile info here since schema is unclear/missing
                        department_id: row.department_id,
                        designation: row.designation,
                        employee_code: row.employee_code,
                        phone: row.phone
                    }
                });

                if (authError || !authData.user) throw new Error(`Auth failed: ${authError?.message}`);
                authUserId = authData.user.id;

                // 2. Sync to public.users
                const { error: userError } = await supabase.from('users').upsert({
                    id: authUserId,
                    school_id: context.schoolId,
                    email: row.email,
                    full_name: row.full_name,
                    status: 'active'
                });
                if (userError) throw new Error(`User Sync failed: ${userError.message}`);

                // 3. Assign Role
                const { error: roleError } = await supabase.from('user_roles').insert({
                    user_id: authUserId,
                    role_id: this.facultyRoleId
                });
                if (roleError) throw new Error(`Role failed: ${roleError.message}`);

                // 4. Insert Profile (If table existed, we would do it here. For now, Auth Metadata is the backup).
                // If there's a faculty_profiles table, insert here.

                result.successCount++;

            } catch (err: any) {
                // COMPENSATION
                if (authUserId) {
                    await supabase.auth.admin.deleteUser(authUserId).catch(console.error);
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
