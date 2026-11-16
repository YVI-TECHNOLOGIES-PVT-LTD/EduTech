import { SearchParentDto } from '../dto/request/search-parent.dto';
import { ParentSearchQuery } from '../queries/parent.search';

export class ParentSearchRepository {
  static async search(params: SearchParentDto) {
    return ParentSearchQuery.execute(params);
  }
}
