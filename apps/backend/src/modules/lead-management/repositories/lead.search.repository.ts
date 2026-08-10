import { SearchLeadDto } from '../dto/request/search-lead.dto';
import { LeadSearchQuery } from '../queries/lead.search';

export class LeadSearchRepository {
  static async search(params: SearchLeadDto, user?: any) {
    return LeadSearchQuery.execute(params, user);
  }
}
