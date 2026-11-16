/**
 * User Management Constants (Stage-1)
 * Re-exports native Prisma Client user_status enum directly.
 */

import * as PrismaClientPkg from '@prisma/client';

export const user_status = (PrismaClientPkg as any).user_status || {
  active: 'active',
  inactive: 'inactive',
  suspended: 'suspended',
};

export type user_status = keyof typeof user_status;

export { user_status as UserStatus };
