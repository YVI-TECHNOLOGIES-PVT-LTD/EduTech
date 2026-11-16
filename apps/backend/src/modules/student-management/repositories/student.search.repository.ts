import { SearchStudentDto } from '../dto/request/search-student.dto';
import { StudentSearchQuery } from '../queries/student.search';

export class StudentSearchRepository {
  static async search(params: SearchStudentDto) {
    return StudentSearchQuery.execute(params);
  }
}
