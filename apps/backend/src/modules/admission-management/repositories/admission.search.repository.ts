import { SearchApplicationDto } from '../dto/request/search-application.dto';
import { AdmissionSearchQuery } from '../queries/admission.search';

export class AdmissionSearchRepository {
  static async search(params: SearchApplicationDto) {
    return AdmissionSearchQuery.execute(params);
  }
}
