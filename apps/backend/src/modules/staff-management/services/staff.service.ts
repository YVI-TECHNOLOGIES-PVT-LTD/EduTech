import { StaffRepository } from '../repositories/staff.repository';
import { StaffSearchRepository } from '../repositories/staff.search.repository';
import { DesignationRepository } from '../repositories/designation.repository';
import { StaffValidator } from '../validators/staff.validator';
import { StaffNotFoundError, DesignationNotFoundError, DuplicateEmployeeCodeError, DuplicateUserStaffError } from '../errors/staff.errors';
import { CreateStaffDto } from '../dto/request/create-staff.dto';
import { UpdateStaffDto } from '../dto/request/update-staff.dto';
import { AssignDesignationDto } from '../dto/request/assign-designation.dto';
import { AssignUserDto } from '../dto/request/assign-user.dto';
import { SearchStaffDto } from '../dto/request/search-staff.dto';
import { StaffMapper } from '../mappers/staff.mapper';
import { StaffResponseDto, PaginatedResponse } from '../dto/response/staff.response.dto';
import { StaffEvents, StaffEventType } from '../events/staff.events';
import { logger } from '../../../utils/logger';

export class StaffService {
  static async createStaff(dto: CreateStaffDto, performedBy?: string | null): Promise<StaffResponseDto> {
    StaffValidator.validateCreate(dto);

    const existingCode = await StaffRepository.findByEmployeeCode(dto.org_id, dto.employee_code);
    if (existingCode) {
      throw new DuplicateEmployeeCodeError(dto.employee_code);
    }

    const existingUser = await StaffRepository.findByUserId(dto.user_id);
    if (existingUser) {
      throw new DuplicateUserStaffError(dto.user_id);
    }

    if (dto.designation_id) {
      const designation = await DesignationRepository.findById(dto.designation_id);
      if (!designation) throw new DesignationNotFoundError(dto.designation_id);
    }

    const staff = await StaffRepository.create(dto, performedBy);

    logger.info(`Staff profile created: ${staff.staff_id} (${staff.employee_code})`, {
      staffId: staff.staff_id,
      employeeCode: staff.employee_code,
      performedBy,
    });

    // Post-commit event emission
    await StaffEvents.publish(StaffEventType.CREATED, {
      staffId: staff.staff_id,
      employeeCode: staff.employee_code,
      userId: staff.user_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StaffMapper.toStaffResponseDto(staff);
  }

  static async getStaffById(id: string): Promise<StaffResponseDto> {
    const staff = await StaffRepository.findById(id);
    if (!staff) {
      throw new StaffNotFoundError(id);
    }
    return StaffMapper.toStaffResponseDto(staff);
  }

  static async updateStaff(id: string, dto: UpdateStaffDto, performedBy?: string | null): Promise<StaffResponseDto> {
    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw new StaffNotFoundError(id);
    }

    if (dto.designation_id) {
      const designation = await DesignationRepository.findById(dto.designation_id);
      if (!designation) throw new DesignationNotFoundError(dto.designation_id);
    }

    const updated = await StaffRepository.update(id, dto, performedBy);

    logger.info(`Staff profile updated: ${id}`, { staffId: id, performedBy });

    // Post-commit event emission
    await StaffEvents.publish(StaffEventType.UPDATED, {
      staffId: id,
      employeeCode: updated.employee_code,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StaffMapper.toStaffResponseDto(updated);
  }

  static async assignDesignation(id: string, dto: AssignDesignationDto, performedBy?: string | null): Promise<StaffResponseDto> {
    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw new StaffNotFoundError(id);
    }

    const designation = await DesignationRepository.findById(dto.designation_id);
    if (!designation) throw new DesignationNotFoundError(dto.designation_id);

    const updated = await StaffRepository.assignDesignation(id, dto.designation_id, performedBy);

    logger.info(`Designation assigned to staff ${id}: ${dto.designation_id}`, { staffId: id, designationId: dto.designation_id, performedBy });

    // Post-commit event emission
    await StaffEvents.publish(StaffEventType.DESIGNATION_ASSIGNED, {
      staffId: id,
      designationId: dto.designation_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StaffMapper.toStaffResponseDto(updated);
  }

  static async assignUser(id: string, dto: AssignUserDto, performedBy?: string | null): Promise<StaffResponseDto> {
    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw new StaffNotFoundError(id);
    }

    const updated = await StaffRepository.assignUser(id, dto.user_id, performedBy);

    logger.info(`User assigned to staff ${id}: ${dto.user_id}`, { staffId: id, userId: dto.user_id, performedBy });

    // Post-commit event emission
    await StaffEvents.publish(StaffEventType.USER_LINKED, {
      staffId: id,
      userId: dto.user_id,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return StaffMapper.toStaffResponseDto(updated);
  }

  static async deleteStaff(id: string, performedBy?: string | null): Promise<{ success: boolean }> {
    const existing = await StaffRepository.findById(id);
    if (!existing) {
      throw new StaffNotFoundError(id);
    }

    await StaffRepository.delete(id);

    logger.info(`Staff profile deleted: ${id}`, { staffId: id, performedBy });

    // Post-commit event emission
    await StaffEvents.publish(StaffEventType.DELETED, {
      staffId: id,
      employeeCode: existing.employee_code,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  static async searchStaff(params: SearchStaffDto): Promise<PaginatedResponse<StaffResponseDto>> {
    const result = await StaffSearchRepository.search(params);

    return {
      data: result.items.map(StaffMapper.toStaffResponseDto),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }
}
