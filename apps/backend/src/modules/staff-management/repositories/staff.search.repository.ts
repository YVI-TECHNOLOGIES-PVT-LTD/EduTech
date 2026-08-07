import { SearchStaffDto } from '../dto/request/search-staff.dto';
import { StaffSearchQuery } from '../queries/staff.search';

export class StaffSearchRepository {
  static async search(params: SearchStaffDto) {
    return StaffSearchQuery.execute(params);
  }
}
