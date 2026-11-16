import { BoardRepository } from '../repositories/board.repository';
import { AcademicError } from '../errors/academic.errors';
import { logger } from '../../../utils/logger';
import { EventBus } from '../../../workflows/event-bus.service';

export interface SupportedBoardStandard {
  code: string;
  name: string;
  description: string;
  category: 'NATIONAL' | 'STATE' | 'INTERNATIONAL' | 'OTHER';
}

export const SUPPORTED_BOARD_STANDARDS: SupportedBoardStandard[] = [
  {
    code: 'CBSE',
    name: 'Central Board of Secondary Education',
    description: 'National educational board of India under the Ministry of Education.',
    category: 'NATIONAL',
  },
  {
    code: 'ICSE',
    name: 'Council for the Indian School Certificate Examinations',
    description: 'Private, national level board of school education in India.',
    category: 'NATIONAL',
  },
  {
    code: 'STATE_BOARD',
    name: 'State Board of Secondary Education',
    description: 'State government-administered school education authorities across India.',
    category: 'STATE',
  },
  {
    code: 'CAMBRIDGE',
    name: 'Cambridge Assessment International Education (CIE / IGCSE)',
    description:
      'International qualification provider offering Cambridge Primary through A-Levels.',
    category: 'INTERNATIONAL',
  },
  {
    code: 'IB',
    name: 'International Baccalaureate Organization',
    description: 'Global foundation offering PYP, MYP, and Diploma programmes.',
    category: 'INTERNATIONAL',
  },
  {
    code: 'OTHER',
    name: 'Other Autonomous / Alternative Education Board',
    description: 'Recognized alternative educational or national authority.',
    category: 'OTHER',
  },
];

export class BoardService {
  /**
   * Retrieves the comprehensive board management overview for the tenant:
   * - Organization-level board affiliation from organizations.board_affiliation
   * - Distinct boards mapped across existing grades with grade counts
   * - Official reference list of supported board standards
   */
  static async getBoardOverview(orgId: string) {
    const [orgData, configuredBoards] = await Promise.all([
      BoardRepository.getInstitutionalAffiliation(orgId),
      BoardRepository.getDistinctBoards(orgId),
    ]);

    if (!orgData) {
      throw new AcademicError('Tenant organization not found', 404, 'ORG_NOT_FOUND');
    }

    return {
      institutional_affiliation: orgData.board_affiliation || null,
      organization_id: orgData.org_id,
      organization_name: orgData.org_name,
      configured_boards: configuredBoards,
      total_configured_boards: configuredBoards.length,
      supported_standards: SUPPORTED_BOARD_STANDARDS,
      persistence_model: 'physical_postgresql_stage1',
      persisted_tables: ['organizations.board_affiliation', 'grades.board'],
    };
  }

  /**
   * Updates the institutional board affiliation for the tenant organization.
   * Persists directly to the physical Stage-1 organizations table.
   */
  static async updateBoardAffiliation(
    orgId: string,
    boardAffiliation: string | null,
    userId?: string | null,
  ) {
    const existing = await BoardRepository.getInstitutionalAffiliation(orgId);
    if (!existing) {
      throw new AcademicError('Tenant organization not found', 404, 'ORG_NOT_FOUND');
    }

    const updated = await BoardRepository.updateInstitutionalAffiliation(orgId, boardAffiliation);

    logger.info(
      `Updated institutional board affiliation for org ${orgId} to '${boardAffiliation}'`,
      {
        orgId,
        boardAffiliation,
        performedBy: userId,
      },
    );

    EventBus.publish('academic.board.affiliation.updated', {
      orgId,
      boardAffiliation,
      performedBy: userId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Retrieves all grades belonging to a specific board for the tenant.
   */
  static async getGradesForBoard(orgId: string, boardCode: string) {
    if (!boardCode || !boardCode.trim()) {
      throw new AcademicError('Board code is required', 400, 'INVALID_INPUT');
    }
    if (boardCode.trim().length > 50) {
      throw new AcademicError('Board code must not exceed 50 characters', 400, 'INVALID_INPUT');
    }

    const grades = await BoardRepository.getGradesByBoard(orgId, boardCode.trim());
    return {
      board: boardCode.trim(),
      total_grades: grades.length,
      grades,
    };
  }
}
