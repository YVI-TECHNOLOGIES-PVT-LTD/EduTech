import { lead_stage } from '@prisma/client';
import { ALLOWED_STATUS_TRANSITIONS } from '../constants/lead.constants';
import { InvalidLeadStatusTransitionError, LeadValidationError } from '../errors/lead.errors';
import { CreateLeadDto } from '../dto/request/create-lead.dto';

export class LeadValidator {
  static validateCreate(dto: CreateLeadDto): void {
    if (!dto.student_first_name || dto.student_first_name.trim().length === 0) {
      throw new LeadValidationError('Student first name is required');
    }
    if (!dto.contact_name || dto.contact_name.trim().length === 0) {
      throw new LeadValidationError('Contact name is required');
    }
    if (!dto.contact_phone || dto.contact_phone.trim().length < 5) {
      throw new LeadValidationError('A valid contact phone number is required');
    }
  }

  static validateStatusTransition(
    currentStage: lead_stage,
    targetStage: lead_stage,
    remarks?: string | null,
  ): void {
    if (currentStage === targetStage) return;

    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStage] || [];
    if (!allowed.includes(targetStage)) {
      throw new InvalidLeadStatusTransitionError(currentStage, targetStage);
    }

    if (targetStage === lead_stage.rejected && (!remarks || remarks.trim().length === 0)) {
      throw new LeadValidationError('Remarks/Reason is required when marking lead as REJECTED');
    }
  }
}
