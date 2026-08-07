import { StaffResponseDto } from '../dto/response/staff.response.dto';
import { DesignationResponseDto } from '../dto/response/designation.response.dto';
import { StaffSummaryDto } from '../dto/response/staff-summary.dto';

export class StaffMapper {
  static toStaffResponseDto(record: any): StaffResponseDto {
    const user = record.users_staff_user_idTousers;
    const firstName = user?.first_name || 'N/A';
    const lastName = user?.last_name || null;
    const staffName = [firstName, lastName].filter(Boolean).join(' ');

    return {
      staff_id: record.staff_id,
      id: record.staff_id,
      org_id: record.org_id,
      user_id: record.user_id,
      employee_code: record.employee_code,
      first_name: firstName,
      last_name: lastName,
      staff_name: staffName || 'N/A',
      phone: user?.phone || 'N/A',
      email: user?.email || 'N/A',
      designation_id: record.designation_id || null,
      designation_name: record.designations?.designation_name || null,
      department_id: record.department_id || null,
      joining_date: record.joining_date ? new Date(record.joining_date).toISOString() : null,
      is_active: Boolean(record.is_active),
      created_at: record.created_at
        ? new Date(record.created_at).toISOString()
        : new Date().toISOString(),
      updated_at: record.updated_at
        ? new Date(record.updated_at).toISOString()
        : new Date().toISOString(),
    };
  }

  static toDesignationResponseDto(record: any): DesignationResponseDto {
    return {
      designation_id: record.designation_id,
      id: record.designation_id,
      org_id: record.org_id,
      designation_name: record.designation_name,
      description: record.description || null,
      is_active: Boolean(record.is_active),
      created_at: record.created_at
        ? new Date(record.created_at).toISOString()
        : new Date().toISOString(),
      updated_at: record.updated_at
        ? new Date(record.updated_at).toISOString()
        : new Date().toISOString(),
    };
  }

  static toStaffSummaryDto(record: any): StaffSummaryDto {
    const user = record.users_staff_user_idTousers;
    const firstName = user?.first_name || 'N/A';
    const lastName = user?.last_name || null;
    const staffName = [firstName, lastName].filter(Boolean).join(' ');

    return {
      staff_id: record.staff_id,
      id: record.staff_id,
      employee_code: record.employee_code,
      staff_name: staffName || 'N/A',
      email: user?.email || 'N/A',
      designation_name: record.designations?.designation_name || null,
      is_active: Boolean(record.is_active),
      joining_date: record.joining_date ? new Date(record.joining_date).toISOString() : null,
      created_at: record.created_at
        ? new Date(record.created_at).toISOString()
        : new Date().toISOString(),
    };
  }
}
