/**
 * Academic Management Constants (Stage-1)
 * Re-exports native Prisma Client academic_year_status enum directly.
 */

import * as PrismaClientPkg from '@prisma/client';

export const academic_year_status = (PrismaClientPkg as any).academic_year_status || {
  planning: 'planning',
  open: 'open',
  admissions_open: 'admissions_open',
  teaching: 'teaching',
  examinations: 'examinations',
  closed: 'closed',
  archived: 'archived',
};

export type academic_year_status = keyof typeof academic_year_status;

export { academic_year_status as AcademicYearStatus };
