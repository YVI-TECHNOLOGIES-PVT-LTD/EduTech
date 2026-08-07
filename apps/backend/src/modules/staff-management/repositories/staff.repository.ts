import prisma from '../../../lib/prismaClient';
import { CreateStaffDto } from '../dto/request/create-staff.dto';
import { UpdateStaffDto } from '../dto/request/update-staff.dto';

const db: any = prisma;

export class StaffRepository {
  static async findById(staff_id: string) {
    return db.staff.findUnique({
      where: { staff_id },
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
      },
    });
  }

  static async findByUserId(user_id: string) {
    return db.staff.findUnique({
      where: { user_id },
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
      },
    });
  }

  static async findByEmployeeCode(org_id: string, employee_code: string) {
    return db.staff.findFirst({
      where: { org_id, employee_code },
    });
  }

  static async create(dto: CreateStaffDto, createdBy?: string | null) {
    return db.staff.create({
      data: {
        org_id: dto.org_id,
        user_id: dto.user_id,
        employee_code: dto.employee_code,
        designation_id: dto.designation_id || undefined,
        department_id: dto.department_id || undefined,
        joining_date: dto.joining_date ? new Date(dto.joining_date) : undefined,
        is_active: dto.is_active !== undefined ? dto.is_active : true,
        created_by: createdBy || undefined,
      },
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
      },
    });
  }

  static async update(staff_id: string, dto: UpdateStaffDto, updatedBy?: string | null) {
    const data: any = { updated_at: new Date() };
    if (dto.employee_code !== undefined) data.employee_code = dto.employee_code;
    if (dto.designation_id !== undefined) data.designation_id = dto.designation_id;
    if (dto.department_id !== undefined) data.department_id = dto.department_id;
    if (dto.joining_date !== undefined)
      data.joining_date = dto.joining_date ? new Date(dto.joining_date) : null;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (updatedBy) data.updated_by = updatedBy;

    return db.staff.update({
      where: { staff_id },
      data,
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
      },
    });
  }

  static async assignDesignation(
    staff_id: string,
    designation_id: string,
    updatedBy?: string | null,
  ) {
    return db.staff.update({
      where: { staff_id },
      data: {
        designation_id,
        updated_at: new Date(),
        updated_by: updatedBy || undefined,
      },
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
      },
    });
  }

  static async assignUser(staff_id: string, user_id: string, updatedBy?: string | null) {
    return db.staff.update({
      where: { staff_id },
      data: {
        user_id,
        updated_at: new Date(),
        updated_by: updatedBy || undefined,
      },
      include: {
        users_staff_user_idTousers: true,
        designations: true,
        departments: true,
      },
    });
  }

  static async delete(staff_id: string) {
    return db.staff.delete({
      where: { staff_id },
    });
  }
}
