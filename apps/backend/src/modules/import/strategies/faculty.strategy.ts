import { supabase } from '../../../config/supabase';
import { BaseImportStrategy, ImportContext, ImportResult } from '../index';
import { NativePassword } from '../../../auth/crypto.utils';
import prisma from '../../../lib/prismaClient';
import {
  isValidEmail,
  isValidPhoneNumber,
  normalizeEmail,
  normalizePhoneNumber,
} from '@edutrack/validation';
import { resolveCountryAndPhone } from '../../../utils/country-resolver';

export interface FacultyImportRow {
  _rowNum: number;
  email: string;
  full_name: string;
  department_id: string;
  designation: string;
  employee_code: string;
  phone: string;
}

export class FacultyImportStrategy extends BaseImportStrategy<FacultyImportRow> {
  private facultyRoleId: string | null = null;

  async validateRow(row: FacultyImportRow, context: ImportContext): Promise<string[]> {
    const errors: string[] = [];

    if (!row.email || !isValidEmail(row.email)) errors.push('Enter a valid email address.');
    if (!row.full_name || row.full_name.trim().length === 0) errors.push('Full name is required');
    if (!row.department_id) errors.push('Department ID is required');
    if (!row.designation) errors.push('Designation is required');
    if (!row.employee_code) errors.push('Employee code is required');
    if (!row.phone || !isValidPhoneNumber(row.phone))
      errors.push('Enter a valid 10-digit mobile number.');

    return errors;
  }

  async process(rows: FacultyImportRow[], context: ImportContext): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      failedCount: 0,
      failedRows: [],
    };

    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'TEACHER')
      .maybeSingle();
    if (!role) throw new Error('TEACHER role does not exist');
    this.facultyRoleId = role.id;

    const validRows: FacultyImportRow[] = [];
    for (const row of rows) {
      const errors = await this.validateRow(row, context);
      if (errors.length > 0) {
        result.failedCount++;
        result.failedRows.push({
          row: row._rowNum,
          errors: errors.map((e) => ({ row: row._rowNum, message: e, value: 'INVALID' })),
          data: row,
        });
      } else {
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

      let createdUserId: string | null = null;
      try {
        const tempPassword = 'FacultyTempPass123!';
        const passwordHash = await NativePassword.hash(tempPassword);
        const resolved = await resolveCountryAndPhone(prisma, { phone: row.phone });
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

        await supabase.from('user_roles').insert({
          user_id: createdUserId,
          role_id: this.facultyRoleId,
        });

        result.successCount++;
      } catch (err: any) {
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
