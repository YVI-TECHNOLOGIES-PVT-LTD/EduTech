import { application_status } from '@prisma/client';
import { ALLOWED_APPLICATION_STATUS_TRANSITIONS } from '../constants/admission.constants';
import { InvalidApplicationStatusTransitionError, ApplicationValidationError } from '../errors/admission.errors';
import { CreateApplicationDto } from '../dto/request/create-application.dto';

export class ApplicationValidator {
  static validateCreate(dto: CreateApplicationDto): void {
    if (!dto.lead_id) {
      throw new ApplicationValidationError('Lead ID is required');
    }
    if (!dto.org_id) {
      throw new ApplicationValidationError('Organization ID is required');
    }
    if (!dto.academic_year_id) {
      throw new ApplicationValidationError('Academic year ID is required');
    }
  }

  static validateStatusTransition(currentStatus: application_status, targetStatus: application_status): void {
    if (currentStatus === targetStatus) return;

    const allowed = ALLOWED_APPLICATION_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new InvalidApplicationStatusTransitionError(currentStatus, targetStatus);
    }
  }
}
