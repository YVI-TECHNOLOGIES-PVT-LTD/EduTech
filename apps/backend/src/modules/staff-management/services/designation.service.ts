import { DesignationRepository } from '../repositories/designation.repository';
import { StaffValidator } from '../validators/staff.validator';
import { DesignationNotFoundError, DuplicateDesignationNameError } from '../errors/staff.errors';
import { CreateDesignationDto } from '../dto/request/create-designation.dto';
import { UpdateDesignationDto } from '../dto/request/update-designation.dto';
import { DesignationResponseDto } from '../dto/response/designation.response.dto';
import { StaffMapper } from '../mappers/staff.mapper';
import { logger } from '../../../utils/logger';

export class DesignationService {
  static async createDesignation(
    dto: CreateDesignationDto,
    performedBy?: string | null,
  ): Promise<DesignationResponseDto> {
    StaffValidator.validateCreateDesignation(dto);

    const existing = await DesignationRepository.findByName(dto.org_id, dto.designation_name);
    if (existing) {
      throw new DuplicateDesignationNameError(dto.designation_name);
    }

    const designation = await DesignationRepository.create(dto, performedBy);

    logger.info(
      `Designation created: ${designation.designation_id} (${designation.designation_name})`,
      {
        designationId: designation.designation_id,
        name: designation.designation_name,
        performedBy,
      },
    );

    return StaffMapper.toDesignationResponseDto(designation);
  }

  static async getDesignationById(id: string): Promise<DesignationResponseDto> {
    const designation = await DesignationRepository.findById(id);
    if (!designation) {
      throw new DesignationNotFoundError(id);
    }
    return StaffMapper.toDesignationResponseDto(designation);
  }

  static async updateDesignation(
    id: string,
    dto: UpdateDesignationDto,
    performedBy?: string | null,
  ): Promise<DesignationResponseDto> {
    const existing = await DesignationRepository.findById(id);
    if (!existing) {
      throw new DesignationNotFoundError(id);
    }

    const updated = await DesignationRepository.update(id, dto, performedBy);

    logger.info(`Designation updated: ${id}`, { designationId: id, performedBy });

    return StaffMapper.toDesignationResponseDto(updated);
  }

  static async getAllDesignations(orgId?: string): Promise<DesignationResponseDto[]> {
    const designations = await DesignationRepository.findAll(orgId);
    return designations.map(StaffMapper.toDesignationResponseDto);
  }
}
