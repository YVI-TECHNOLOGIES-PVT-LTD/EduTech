import prisma from '../../../lib/prismaClient';
import { ListTermsInput } from '../dto/request/term.dto';

export interface AcademicTermRecord {
  academic_term_id: string;
  academic_calendar_id: string;
  academic_year_id: string;
  academic_year_name: string;
  term_name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AcademicTermRepository {
  /**
   * List academic terms scoped to tenant
   */
  static async findMany(orgId: string, params: ListTermsInput): Promise<AcademicTermRecord[]> {
    const conditions: string[] = ['ay.org_id = $1::uuid'];
    const queryParams: any[] = [orgId];

    if (params.calendar_id) {
      queryParams.push(params.calendar_id);
      conditions.push(`at.academic_calendar_id = $${queryParams.length}::uuid`);
    }

    if (params.academic_year_id) {
      queryParams.push(params.academic_year_id);
      conditions.push(`ay.academic_year_id = $${queryParams.length}::uuid`);
    }

    if (params.is_active !== undefined) {
      queryParams.push(params.is_active);
      conditions.push(`at.is_active = $${queryParams.length}::boolean`);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        at.academic_term_id,
        at.academic_calendar_id,
        ay.academic_year_id,
        ay.academic_year_name,
        at.term_name,
        at.term_number,
        at.start_date::text as start_date,
        at.end_date::text as end_date,
        at.is_active,
        at.created_at::text as created_at,
        at.updated_at::text as updated_at
      FROM academic_terms at
      JOIN academic_calendars ac ON ac.academic_calendar_id = at.academic_calendar_id
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE ${whereClause}
      ORDER BY at.term_number ASC
    `;

    return prisma.$queryRawUnsafe<AcademicTermRecord[]>(sql, ...queryParams);
  }

  /**
   * Find single term by ID scoped to tenant
   */
  static async findById(orgId: string, termId: string): Promise<AcademicTermRecord | null> {
    const sql = `
      SELECT
        at.academic_term_id,
        at.academic_calendar_id,
        ay.academic_year_id,
        ay.academic_year_name,
        at.term_name,
        at.term_number,
        at.start_date::text as start_date,
        at.end_date::text as end_date,
        at.is_active,
        at.created_at::text as created_at,
        at.updated_at::text as updated_at
      FROM academic_terms at
      JOIN academic_calendars ac ON ac.academic_calendar_id = at.academic_calendar_id
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE at.academic_term_id = $1::uuid AND ay.org_id = $2::uuid
      LIMIT 1
    `;

    const res = await prisma.$queryRawUnsafe<AcademicTermRecord[]>(sql, termId, orgId);
    return res[0] || null;
  }

  /**
   * Term metrics for overview
   */
  static async getMetrics(orgId: string): Promise<{ total_terms: number; active_terms: number }> {
    const sql = `
      SELECT
        COUNT(*)::int as total_terms,
        COUNT(CASE WHEN at.is_active = true THEN 1 END)::int as active_terms
      FROM academic_terms at
      JOIN academic_calendars ac ON ac.academic_calendar_id = at.academic_calendar_id
      JOIN academic_years ay ON ay.academic_year_id = ac.academic_year_id
      WHERE ay.org_id = $1::uuid
    `;

    const res = await prisma.$queryRawUnsafe<any[]>(sql, orgId);
    const row = res[0] || {};
    return {
      total_terms: row.total_terms || 0,
      active_terms: row.active_terms || 0,
    };
  }
}
