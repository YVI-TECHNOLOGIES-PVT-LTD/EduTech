import {
  TimetableConflictRepository,
  ConflictAnalysisResult,
} from '../repositories/timetable-conflict.repository';
import { AcademicError } from '../errors/academic.errors';

export class TimetableConflictService {
  /**
   * Run conflict detection and validation for a timetable version
   */
  static async detectConflicts(orgId: string, versionId: string): Promise<ConflictAnalysisResult> {
    const result = await TimetableConflictRepository.analyzeConflicts(orgId, versionId);
    if (!result) {
      throw new AcademicError(`Timetable version '${versionId}' was not found`, 404, 'NOT_FOUND');
    }
    return result;
  }
}
