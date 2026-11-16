import {
  SubjectRepository,
  SubjectRecord,
  SubjectCategoryRecord,
  GradeSubjectOfferingRecord,
} from '../repositories/subject.repository';
import {
  ListSubjectsInput,
  ListSubjectsRawInput,
  listSubjectsSchema,
} from '../dto/request/subject.dto';
import { AcademicError } from '../errors/academic.errors';

export class SubjectService {
  /**
   * List paginated subjects with search and filtering
   */
  static async listSubjects(
    orgId: string,
    rawParams: ListSubjectsRawInput,
  ): Promise<{
    items: SubjectRecord[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const params = listSubjectsSchema.parse(rawParams);
    const { items, total } = await SubjectRepository.findMany(orgId, params);
    const page = params.page || 1;
    const limit = params.limit || 50;

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
   * Retrieve single subject by ID
   */
  static async getSubjectById(orgId: string, subjectId: string): Promise<SubjectRecord> {
    const subject = await SubjectRepository.findById(orgId, subjectId);
    if (!subject) {
      throw new AcademicError(
        `Subject with ID '${subjectId}' was not found`,
        404,
        'SUBJECT_NOT_FOUND',
      );
    }
    return subject;
  }

  /**
   * List subject categories for tenant
   */
  static async listCategories(orgId: string): Promise<SubjectCategoryRecord[]> {
    return SubjectRepository.findCategories(orgId);
  }

  /**
   * Get subject offerings for an academic year grade
   */
  static async getGradeSubjects(
    orgId: string,
    academicYearGradeId: string,
  ): Promise<GradeSubjectOfferingRecord[]> {
    return SubjectRepository.findGradeSubjects(orgId, academicYearGradeId);
  }

  /**
   * Get digital resources associated with a subject
   */
  static async getSubjectResources(orgId: string, subjectId: string): Promise<any[]> {
    // Verify subject exists for tenant
    await this.getSubjectById(orgId, subjectId);
    return SubjectRepository.findResourcesForSubject(orgId, subjectId);
  }

  /**
   * Explicit 501 handler for subject mutations
   */
  static handleSubjectCreateUnsupported(): never {
    throw new AcademicError(
      'Subject creation is outside the finalized Stage-1 baseline and requires Stage-2 database migration approval.',
      501,
      'FEATURE_NOT_IMPLEMENTED',
    );
  }
}
