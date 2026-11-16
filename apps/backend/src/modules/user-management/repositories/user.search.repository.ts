import { SearchUserDto } from '../dto/request/search-user.dto';
import { UserSearchQuery } from '../queries/user.search';

export class UserSearchRepository {
  static async search(params: SearchUserDto) {
    return UserSearchQuery.execute(params);
  }
}
