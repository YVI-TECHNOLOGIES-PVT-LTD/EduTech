import {
  AcademicTermRepository,
  AcademicTermRecord,
} from '../repositories/academic-term.repository';
import { ListTermsInput, ListTermsRawInput, listTermsSchema } from '../dto/request/term.dto';
import { AcademicError } from '../errors/academic.errors';

export class AcademicTermService {
  /**
   * List academic terms scoped to tenant
   */
  static async listTerms(
    orgId: string,
    rawParams: ListTermsRawInput,
  ): Promise<AcademicTermRecord[]> {
    const params = listTermsSchema.parse(rawParams);
    return AcademicTermRepository.findMany(orgId, params);
  }

  /**
   * Get single term by ID scoped to tenant
   */
  static async getTermById(orgId: string, termId: string): Promise<AcademicTermRecord> {
    const term = await AcademicTermRepository.findById(orgId, termId);
    if (!term) {
      throw new AcademicError(
        `Academic term with ID '${termId}' was not found`,
        404,
        'TERM_NOT_FOUND',
      );
    }
    return term;
  }
}
