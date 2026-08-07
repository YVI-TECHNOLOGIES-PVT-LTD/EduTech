import { DesignationRepository } from '../repositories/designation.repository';

export class StaffDesignationQuery {
  static async getAllDesignations(orgId?: string) {
    return DesignationRepository.findAll(orgId);
  }
}
