import {
  FacultyWorkloadRepository,
  FacultyWorkloadRecord,
} from '../repositories/faculty-workload.repository';
import { ListFacultyWorkloadRawInput } from '../dto/request/timetable.dto';
import { AcademicError } from '../errors/academic.errors';

export class FacultyWorkloadService {
  /**
   * Get paginated faculty workload distribution for tenant
   */
  static async getWorkloadList(
    orgId: string,
    params: ListFacultyWorkloadRawInput = {},
  ): Promise<{
    items: FacultyWorkloadRecord[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = params.page !== undefined ? Number(params.page) : 1;
    const limit = params.limit !== undefined ? Number(params.limit) : 50;

    const { items, total } = await FacultyWorkloadRepository.getWorkloadList(orgId, params);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get workload detail for a single faculty member
   */
  static async getWorkloadById(
    orgId: string,
    staffId: string,
    academicYearId?: string,
  ): Promise<FacultyWorkloadRecord> {
    const detail = await FacultyWorkloadRepository.getFacultyDetail(orgId, staffId, academicYearId);
    if (!detail) {
      throw new AcademicError(
        `Faculty record with staff ID '${staffId}' was not found`,
        404,
        'NOT_FOUND',
      );
    }
    return detail;
  }
}
