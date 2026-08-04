import { ImportStrategy, ValidationSummary, ExecutionSummary, ImportOptions, ImportUserMode } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';

const FacultyProfileRowSchema = z.object({
    email: z.string().email("Invalid email format").transform(str => str.toLowerCase().trim()),
    employee_code: z.string().min(1, "Employee Code is required").transform(str => str.trim().toUpperCase()),
    designation: z.string().min(1, "Designation is required"),
    qualification: z.string().optional(),
    joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    department: z.string().optional() // Name of department
});

export class FacultyProfileImportStrategy implements ImportStrategy {

    async validate(rows: any[], schoolId: string, options?: ImportOptions): Promise<ValidationSummary> {
        const userMode = options?.userMode || 'STRICT';
        const result: ValidationSummary = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };

        const emailSet = new Set<string>();
        const codeSet = new Set<string>();

        // Pre-fetch Users and Departments
        const emails = rows.map(r => r.email?.toString().toLowerCase().trim()).filter(Boolean);
        const departments = rows.map(r => r.department?.toString().trim()).filter(Boolean);

        let usersMap = new Map<string, { id: string, roleName: string }>();
        let departmentsMap = new Map<string, string>(); // Name -> ID
        let existingCodes = new Set<string>();
        let existingUserIds = new Set<string>();

        // 1. Fetch Users & Roles
        if (emails.length > 0) {
            const { data } = await supabase
                .from('users')
                .select(`id, email, user_roles!inner(role:roles!inner(name))`)
                .eq('school_id', schoolId)
                .in('email', emails);

            if (data) {
                data.forEach((u: any) => {
                    // Assuming one role per user logic or checking all
                    const roleName = u.user_roles?.[0]?.role?.name;
                    usersMap.set(u.email, { id: u.id, roleName });
                });
            }
        }

        // Fetch FACULTY Role ID for auto-creation check
        const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'FACULTY').single();
        const facultyRoleId = roleData?.id;

        // 2. Fetch Departments
        if (departments.length > 0) {
            const { data } = await supabase
                .from('departments')
                .select('id, name')
                .eq('school_id', schoolId)
                .in('name', departments);

            if (data) {
                data.forEach((d: any) => departmentsMap.set(d.name.toLowerCase(), d.id));
            }
        }

        // 3. Fetch Existing Profiles to check duplicates
        if (usersMap.size > 0) {
            const userIds = Array.from(usersMap.values()).map(u => u.id);
            const { data: profiles } = await supabase
                .from('faculty_profiles')
                .select('user_id, employee_code')
                .in('user_id', userIds);

            if (profiles) {
                profiles.forEach((p: any) => {
                    existingUserIds.add(p.user_id);
                    existingCodes.add(p.employee_code);
                });
            }
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            const errors: any[] = [];

            const parsed = FacultyProfileRowSchema.safeParse(row);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({ row: rowNum, column: err.path.join('.'), message: err.message, value: row[err.path[0] as string] });
                });
            } else {
                const { email, employee_code, department } = parsed.data;

                // Check User
                let user = usersMap.get(email);

                if (!user) {
                    if (userMode === 'AUTO_CREATE') {
                        // AUTO_CREATE LOGIC
                        if (!facultyRoleId) {
                            errors.push({ row: rowNum, column: 'general', message: "System Error: FACULTY Role not found", value: 'N/A' });
                        } else {
                            try {
                                // 1. Create Auth User
                                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                                    email: email,
                                    password: "Welcome#321",
                                    email_confirm: true,
                                    user_metadata: {
                                        full_name: parsed.data.email.split('@')[0],
                                        school_id: schoolId,
                                        created_via_import: true,
                                        force_password_change: true
                                    }
                                });

                                if (authError) throw authError;
                                if (!authData.user) throw new Error("Auth user creation failed");

                                const newUserId = authData.user.id;

                                // 2. Create Public User
                                const { error: userError } = await supabase.from('users').upsert({
                                    id: newUserId,
                                    school_id: schoolId,
                                    email: email,
                                    full_name: parsed.data.email.split('@')[0],
                                    status: 'active'
                                });
                                if (userError) throw userError;

                                // 3. Assign Role
                                const { error: roleError } = await supabase.from('user_roles').insert({
                                    user_id: newUserId,
                                    role_id: facultyRoleId
                                });
                                if (roleError) throw roleError;

                                // 4. Update Map & Local Var
                                user = { id: newUserId, roleName: 'FACULTY' };
                                usersMap.set(email, user);

                            } catch (err: any) {
                                errors.push({ row: rowNum, column: 'email', message: `Auto-create failed: ${err.message}`, value: email });
                            }
                        }
                    } else {
                        errors.push({ row: rowNum, column: 'email', message: "User not found. Enable AUTO_CREATE to create users automatically.", value: email });
                    }
                }

                // Re-check user existence after potential auto-create
                if (user) {
                    if (user.roleName !== 'FACULTY') {
                        errors.push({ row: rowNum, column: 'email', message: `User has role '${user.roleName}', expected FACULTY`, value: email });
                    } else if (existingUserIds.has(user.id)) {
                        errors.push({ row: rowNum, column: 'email', message: "Faculty profile already exists for this user", value: email });
                    }
                }

                if (existingCodes.has(employee_code) || codeSet.has(employee_code)) {
                    errors.push({ row: rowNum, column: 'employee_code', message: "Employee code must be unique", value: employee_code });
                }

                if (department && !departmentsMap.has(department.toLowerCase())) {
                    errors.push({ row: rowNum, column: 'department', message: `Department '${department}' not found. Create it in Settings → Departments.`, value: department });
                }

                if (emailSet.has(email)) {
                    errors.push({ row: rowNum, column: 'email', message: "Duplicate email in file", value: email });
                }

                if (errors.length === 0 && user) {
                    emailSet.add(email);
                    codeSet.add(employee_code);

                    const validRow = {
                        ...parsed.data,
                        user_id: user.id,
                        department_id: department ? departmentsMap.get(department.toLowerCase()) : null,
                        _rowNum: rowNum
                    };
                    result.validRows.push(validRow);
                }
            }

            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: row });
            }
        }

        result.isValid = result.failedRows.length === 0;
        return result;
    }

    async execute(validRows: any[], context: { schoolId: string; userId: string; jobId: string; userMode?: ImportUserMode }): Promise<ExecutionSummary> {
        const result: ExecutionSummary = {
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            failedRows: []
        };

        for (const row of validRows) {
            try {
                const { error } = await supabase
                    .from('faculty_profiles')
                    .insert({
                        user_id: row.user_id,
                        employee_code: row.employee_code,
                        designation: row.designation,
                        qualification: row.qualification,
                        joining_date: row.joining_date,
                        department_id: row.department_id,
                        status: 'active'
                    });

                if (error) throw new Error(error.message);
                result.successCount++;

            } catch (err: any) {
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: [{ row: row._rowNum, message: err.message, value: 'INSERT_FAIL' }],
                    data: row
                });
            }
        }

        return result;
    }
}
