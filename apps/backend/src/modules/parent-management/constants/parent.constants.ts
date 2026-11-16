/**
 * Parent Management Constants (Stage-1)
 * Re-exports native Prisma Client relationship_type enum directly.
 */

import * as PrismaClientPkg from '@prisma/client';

export const relationship_type = (PrismaClientPkg as any).relationship_type || {
  father: 'father',
  mother: 'mother',
  guardian: 'guardian',
  grandparent: 'grandparent',
  other: 'other',
};

export type relationship_type = keyof typeof relationship_type;

export { relationship_type as RelationshipType };
