import { CreateActivityDto } from '../dto/request/create-activity.dto';
import { LeadValidationError } from '../errors/lead.errors';

export class ActivityValidator {
  static validateCreate(dto: CreateActivityDto): void {
    if (dto.activity_date && isNaN(Date.parse(dto.activity_date))) {
      throw new LeadValidationError('Invalid activity date format');
    }
    if (dto.next_followup_date && isNaN(Date.parse(dto.next_followup_date))) {
      throw new LeadValidationError('Invalid next follow-up date format');
    }
    if (dto.notes && dto.notes.length > 5000) {
      throw new LeadValidationError('Activity notes cannot exceed 5000 characters');
    }
  }
}
