import { ImportStrategy, ValidationSummary, ExecutionSummary, ImportOptions, ImportUserMode } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';

const StaffProfileRowSchema = z.object({
    email: z.string().email("Invalid email format").transform(str => str.toLowerCase().trim()),
    staff_type: z.enum(['librarian', 'accountant', 'clerk', 'transport_manager', 'other'],
        { errorMap: () => ({ message: "Invalid staff_type. Allowed: librarian, accountant, clerk, transport_manager, other" }) }),
    joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    department: z.string().optional() // Name of department
});

export class StaffProfileImportStrategy implements ImportStrategy {

    async validate(rows: any[], schoolId: string, options?: ImportOptions): Promise<ValidationSummary> {
        const userMode = options?.userMode || 'STRICT';

        const result: ValidationSummary = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };

        const emailSet = new Set<string>();
        const emails = rows.map(r => r.email?.toString().toLowerCase().trim()).filter(Boolean);
        const departments = rows.map(r => r.department?.toString().trim()).filter(Boolean);

        let usersMap = new Map<string, { id: string, roleName: string }>();
        let departmentsMap = new Map<string, string>(); // Name -> ID
        let existingUserIds = new Set<string>();

        // 1. Fetch Users
        if (emails.length > 0) {
            const { data } = await supabase
                .from('users')
                .select(`id, email, user_roles!inner(role:roles!inner(name))`)
                .eq('school_id', schoolId)
                .in('email', emails);

            if (data) {
                data.forEach((u: any) => {
                    const roleName = u.user_roles?.[0]?.role?.name;
                    usersMap.set(u.email, { id: u.id, roleName });
                });
            }
        }

        // Fetch STAFF Role ID
        const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'STAFF').single();
        const staffRoleId = roleData?.id;

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

        // 3. Check Duplicates in DB
        if (usersMap.size > 0) {
            const userIds = Array.from(usersMap.values()).map(u => u.id);
            const { data: profiles } = await supabase
                .from('staff_profiles')
                .select('user_id')
                .in('user_id', userIds);

            if (profiles) {
                profiles.forEach((p: any) => existingUserIds.add(p.user_id));
            }
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 1;
            const errors: any[] = [];

            const parsed = StaffProfileRowSchema.safeParse(row);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({ row: rowNum, column: err.path.join('.'), message: err.message, value: row[err.path[0] as string] });
                });
            } else {
                const { email, department } = parsed.data;
                let user = usersMap.get(email);

                if (!user) {
                    if (userMode === 'AUTO_CREATE') {
                        if (!staffRoleId) {
                            errors.push({ row: rowNum, column: 'general', message: "System Error: STAFF Role not found", value: 'N/A' });
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
                                    role_id: staffRoleId
                                });
                                if (roleError) throw roleError;

                                // 4. Update local map
                                user = { id: newUserId, roleName: 'STAFF' };
                                usersMap.set(email, user);

                            } catch (err: any) {
                                errors.push({ row: rowNum, column: 'email', message: `Auto-create failed: ${err.message}`, value: email });
                            }
                        }
                    } else {
                        errors.push({ row: rowNum, column: 'email', message: "User not found. Enable AUTO_CREATE to create users automatically.", value: email });
                    }
                }

                if (user) {
                    if (user.roleName !== 'STAFF') {
                        errors.push({ row: rowNum, column: 'email', message: `User has role '${user.roleName}', expected STAFF`, value: email });
                    } else if (existingUserIds.has(user.id)) {
                        errors.push({ row: rowNum, column: 'email', message: "Staff profile already exists", value: email });
                    }
                }

                if (department && !departmentsMap.has(department.toLowerCase())) {
                    errors.push({ row: rowNum, column: 'department', message: `Department '${department}' not found. Create it in Settings → Departments.`, value: department });
                }

                if (emailSet.has(email)) {
                    errors.push({ row: rowNum, column: 'email', message: "Duplicate email in file", value: email });
                }

                if (errors.length === 0 && user) {
                    emailSet.add(email);
                    result.validRows.push({
                        ...parsed.data,
                        user_id: user.id,
                        department_id: department ? departmentsMap.get(department.toLowerCase()) : null,
                        _rowNum: rowNum
                    });
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
                // Note: 'designation' removed because it is missing in the current staff_profiles table schema (ref: migration 042)
                const { error } = await supabase
                    .from('staff_profiles')
                    .insert({
                        user_id: row.user_id,
                        staff_type: row.staff_type,
                        department_id: row.department_id,
                        joining_date: row.joining_date,
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
