import { SearchLeadDto } from '../dto/request/search-lead.dto';
import { LeadSearchQuery } from '../queries/lead.search';

export class LeadSearchRepository {
  static async search(params: SearchLeadDto) {
    return LeadSearchQuery.execute(params);
  }
}
