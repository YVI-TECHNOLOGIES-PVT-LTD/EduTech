"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacultyImportStrategy = void 0;
const client_1 = require("@prisma/client");
const supabase_1 = require("../../../config/supabase");
const index_1 = require("../index");
const crypto_utils_1 = require("../../../auth/crypto.utils");
const prisma = new client_1.PrismaClient();
class FacultyImportStrategy extends index_1.BaseImportStrategy {
    constructor() {
        super(...arguments);
        this.facultyRoleId = null;
    }
    async validateRow(row, context) {
        const errors = [];
        if (!row.email || !row.email.includes('@'))
            errors.push('Valid email is required');
        if (!row.full_name || row.full_name.trim().length === 0)
            errors.push('Full name is required');
        if (!row.department_id)
            errors.push('Department ID is required');
        if (!row.designation)
            errors.push('Designation is required');
        if (!row.employee_code)
            errors.push('Employee code is required');
        if (!row.phone)
            errors.push('Phone is required');
        return errors;
    }
    async process(rows, context) {
        const result = {
            successCount: 0,
            failedCount: 0,
            failedRows: [],
        };
        const { data: role } = await supabase_1.supabase
            .from('roles')
            .select('id')
            .eq('name', 'TEACHER')
            .maybeSingle();
        if (!role)
            throw new Error('TEACHER role does not exist');
        this.facultyRoleId = role.id;
        const validRows = [];
        for (const row of rows) {
            const errors = await this.validateRow(row, context);
            if (errors.length > 0) {
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: errors.map((e) => ({ row: row._rowNum, message: e, value: 'INVALID' })),
                    data: row,
                });
            }
            else {
                validRows.push(row);
            }
        }
        const emails = validRows.map((r) => r.email.trim().toLowerCase());
        const existingUsers = await prisma.users.findMany({
            where: { email: { in: emails } },
            select: { email: true },
        });
        const existingEmailsSet = new Set(existingUsers.map((u) => u.email.toLowerCase()));
        for (const row of validRows) {
            const cleanEmail = row.email.trim().toLowerCase();
            if (existingEmailsSet.has(cleanEmail)) {
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: [{ row: row._rowNum, message: 'Email already exists', value: row.email }],
                    data: row,
                });
                continue;
            }
            let createdUserId = null;
            try {
                const tempPassword = 'FacultyTempPass123!';
                const passwordHash = await crypto_utils_1.NativePassword.hash(tempPassword);
                const newUser = await prisma.users.create({
                    data: {
                        org_id: context.schoolId,
                        first_name: row.full_name,
                        email: cleanEmail,
                        phone: row.phone,
                        password_hash: passwordHash,
                        status: 'active',
                    },
                });
                createdUserId = newUser.user_id;
                await supabase_1.supabase.from('user_roles').insert({
                    user_id: createdUserId,
                    role_id: this.facultyRoleId,
                });
                result.successCount++;
            }
            catch (err) {
                if (createdUserId) {
                    await prisma.users.delete({ where: { user_id: createdUserId } }).catch(console.error);
                }
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: [{ row: row._rowNum, message: err.message, value: 'EXECUTION_FAIL' }],
                    data: row,
                });
            }
        }
        return result;
    }
}
exports.FacultyImportStrategy = FacultyImportStrategy;
