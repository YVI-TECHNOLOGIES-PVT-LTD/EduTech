import { supabase } from '../../../config/supabase';
import { BaseImportStrategy, ImportContext, ImportResult } from '../index';
import { NativePassword } from '../../../auth/crypto.utils';
import prisma from '../../../lib/prismaClient';
import { isValidEmail, isValidPhoneNumber, normalizePhoneNumber } from '@edutrack/validation';

export interface DriverImportRow {
  _rowNum: number;
  email: string;
  full_name: string;
  license_no: string;
  phone: string;
  license_expiry?: string;
}

export class DriverImportStrategy extends BaseImportStrategy<DriverImportRow> {
  private driverRoleId: string | null = null;

  async validateRow(row: DriverImportRow, context: ImportContext): Promise<string[]> {
    const errors: string[] = [];

    if (!row.email || !isValidEmail(row.email)) errors.push('Enter a valid email address.');
    if (!row.full_name || row.full_name.trim().length === 0) errors.push('Full name is required');
    if (!row.license_no || row.license_no.trim().length === 0)
      errors.push('License number is required');
    if (!row.phone || !isValidPhoneNumber(row.phone))
      errors.push('Enter a valid 10-digit mobile number.');

    if (row.license_expiry) {
      const expDate = new Date(row.license_expiry);
      if (isNaN(expDate.getTime()) || expDate < new Date()) {
        errors.push('License expiry must be a valid future date');
      }
    }

    return errors;
  }

  async process(rows: DriverImportRow[], context: ImportContext): Promise<ImportResult> {
    const result: ImportResult = {
      successCount: 0,
      failedCount: 0,
      failedRows: [],
    };

    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'DRIVER')
      .maybeSingle();
    if (!role) {
      throw new Error('DRIVER role does not exist in the system.');
    }
    this.driverRoleId = role.id;

    const validRows: DriverImportRow[] = [];
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

    const licenses = validRows.map((r) => r.license_no);
    const { data: existingDrivers } = await supabase
      .from('transport_drivers')
      .select('license_number')
      .in('license_number', licenses);
    const existingLicensesSet = new Set(existingDrivers?.map((d) => d.license_number));

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

      if (existingLicensesSet.has(row.license_no)) {
        result.failedCount++;
        result.failedRows.push({
          row: row._rowNum,
          errors: [
            { row: row._rowNum, message: 'License number already exists', value: row.license_no },
          ],
          data: row,
        });
        continue;
      }

      let createdUserId: string | null = null;

      try {
        const tempPassword = 'DriverTempPass123!';
        const passwordHash = await NativePassword.hash(tempPassword);
        const cleanPhone = normalizePhoneNumber(row.phone)!;
        const newUser = await prisma.users.create({
          data: {
            org_id: context.schoolId,
            first_name: row.full_name,
            email: cleanEmail,
            phone: cleanPhone,
            password_hash: passwordHash,
            status: 'active',
          },
        });

        createdUserId = newUser.user_id;

        await supabase.from('user_roles').insert({
          user_id: createdUserId,
          role_id: this.driverRoleId,
        });

        await supabase.from('transport_drivers').insert({
          school_id: context.schoolId,
          user_id: createdUserId,
          license_number: row.license_no,
          phone: row.phone,
          status: 'ACTIVE',
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
