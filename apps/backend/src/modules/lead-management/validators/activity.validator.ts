import { CreateActivityDto } from '../dto/request/create-activity.dto';
import { LeadValidationError } from '../errors/lead.errors';

export class ActivityValidator {
  static validateCreate(dto: CreateActivityDto): void {
    if (!dto.notes || dto.notes.trim().length === 0) {
      throw new LeadValidationError('Activity notes are required');
    }
  }
}
