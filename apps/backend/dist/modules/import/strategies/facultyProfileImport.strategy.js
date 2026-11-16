"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacultyProfileImportStrategy = void 0;
const supabase_1 = require("../../../config/supabase");
const index_1 = require("../index");
const crypto_utils_1 = require("../../../auth/crypto.utils");
const prismaClient_1 = __importDefault(require("../../../lib/prismaClient"));
const country_resolver_1 = require("../../../utils/country-resolver");
class FacultyProfileImportStrategy extends index_1.BaseImportStrategy {
    async validateRow(row, context) {
        const errors = [];
        if (!row.email || !row.email.includes('@'))
            errors.push('Valid email is required');
        if (!row.full_name || row.full_name.trim().length === 0)
            errors.push('Full name is required');
        return errors;
    }
    async process(rows, context) {
        const result = { successCount: 0, failedCount: 0, failedRows: [] };
        const { data: role } = await supabase_1.supabase
            .from('roles')
            .select('id')
            .eq('name', 'TEACHER')
            .maybeSingle();
        for (const row of rows) {
            const errors = await this.validateRow(row, context);
            if (errors.length > 0) {
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum,
                    errors: errors.map((e) => ({ row: row._rowNum, message: e, value: 'INVALID' })),
                    data: row,
                });
                continue;
            }
            const cleanEmail = row.email.trim().toLowerCase();
            let createdUserId = null;
            try {
                const existingUser = await prismaClient_1.default.users.findFirst({ where: { email: cleanEmail } });
                if (existingUser) {
                    createdUserId = existingUser.user_id;
                }
                else {
                    const resolved = await (0, country_resolver_1.resolveCountryAndPhone)(prismaClient_1.default, { phone: row.phone });
                    const tempPassword = 'FacultyTempPass123!';
                    const passwordHash = await crypto_utils_1.NativePassword.hash(tempPassword);
                    const newUser = await prismaClient_1.default.users.create({
                        data: {
                            org_id: context.schoolId,
                            first_name: row.full_name,
                            email: cleanEmail,
                            phone: resolved.phone,
                            country_id: resolved.country_id,
                            password_hash: passwordHash,
                            status: 'active',
                        },
                    });
                    createdUserId = newUser.user_id;
                }
                if (role && createdUserId) {
                    await supabase_1.supabase.from('user_roles').upsert({
                        user_id: createdUserId,
                        role_id: role.id,
                    }, { onConflict: 'user_id,role_id' });
                }
                result.successCount++;
            }
            catch (err) {
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
exports.FacultyProfileImportStrategy = FacultyProfileImportStrategy;
