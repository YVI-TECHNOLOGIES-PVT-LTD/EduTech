import { SearchAcademicDto } from '../dto/request/search-academic.dto';
import { AcademicSearchQuery } from '../queries/academic.search';

export class AcademicSearchRepository {
  static async search(params: SearchAcademicDto) {
    return AcademicSearchQuery.execute(params);
  }
}
