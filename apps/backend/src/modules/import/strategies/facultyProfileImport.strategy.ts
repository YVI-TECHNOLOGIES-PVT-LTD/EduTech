import { supabase } from '../../../config/supabase';
import { BaseImportStrategy, ImportContext, ImportResult } from '../index';
import { NativePassword } from '../../../auth/crypto.utils';
import prisma from '../../../lib/prismaClient';
import { resolveCountryAndPhone } from '../../../utils/country-resolver';

export interface FacultyProfileImportRow {
  _rowNum: number;
  email: string;
  full_name: string;
  department_id: string;
  designation: string;
  employee_code: string;
  phone: string;
}

export class FacultyProfileImportStrategy extends BaseImportStrategy<FacultyProfileImportRow> {
  async validateRow(row: FacultyProfileImportRow, context: ImportContext): Promise<string[]> {
    const errors: string[] = [];
    if (!row.email || !row.email.includes('@')) errors.push('Valid email is required');
    if (!row.full_name || row.full_name.trim().length === 0) errors.push('Full name is required');
    return errors;
  }

  async process(rows: FacultyProfileImportRow[], context: ImportContext): Promise<ImportResult> {
    const result: ImportResult = { successCount: 0, failedCount: 0, failedRows: [] };

    const { data: role } = await supabase
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
      let createdUserId: string | null = null;

      try {
        const existingUser = await prisma.users.findFirst({ where: { email: cleanEmail } });
        if (existingUser) {
          createdUserId = existingUser.user_id;
        } else {
          const resolved = await resolveCountryAndPhone(prisma, { phone: row.phone });
          const tempPassword = 'FacultyTempPass123!';
          const passwordHash = await NativePassword.hash(tempPassword);
          const newUser = await prisma.users.create({
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
          await supabase.from('user_roles').upsert(
            {
              user_id: createdUserId,
              role_id: role.id,
            },
            { onConflict: 'user_id,role_id' },
          );
        }

        result.successCount++;
      } catch (err: any) {
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
