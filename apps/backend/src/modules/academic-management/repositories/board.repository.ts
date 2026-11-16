import prisma from '../../../lib/prismaClient';

const db: any = prisma;

export interface BoardSummary {
  board: string;
  grade_count: number;
  grades: Array<{
    grade_id: string;
    grade_code: string;
    grade_name: string;
    display_order: number;
    is_active: boolean;
  }>;
}

export class BoardRepository {
  /**
   * Retrieves the institutional board affiliation configured on the organization.
   * Utilizes the physical Stage-1 organizations table.
   */
  static async getInstitutionalAffiliation(orgId: string) {
    return db.organizations.findUnique({
      where: { org_id: orgId },
      select: {
        org_id: true,
        org_name: true,
        board_affiliation: true,
        updated_at: true,
      },
    });
  }

  /**
   * Updates the institutional board affiliation for the tenant organization.
   * Directly persists to physical organizations.board_affiliation in PostgreSQL.
   */
  static async updateInstitutionalAffiliation(orgId: string, boardAffiliation: string | null) {
    const sanitized =
      boardAffiliation && boardAffiliation.trim().length > 0
        ? boardAffiliation.trim().slice(0, 50)
        : null;
    return db.organizations.update({
      where: { org_id: orgId },
      data: {
        board_affiliation: sanitized,
        updated_at: new Date(),
      },
      select: {
        org_id: true,
        org_name: true,
        board_affiliation: true,
        updated_at: true,
      },
    });
  }

  /**
   * Queries all distinct boards configured across the tenant's grades.
   * Scoped strictly by grades.org_id.
   */
  static async getDistinctBoards(orgId: string): Promise<BoardSummary[]> {
    const grades = await db.grades.findMany({
      where: {
        org_id: orgId,
        board: { not: null },
      },
      select: {
        grade_id: true,
        grade_code: true,
        grade_name: true,
        board: true,
        display_order: true,
        is_active: true,
      },
      orderBy: { display_order: 'asc' },
    });

    const boardMap = new Map<string, BoardSummary>();

    for (const g of grades) {
      const boardKey = (g.board || '').trim();
      if (!boardKey) continue;

      if (!boardMap.has(boardKey)) {
        boardMap.set(boardKey, {
          board: boardKey,
          grade_count: 0,
          grades: [],
        });
      }

      const entry = boardMap.get(boardKey)!;
      entry.grade_count += 1;
      entry.grades.push({
        grade_id: g.grade_id,
        grade_code: g.grade_code,
        grade_name: g.grade_name,
        display_order: g.display_order,
        is_active: g.is_active,
      });
    }

    return Array.from(boardMap.values());
  }

  /**
   * Retrieves all grades assigned to a specific board for the tenant.
   */
  static async getGradesByBoard(orgId: string, board: string) {
    return db.grades.findMany({
      where: {
        org_id: orgId,
        board: { equals: board, mode: 'insensitive' },
      },
      orderBy: { display_order: 'asc' },
    });
  }
}
